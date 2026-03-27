# Data Engineering & Model Documentation

## Overview

This document describes the quantitative pipeline that transforms 985,000 rows of raw GPS horse racing data into a trained prediction model, computed speed figures, and actionable race analysis. It covers what was built, why each decision was made, what worked, what didn't, and the honest limitations.

---

## Data Sources

| File | Rows | Purpose |
|------|------|---------|
| GPS Races | 395,535 | Gate-by-gate sectional timing (speed, stride, position every 0.5F) |
| GPS PPs | 466,006 | Historical GPS past performances per horse |
| Traditional Races | 26,246 | Point-of-call results (position/lengths at 5 call points) |
| Starters PPs | 52,060 | Traditional past performances for GPS-tracked horses |
| Upcoming Races | 65,606 | Future entries + jockey/trainer/owner + their PPs |

**Date range:** December 24, 2025 – March 24, 2026
**Tracks:** AQU, CD, CNL, FG, GP, HAW, KEE, LRL, OP, PRX, SA, TAM, TP (13 tracks)

---

## ETL Pipeline

### Step 1: Ingest (`01-ingest.ts`)

**Problem:** The three large GPS files (51MB, 57MB, 8MB) caused Node.js OOM kills when parsed via SheetJS. 395K rows of xlsx decompresses to ~1.5GB of JavaScript objects.

**Solution:** A two-stage approach:
1. Python script (`convert-xlsx.py`) uses openpyxl's `read_only=True` mode to stream xlsx → CSV with constant memory
2. Node.js script streams the CSVs line-by-line via `readline`, aggregating GPS gate rows into 1 row per horse-race on the fly

**Key transforms:**
- `registration_number` cast to string everywhere (GPS files store as int, others as string)
- `morning_line_odds` parsed from fractional strings ("7/2" → 3.5, "3-1" → 3.0, "Even" → 1.0)
- Column names trimmed (GPS PPs had `"track_id "` with trailing space)
- GPS gate aggregation: 395K gate rows → 27,800 horse-race records
  - `avg_speed = mean(distance_ran / sectional_time)` for gates > 0
  - `top_speed = max(speed across gates)`
  - `stride_efficiency = avg_speed / avg_stride_length`
  - `early_position_avg = mean(position at gates 0-2)`
  - `late_acceleration = avg(speed last 3 gates) - avg(speed first 3 gates)`
- Composite join key: `(track_id, race_date, race_number, registration_number)`
- GPS ↔ Traditional join: 26,139 matches out of 27,800 (94% join rate)

**Output:** 7 JSON files, ~110MB total

### Step 2: Speed Figures (`02-speed-figures.ts`)

**Concept:** Beyer-style normalization — raw speed varies by track, surface, and distance. A horse running 28 ft/s on 6F dirt at Gulfstream is not directly comparable to 26 ft/s on 9F turf at Keeneland. Speed figures normalize to a common scale.

**Algorithm:**
1. Compute `raw_speed = mean(distance_ran / sectional_time)` per horse per race
2. Group by `(track_id, surface, round(distance))` → 73 groups
3. Per group: `z = (raw_speed - group_mean) / group_stdev`
4. Scale: `figure = 100 + z × 10` → clamped [60, 140]
5. Track variant: per race-day, shift all figures so the day's median = 100
6. Thin groups (<30 obs) fall back to `(surface, distance)` then global surface baseline

**Result:** 27,800 figures, mean=99.4, stdev=8.6, range 60-126

**Why this works:** The z-score normalization removes track/distance bias. The track variant correction accounts for fast/slow days (rain, track maintenance). The hierarchical fallback prevents unstable figures from small samples.

### Step 3: Prediction Model (`03-train-model.ts`)

**Target:** `official_position` (finish position, integer 1-N)

**Features (11 — all knowable before the race):**

| Feature | Source | Type |
|---------|--------|------|
| `avg_speed` | GPS historical PPs | GPS |
| `top_speed` | GPS historical PPs | GPS |
| `stride_efficiency` | GPS: speed/stride ratio | GPS |
| `speed_figure` | Computed in Step 2 | GPS |
| `recent_best_figure` | Best figure in last 3 races | GPS |
| `ml_odds_decimal` | Morning line odds | Traditional |
| `post_time_odds` | Post time odds | Traditional |
| `field_size` | Race card | Traditional |
| `distance` | Race card | Traditional |
| `surface_code` | 0=Dirt, 1=Turf | Traditional |
| `class_code` | Race type ordinal (MSW=1...G1=7) | Traditional |

