# GPS Racing Intelligence

**EconGames 2026 — 36-Hour Data Challenge Submission**

> *We are interested in exploring how to better leverage our GPS data to enhance race analysis and create more intuitive, engaging ways to understand race performance that can attract and retain new audiences to the sport. Using the provided datasets, your task is to develop a data-driven product or tool that utilizes GPS data to deliver meaningful insights beyond traditional racing metrics. Your solution should be supported by analysis of both traditional and GPS variables and clearly demonstrate the added value of GPS data. You are encouraged to consider how your approach could extend to races or tracks where GPS data may not be available, while still maintaining practical usability. Finally, apply your solution to an upcoming race(s) and show how it would be used in practice and why it would matter.*

**Live app:** [econgames2026.com](https://econgames2026.com)

---

## What This Is

GPS Racing Intelligence is a full-stack data analytics platform that transforms 985,000 rows of real GPS horse racing data into an interactive tool anyone can use — from first-time racing fans to experienced handicappers.

It answers the challenge prompt through six integrated products:

| Product | What It Does | Where |
|---------|-------------|-------|
| **Race X-Ray** | Replay any GPS-tracked race with gate-by-gate speed, position, and stride data | `/xray` |
| **Race Preview** | Analyze upcoming races with model-predicted win probabilities, speed ratings, and GPS Edge analysis | `/preview` |
| **Race Simulator** | Build custom races from 10 real GPS tracks with 72 real horses, see live odds from 500 Monte Carlo simulations | `/simulate` |
| **Race Night** | Live 6-minute race cycles with real-time betting, school leaderboards, and GPS-enhanced odds | `/live` |
| **Horse Profiles** | Individual horse pages with GPS speed patterns, stride efficiency, and pipeline-computed speed ratings | `/profiles` |
| **Home / GPS Story** | Side-by-side proof of GPS value: Traditional-only model (23% accuracy) vs GPS+Traditional (37% accuracy, +60%) | `/` |

---

## The Data

Five Excel files totaling 127MB and 985,000 rows:

| File | Rows | What It Contains |
|------|------|-----------------|
| GPS Races | 395,535 | Gate-by-gate GPS telemetry: speed (ft/s), stride length (ft), position, sectional time at every half-furlong (~200m) checkpoint |
| GPS PPs | 466,006 | Historical GPS past performances — same gate-level detail for each horse's previous races |
| Traditional Races | 26,246 | Standard race results: finish position, point-of-call positions, lengths behind, odds |
| Starters PPs | 52,060 | Traditional past performances for GPS-tracked horses |
| Upcoming Races | 65,606 | Future race entries with jockey, trainer, owner, and historical PPs (3 sheets) |

**12,961 unique horses** across **10 GPS-equipped tracks**: Gulfstream Park (FL), Santa Anita (CA), Oaklawn Park (AR), Tampa Bay Downs (FL), Aqueduct (NY), Fair Grounds (LA), Turfway Park (KY), Laurel Park (MD), Sam Houston (TX), Colonial Downs (VA).

**Date range:** December 24, 2025 – March 24, 2026.

---

## How It Works — The Full Pipeline

### Step 1: Data Ingestion

The raw Excel files are too large for JavaScript (51MB xlsx → 1.5GB in memory). We use a two-stage approach:

1. **Python streaming converter** (`scripts/etl/convert-xlsx.py`): Reads xlsx files using openpyxl's read-only mode with constant memory, outputs CSV
2. **Node.js streaming aggregator** (`scripts/etl/01-ingest.ts`): Reads CSVs line-by-line, aggregates 395,535 GPS gate rows into 27,800 horse-race records

Key transforms:
- `registration_number` cast from INT to STRING across all files (type mismatch in source data)
- `morning_line_odds` parsed from fractional strings ("7/2" → 3.5)
- GPS gates aggregated per horse-race: avg_speed, top_speed, stride_efficiency, early_position_avg, late_acceleration, speed curve
- GPS ↔ Traditional joined on composite key `(track_id, race_date, race_number, registration_number)` — **94% match rate** (26,139 of 27,800)

### Step 2: Speed Figures

**Beyer-style normalized speed ratings** (`scripts/etl/02-speed-figures.ts`)

Raw GPS speed varies by track, surface, and distance. A horse running 28 ft/s at Gulfstream 6F dirt isn't directly comparable to 26 ft/s at Keeneland 9F turf. Speed figures normalize to a common scale:

1. Compute raw speed per horse per race: `mean(distance_ran / sectional_time)` for gates after the start
2. Group by `(track_id, surface, round(distance))` — 73 groups
3. Z-score each horse: `z = (raw_speed - group_mean) / group_stdev`
4. Scale to 100 ± 10: `figure = 100 + z × 10`, clamped [60, 140]
5. Track variant correction: shift all figures per race-day so the day's median = 100
6. Thin groups (<30 obs) fall back to `(surface, distance)` then global surface baseline

**Result:** 27,800 speed figures across 12,961 horses. Mean: 99.4. Distribution: approximately normal, centered on 100.

### Step 3: Prediction Model

**Ridge regression + gradient boosted stumps** (`scripts/etl/03-train-model.ts`)

Pure TypeScript implementation — no Python, no external ML libraries.

**Target:** Official finish position (integer, 1 through field size)

**Features (11 — all knowable before the race):**

| # | Feature | Source | Type |
|---|---------|--------|------|
| 1 | `avg_speed` | Horse's average GPS speed across recent races | GPS |
| 2 | `top_speed` | Peak GPS speed ever recorded | GPS |
| 3 | `stride_efficiency` | Speed / stride length ratio (biomechanical efficiency) | GPS |
| 4 | `speed_figure` | Normalized speed rating from Step 2 | GPS |
| 5 | `recent_best_figure` | Best speed figure in last 3 races | GPS |
| 6 | `ml_odds_decimal` | Morning line odds (market estimate) | Traditional |
| 7 | `post_time_odds` | Final odds at race start | Traditional |
| 8 | `field_size` | Number of horses in race | Traditional |
| 9 | `distance` | Race distance in furlongs | Traditional |
| 10 | `surface_code` | Dirt (0) or Turf (1) | Traditional |
| 11 | `class_code` | Race type ordinal (MSW=1 through G1=7) | Traditional |

**Critical design decision:** We removed `early_position_avg` and `late_acceleration` from the feature set. An earlier version included these (GPS position at gates 0-2 of the race being predicted), which produced R²=0.925 — but this was **data leakage**. A horse's position at gate 2 of a race you're trying to predict is circular. The honest model uses only pre-race features.

**Train/validation split:** Time-based. Train: races before Feb 15, 2026 (15,395 samples). Validate: Feb 15 – Mar 24, 2026 (12,405 samples).

**Math — Ridge Regression:**
```
w = (X^T X + λI)^{-1} X^T y    where λ = 0.1
```
Implemented as Gauss-Jordan elimination on an 11×11 matrix. Pure TypeScript, no numpy.

**Math — Gradient Boosted Stumps:**
80 rounds of depth-1 decision trees (stumps), learning rate 0.1. Each round fits a single split on the residuals from the previous round. Feature importance is the sum of MSE reduction (gain) per feature across all rounds.

**Results:**

| Model | Validation R² | Validation MAE |
|-------|--------------|----------------|
| Ridge Regression | 0.190 | 1.65 positions |
| Gradient Boosted Stumps | 0.403 | 1.61 positions |
| **Ensemble (average)** | **0.367** | **1.61 positions** |
| Traditional-only baseline | 0.229 | 1.85 positions |

**GPS added value: +60.4% R² improvement over traditional-only features, 0.24 fewer position errors.**

Top features by importance:
1. `speed_figure` (GPS) — 0.255 (Ridge), 0.444 (GBM)
2. `post_time_odds` (Traditional) — 0.150 (Ridge), 0.481 (GBM)
3. `avg_speed` (GPS) — 0.163 (Ridge)
4. `top_speed` (GPS) — 0.122 (Ridge)

### Step 4: Transfer Model for Non-GPS Tracks

**Leave-one-track-out cross-validation** (`scripts/etl/04-transfer-model.ts`)

For tracks without GPS sensors, we estimate what GPS speed figures would be using only traditional features. Train on N-1 GPS tracks, predict the held-out track, repeat for all 10.

**Transfer model R²: 0.356** (explains 36% of GPS speed figure variation from traditional data alone)

Per-track results:

| Track | R² | Interpretation |
|-------|----|----|
| Oaklawn Park | 0.425 | Best transfer — traditional signals are strong |
| Aqueduct | 0.418 | Good transfer |
| Turfway Park | 0.405 | Good transfer |
| Tampa Bay | 0.402 | Good transfer |
| Gulfstream | 0.227 | Weakest — unique track characteristics that traditional data can't capture |

This means: for a track we've never had GPS at, we can still estimate horse ability, but with ~36% of the precision of real GPS. The app transparently communicates this with a yellow warning badge: *"Non-GPS Track — predictions from transfer model (R² = 0.36)"*.

### Step 5: Upcoming Race Predictions

**Score 464 real upcoming races** (`scripts/etl/05-predict-upcoming.ts`)

For each horse in each upcoming race:
1. If GPS PPs exist → compute features directly from GPS history
2. If no GPS history → use transfer model to estimate speed figure
3. Build 11-feature vector → apply trained model → predicted finish position
4. Convert positions to win/place/show probabilities via softmax (temperature=1.5)

### Step 6: Value Odds — GPS Edge

**Model predictions vs morning line** (`scripts/etl/06-value-odds.ts`)

```
edge = model_win_probability - morning_line_implied_probability
```

Classifications:
- **Strong Value** (+10%): GPS data sees something the morning line doesn't
- **Moderate Value** (+5%): Slight GPS advantage
- **Fair** (±5%): Odds look about right
- **Overbet** (−5%): Public may be overvaluing this horse

Result: 635 strong value plays, 1,216 fair, 1,792 overbet across 464 races.

### Step 7: Simulation Engine

**Monte Carlo race simulation** (`src/lib/simulation/engine.ts`)

Each simulated race:
1. Resample each horse's GPS speed curve to the race distance
2. Normalize curve mean to match `avgSpeed` (source of truth for baseline ability)
3. Add stochastic noise: Box-Muller normal distribution with `consistency` as stdev (0.2-0.9, derived from finish position variance)
4. Apply GPS factors per gate: `avgSpeed` edge vs field, `topSpeed` ceiling in drive zone, `strideEfficiency` as late-race fatigue resistance
5. Apply traditional factors: running style (Front Runner/Stalker/Closer), surface/distance suitability, track bias, recent form, age, career wins
6. Compute race time: `sum(660 ft / speed per furlong)`, rank by time

For the live betting game (Race Night):
- 200 simulations per race epoch → win/place/show probabilities
- 15% vigorish applied to profit (not total return) → decimal odds
- Odds converted to traditional fractional display via nearest-match table

For the simulator:
- 500 simulations (live) / 1,000 (deep analysis)
- Fair odds (no vig) displayed
- Track presets load real GPS horses from the pipeline with data-derived consistency values

---

## How to Use the Tool

### For a First-Time Visitor

1. **Start at the home page** (`/`). The "Why GPS Changes Everything" section shows a side-by-side comparison: what traditional data tells you vs what GPS reveals. The A/B proof panel shows the real numbers — GPS adds 60% accuracy.

2. **Watch a race in X-Ray** (`/xray`). Pick a race, hit replay. You'll see horses moving across the track with their speed plotted in real time. Toggle between Replay, Speed traces, and Stride analysis. This is the raw GPS data — no model involved.

3. **Check a horse's profile** (`/profiles`). Pick any horse. You'll see their GPS speed pattern (how they run each stage of a race), their stride efficiency, and their pipeline-computed speed rating (100 = average, 110+ = elite).

4. **Preview an upcoming race** (`/preview`). Select a race. The page shows the pace scenario (how many front runners vs closers), each horse's computed speed rating, their win probability from the model, and a GPS Edge badge (green = the GPS model sees value the morning line doesn't). The 4-step walkthrough at the bottom explains how to use this analysis.