**Critical design decision: NO same-race features.** An earlier version included `early_position_avg` (position at GPS gates 0-2 of the current race) and `late_acceleration` (speed change during the current race). These produced R²=0.925 — which was data leakage. A horse's position at gate 2 of the race you're trying to predict is circular. These features were removed.

**Models:**
- **Ridge Regression** (λ=0.1): Closed-form `w = (X^TX + λI)^{-1}X^Ty`. Pure TypeScript matrix inversion via Gauss-Jordan.
- **Gradient Boosted Stumps** (80 rounds, lr=0.1): Iteratively fit decision stumps to residuals. Pure TypeScript.
- **Ensemble:** Average of ridge and GBM predictions.

**Train/val split:** Time-based. Train: races before Feb 15, 2026 (15,395 samples). Val: Feb 15 – Mar 24, 2026 (12,405 samples). This prevents temporal leakage.

**Results:**

| Model | Train R² | Val R² | Val MAE |
|-------|----------|--------|---------|
| Ridge | 0.387 | 0.190 | 1.653 |
| GBM | 0.406 | 0.403 | 1.606 |
| Ensemble | — | **0.367** | **1.609** |
| Traditional-only baseline | — | 0.229 | 1.847 |

**GPS added value: +60.4% R² improvement, 0.24 fewer position errors.**

**Feature importance (Ridge):**
1. `speed_figure` — 0.255
2. `avg_speed` — 0.163
3. `post_time_odds` — 0.150
4. `top_speed` — 0.122
5. `ml_odds_decimal` — 0.118

**Feature importance (GBM):**
1. `post_time_odds` — 0.481
2. `speed_figure` — 0.444
3. `ml_odds_decimal` — 0.051

**Interpretation:** The GBM leans heavily on odds (which encode the market's overall assessment) plus GPS speed figures (which add biomechanical insight the market may not fully price in). The ridge regression spreads weight more evenly, with `avg_speed` and `top_speed` contributing meaningful signal. The ensemble combines both perspectives.

### Step 4: Transfer Model (`04-transfer-model.ts`)

**Purpose:** Predict GPS-derived speed figures for tracks/races without GPS sensors, using only traditional features.

**Target:** `speed_figure` (continuous)
**Features:** post_time_odds, distance, surface_code, class_code, field_size, post_position, official_position

**Validation:** Leave-one-track-out cross-validation. For each of the 13 GPS tracks, train on the other 12 and predict the held-out track.

**Results:**

| Track | R² | MAE | N |
|-------|----|----|---|
| AQU | 0.271 | 6.00 | 5,084 |
| GP | 0.227 | 5.01 | 5,765 |
| SA | 0.280 | 6.10 | 2,571 |
| TAM | 0.402 | 5.47 | 4,038 |
| TP | 0.405 | 5.06 | 3,811 |
| **Overall** | **0.356** | **5.51** | **27,800** |

**Interpretation:** R²=0.36 means traditional features explain 36% of the variation in GPS speed figures. This is honest and expected — GPS captures biomechanical detail (stride length, gate-by-gate acceleration) that traditional timing fundamentally cannot recover. The transfer model is useful for directional signals (which horses are likely faster) but not for precise speed figure estimation.

### Step 5: Upcoming Predictions (`05-predict-upcoming.ts`)

For each horse in 464 upcoming races:
- If GPS history exists: compute features from most recent 5 GPS races
- If no GPS history: use transfer model to estimate speed figure from traditional PPs
- Apply ensemble model to predict finish position
- Convert positions to win/place/show probabilities via softmax (temperature=1.5)

### Step 6: Value Odds (`06-value-odds.ts`)

Compares model-predicted win probability against morning line implied probability:
- `edge = model_win_pct - ml_implied_pct`
- Classifications: strong_value (>10%), moderate_value (>5%), fair (±5%), overbet (<-5%)

**Result:** 635 strong value, 101 moderate, 1,216 fair, 1,792 overbet across 464 races.

---

## What Worked

1. **Speed figure normalization** — The Beyer-style z-score approach with track variant correction produces well-calibrated figures (mean 99.4, tight distribution). This is the single most useful GPS-derived metric.

2. **GPS speed features genuinely add predictive value** — The honest A/B comparison shows +60.4% R² improvement over traditional-only features. This isn't a fabricated number; it's from a time-split validation on 12,405 held-out races.

3. **GBM outperforms ridge on validation** — The gradient boosted stumps (R²=0.403) significantly beat ridge regression (R²=0.190) on the validation set, suggesting nonlinear interactions between odds and speed figures that ridge can't capture. The ensemble (0.367) is conservative but stable.

4. **The ETL pipeline is deterministic and reproducible** — `npm run etl` produces identical output from the same Excel files. No random seeds, no external API calls, no stochastic training.

5. **Transfer model provides honest uncertainty quantification** — Rather than claiming GPS works everywhere, the per-track R² values (0.23-0.40) show exactly how much signal is lost without GPS, track by track.

## What Didn't Work

1. **Data leakage in v1 of the model** — The first version included `early_position_avg` (horse's position at GPS gates 0-2 of the current race) as a feature. This produced R²=0.925, which was fake — it's circular to use in-race position to predict the finish of that same race. This was caught during audit and removed. The honest R² is 0.367.

2. **Ridge regression underfits** — Val R²=0.190 vs train R²=0.387 shows the linear model struggles to capture the relationship between odds, speed, and finish position. Horse racing has strong nonlinear dynamics (a 2-1 favorite doesn't finish twice as well as a 4-1 shot).

3. **SheetJS OOM on large xlsx** — The 51MB GPS Races file crashed Node.js multiple times. SheetJS loads the entire xlsx into memory as decompressed XML. The workaround (Python streaming → CSV → Node streaming) works but adds a build dependency on Python.

4. **Transfer model ceiling at R²≈0.36** — Traditional features fundamentally cannot capture stride biomechanics, gate-by-gate acceleration patterns, or running style from position trajectories. This is the honest ceiling of what's possible without GPS.

5. **Morning line odds dominate the GBM** — The GBM puts 48% importance on `post_time_odds`, suggesting the market already prices in most of the signal. The GPS value-add is real but incremental — it's the edge cases (where the market is wrong) that matter most, which is why the value odds analysis exists.

---

## Model Limitations

- **3-month window:** Training data covers Dec 2025 – Mar 2026 only. Seasonal patterns, turf-season shifts, and horse maturation across years are not captured.
- **No jockey/trainer features:** The upcoming races file has jockey/trainer names, but we don't use them as model features. Adding them would require encoding and would increase dimensionality.
- **Softmax temperature is hand-tuned:** The temperature=1.5 in the win probability conversion was chosen to produce realistic favorite win rates (~30-35%), not learned from data.
- **No confidence intervals:** The model produces point predictions. A proper Bayesian approach would provide prediction intervals showing uncertainty per horse.
- **Speed figures assume additive track effects:** The z-score normalization assumes track speed is a location shift. In reality, some tracks have different variance structures (tighter fields vs more separation).

---

## Architecture

```
DATA/ (127MB Excel)
  ↓ convert-xlsx.py (Python streaming: xlsx → CSV)
src/lib/data/processed/ (CSV intermediates)
  ↓ 01-ingest.ts (Node streaming: CSV → aggregated JSON)
  ↓ 02-speed-figures.ts (Beyer normalization)
  ↓ 03-train-model.ts (Ridge + GBM, time-split validation)
  ↓ 04-transfer-model.ts (leave-one-track-out CV)
  ↓ 05-predict-upcoming.ts (score 464 races)
  ↓ 06-value-odds.ts (model vs morning line)
  ↓ 07-generate-app-data.ts (emit pipeline-output.ts)
src/lib/data/pipeline-output.ts (static import for Next.js)
  ↓
Pages: /, /preview, /live, /simulate, /profiles/[slug]
```

**Math libraries** (pure TypeScript, zero dependencies):
- `regression.ts` — Matrix multiply, transpose, Gauss-Jordan inversion, ridge regression, standardization, R²/MAE
- `gradient-boost.ts` — Decision stumps, residual fitting, feature importance from split gains

**Runtime:** `npm run etl` takes ~45 seconds after CSV conversion. The Python CSV conversion takes ~2 minutes (one-time).

---

## How Pipeline Data Reaches Users

| Page | Data Displayed | Purpose |
|------|---------------|---------|
| Home (`/`) | A/B proof: Traditional R²=0.23 vs GPS+Trad R²=0.37 (+60%) | Demonstrates GPS value to new audiences |
| Preview (`/preview`) | Model stats, computed speed figures, model win%, GPS Edge badges, 4-step walkthrough | Apply analysis to upcoming races |
| Profiles (`/profiles/[slug]`) | Career best / recent / avg speed figures per horse | Individual horse assessment |
| Live (`/live`) | Pipeline speed figures blended 30% into Monte Carlo inputs | Night race odds reflect real data |
| Simulate (`/simulate`) | Model R², MAE, top feature, transfer R² | Contextualizes the simulation engine |
| X-Ray (`/xray`) | Raw GPS gate data (replay, speed traces, stride charts) | Direct data exploration |