5. **Run a simulation** (`/simulate`). Click a track template (e.g., Gulfstream Park). Eight real GPS-tracked horses auto-load with their actual speed curves and data-derived consistency. The Monte Carlo runs 500 simulations and shows live odds — entirely driven by the data, no hardcoded values. You can swap horses, change the distance, or create a custom horse.

6. **Play Race Night** (`/live`). Create an account (name + PIN). Every 6 minutes a new race generates with GPS-enhanced odds. Place bets during the 4:40 betting window. Watch the simulation play out. Compete on the school leaderboard.

### For an Analyst

The full pipeline is reproducible:

```bash
cd app

# One-time: convert large xlsx to CSV (Python, ~2 min)
python3 scripts/etl/convert-xlsx.py

# Run the full pipeline (~45 seconds)
npm run etl:ingest       # Excel → aggregated JSON
npm run etl:figures      # Speed figures
npm run etl:train        # Ridge + GBM model
npm run etl:transfer     # Transfer model
npm run etl:predict      # Score upcoming races
npm run etl:value        # GPS Edge analysis

# Generate client-side data file
npx tsx scripts/etl/07-generate-app-data.ts

# Build the app
npm run build
```

All model weights, diagnostics, and predictions are in `src/lib/data/processed/`:
- `model-diagnostics.json` — R², MAE, feature importance for both models + A/B comparison
- `transfer-diagnostics.json` — per-track R² from leave-one-track-out CV
- `upcoming-predictions.json` — 464 race predictions with win/place/show probabilities
- `value-odds.json` — GPS Edge classifications for 3,744 horse entries
- `horse-speed-profiles.json` — 12,961 horse speed figures (career best, recent, average)
- `gps-races.json` — 27,800 aggregated GPS horse-race records
- `traditional-races.json` — 26,246 traditional race records

---

## Architecture

```
DATA/ (127MB Excel, 5 files)
  ↓ convert-xlsx.py (Python streaming: xlsx → CSV)
src/lib/data/processed/ (CSV intermediates)
  ↓ 01-ingest.ts     → gps-races.json (27,800 records)
  ↓ 02-speed-figures.ts → speed-figures.json (27,800 figures)
  ↓ 03-train-model.ts   → model-weights.json + diagnostics
  ↓ 04-transfer-model.ts → transfer-weights.json + diagnostics
  ↓ 05-predict-upcoming.ts → upcoming-predictions.json (464 races)
  ↓ 06-value-odds.ts    → value-odds.json (3,744 entries)
  ↓ 07-generate-app-data.ts → pipeline-output.ts (client import)
  ↓
Next.js 16 App (TypeScript, React 19, Tailwind 4)
  ├── Simulation Engine (Monte Carlo, Box-Muller, injectable RNG)
  ├── Glossary System (35 terms, hover tooltips, human-readable formatters)
  ├── Error Boundaries (race viz, bet slip, leaderboard wrapped)
  └── Supabase Backend (players, bets, leaderboard, RLS + RPC security)
```

**Math Libraries** (pure TypeScript, zero external dependencies):
- `regression.ts` — Matrix multiply, transpose, Gauss-Jordan inversion, ridge regression, standardization, R²/MAE
- `gradient-boost.ts` — Gradient boosted stumps (depth-1 trees), feature importance from split gains

**Key dependencies:** Next.js 16.2, React 19.2, Tailwind 4, Framer Motion 12, Recharts 3, GSAP 3, Supabase 2, SheetJS (xlsx)

---

## Answering the Challenge

### "Leverage GPS data to enhance race analysis"

GPS data is wired into every layer:
- **Speed figures** normalize GPS sectional speeds by track/surface/distance
- **Stride efficiency** measures biomechanical economy (speed per stride) — invisible in traditional data
- **Speed curves** show how horses run each stage — acceleration, fatigue, finishing kick patterns
- **Running style classification** derived from GPS gate positions, not subjective handicapper labels
- **Monte Carlo simulation** uses GPS speed curves as the base for every simulated race

### "Create intuitive, engaging ways to understand race performance"

The app is built for newcomers:
- **Glossary system** with 35+ terms: hover any jargon for a plain-English tooltip with sports analogies
- **Human-readable numbers**: speeds shown in mph alongside ft/s, speed figures show "100 = average" context, model accuracy explained as "within 1.6 positions"
- **Interactive race replay**: watch GPS-reconstructed races with speed overlays
- **4-step walkthrough** on the preview page: pace scenario → GPS Edge → model vs morning line → decision
- **Live betting game**: 6-minute race cycles with school leaderboards for competitive engagement

### "Demonstrate added value of GPS data"

Proven with a head-to-head A/B test on 12,405 held-out races:
- **Traditional-only model: R² = 0.229** (23% accuracy)
- **GPS + Traditional model: R² = 0.367** (37% accuracy)
- **GPS improvement: +60.4%**
- Displayed on the home page with three comparison cards and a plain-English explanation

### "Extend to races or tracks where GPS data may not be available"

Transfer model with leave-one-track-out cross-validation:
- **R² = 0.356** across 10 GPS tracks (trains on 9, tests on the held-out 1)
- Transparently communicated: yellow warning badge with R² and explanation
- Preview page shows which races use real GPS vs transfer estimates
- Each horse flagged as "gps" or "transfer" source with confidence score

### "Apply to upcoming races and show practical usage"

- **464 real upcoming races scored** with win/place/show probabilities
- **3,744 horse entries analyzed** — each with speed figure, source flag, confidence
- **GPS Edge analysis**: 635 strong value plays identified where the model disagrees with morning line
- **Preview page walkthrough**: step-by-step guide showing exactly how to use the analysis for a specific race

---

## Security (300-User Event Ready)

- **Supabase RLS**: Direct UPDATE blocked on players table; bankroll only changes via atomic RPC
- **Idempotent payouts**: Unique index on `(player_id, race_epoch)` prevents double-payout on refresh
- **Server-side payout**: `process_race_result` Postgres function with row lock + transaction
- **Clock sync**: Server time fetched on page load, offset applied to all phase calculations
- **Bet time buffer**: Bets blocked 2 seconds before betting phase ends
- **PIN auth**: 4-digit PIN hashed with SHA-256 client-side, rate-limited (5 attempts → 30s lockout)
- **Field size guards**: Exotic bets (exacta, trifecta, superfecta) only available when field is large enough

To activate server-side protections, run `supabase/002-security.sql` in the Supabase SQL Editor.

---

## What Worked, What Didn't

### Worked
- **Speed figure normalization** — well-calibrated (mean 99.4), most useful single GPS feature
- **GPS genuinely adds predictive value** — +60% R² is real, from honest time-split validation
- **GBM outperforms ridge** — nonlinear interactions between odds and speed figures matter
- **Deterministic pipeline** — `npm run etl` produces identical output from same data every time
- **Anyone-friendly glossary** — 35 terms with analogies makes the tool accessible
- **Track presets** — one-click loads 8 real GPS horses per track with data-derived everything

### Didn't Work
- **Data leakage in v1** — `early_position_avg` (same-race GPS position) produced fake R²=0.925. Caught in audit and removed.
- **SheetJS OOM** — 51MB xlsx crashes Node.js. Fixed with Python streaming → CSV → Node streaming.
- **Ridge regression underfits** — val R²=0.19 vs train R²=0.39. Horse racing has strong nonlinear dynamics.
- **Transfer model ceiling at R²≈0.36** — traditional features fundamentally can't capture stride biomechanics.
- **Morning line odds dominate GBM** — the market already prices in most signal. GPS value is incremental but real.

---

## Running Locally

```bash
git clone https://github.com/lucasbhatia/econgames.git
cd econgames/app
npm install

# Set up Supabase (optional — app works without it, just no leaderboard)
cp .env.example .env.local
# Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run the ETL pipeline (requires Python 3 for xlsx conversion)
python3 scripts/etl/convert-xlsx.py    # One-time xlsx → csv (~2 min)
npm run etl:ingest                      # 30 seconds
npm run etl:figures && npm run etl:train && npm run etl:transfer
npm run etl:predict && npm run etl:value
npx tsx scripts/etl/07-generate-app-data.ts

# Start development server
npm run dev
```

---

*GPS Racing Intelligence — because traditional race data tells you what happened. GPS data reveals why it happened, and what's likely to happen next.*
