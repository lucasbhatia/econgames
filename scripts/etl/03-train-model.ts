/**
 * 03-train-model.ts — Train finish-position prediction model
 *
 * Ridge regression + gradient boosted stumps on 13 features.
 * Time-based train/val split. Reports R², MAE, feature importance.
 *
 * Run: npx tsx scripts/etl/03-train-model.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { JoinedHorseRace, SpeedFigureEntry, HorseSpeedProfile, ModelDiagnostics, RidgeModel, GBMModel } from "./lib/types";
import { classCode, raceKey } from "./lib/types";
import { standardize, applyStandardize, ridgeFit, ridgePredict, r2Score, mae } from "./lib/regression";
import { trainGBM, predictGBM, gbmFeatureImportance } from "./lib/gradient-boost";
import type { Matrix, Vector } from "./lib/regression";

const PROCESSED = path.resolve(__dirname, "../../src/lib/data/processed");
const VAL_CUTOFF = "2026-02-15"; // train < this, validate >= this

function readJSON<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(PROCESSED, filename), "utf-8"));
}

function writeJSON(filename: string, data: unknown) {
  const fp = path.join(PROCESSED, filename);
  fs.writeFileSync(fp, JSON.stringify(data), "utf-8");
  const size = fs.statSync(fp).size;
  console.log(`  → ${filename} (${(size / 1024).toFixed(0)} KB)`);
}

// IMPORTANT: Features must be knowable BEFORE the race happens.
// early_position_avg and late_acceleration are same-race data (leakage).
// We use only pre-race features: historical GPS metrics + race conditions.
const FEATURE_NAMES = [
  "avg_speed", "top_speed", "stride_efficiency",
  "speed_figure", "recent_best_figure",
  "ml_odds_decimal", "post_time_odds",
  "field_size", "distance", "surface_code", "class_code",
];

function buildFeatureVector(
  race: JoinedHorseRace,
  speedFigMap: Map<string, number>,
  horseProfiles: Map<string, HorseSpeedProfile>,
): number[] | null {
  const rk = raceKey(race.track_id, race.race_date, race.race_number);
  const figKey = `${race.registration_number}_${rk}`;
  const speedFig = speedFigMap.get(figKey) ?? 100;

  const profile = horseProfiles.get(race.registration_number);
  const recentBest = profile?.recent_best ?? speedFig;

  const mlOdds = isNaN(race.ml_odds_decimal) ? 5.0 : race.ml_odds_decimal; // impute median
  const ptOdds = isNaN(race.post_time_odds) ? mlOdds : race.post_time_odds;
  const fieldSize = isNaN(race.field_size) || race.field_size === 0 ? 8 : race.field_size;
  const surfaceCode = race.surface === "T" ? 1 : 0;
  const cc = classCode(race.race_type, race.grade);

  const features = [
    race.avg_speed,
    race.top_speed,
    race.stride_efficiency,
    speedFig,
    recentBest,
    mlOdds,
    ptOdds,
    fieldSize,
    race.distance,
    surfaceCode,
    cc,
  ];

  // Check for NaN/invalid
  if (features.some((f) => isNaN(f) || !isFinite(f))) return null;
  if (isNaN(race.official_position) || race.official_position <= 0) return null;

  return features;
}

function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ETL Pipeline — Step 3: Train Model       ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Load data
  const joined = readJSON<JoinedHorseRace[]>("joined-races.json");
  const speedFigures = readJSON<SpeedFigureEntry[]>("speed-figures.json");
  const horseProfiles = readJSON<HorseSpeedProfile[]>("horse-speed-profiles.json");

  console.log(`  Joined races: ${joined.length.toLocaleString()}`);
  console.log(`  Speed figures: ${speedFigures.length.toLocaleString()}`);

  // Build speed figure lookup: registration_number + race_key → figure
  const speedFigMap = new Map<string, number>();
  for (const fig of speedFigures) {
    speedFigMap.set(`${fig.registration_number}_${fig.race_key}`, fig.speed_figure);
  }

  // Build horse profile lookup
  const profileMap = new Map<string, HorseSpeedProfile>();
  for (const p of horseProfiles) {
    profileMap.set(p.registration_number, p);
  }

  // Build feature matrix and target vector
  const trainX: Matrix = [];
  const trainY: Vector = [];
  const valX: Matrix = [];
  const valY: Vector = [];

  for (const race of joined) {
    const features = buildFeatureVector(race, speedFigMap, profileMap);
    if (!features) continue;

    if (race.race_date < VAL_CUTOFF) {
      trainX.push(features);
      trainY.push(race.official_position);
    } else {
      valX.push(features);
      valY.push(race.official_position);
    }
  }

  console.log(`\n  Train set: ${trainX.length} samples (< ${VAL_CUTOFF})`);
  console.log(`  Val set: ${valX.length} samples (>= ${VAL_CUTOFF})`);

  if (trainX.length < 50 || valX.length < 20) {
    console.error("  ❌ Not enough data to train. Need at least 50 train + 20 val samples.");
    process.exit(1);
  }

  // Standardize features
  const { data: trainXStd, means, stdevs } = standardize(trainX);
  const valXStd = applyStandardize(valX, means, stdevs);

  // ── Train Ridge Regression ─────────────────────────────────────────────
  console.log("\n  Training Ridge Regression (λ=0.1)...");
  const ridge = ridgeFit(trainXStd, trainY, 0.1);

  const ridgeTrainPred = ridgePredict(trainXStd, ridge.weights, ridge.bias);
  const ridgeValPred = ridgePredict(valXStd, ridge.weights, ridge.bias);

  const ridgeR2Train = r2Score(trainY, ridgeTrainPred);
  const ridgeR2Val = r2Score(valY, ridgeValPred);
  const ridgeMaeTrain = mae(trainY, ridgeTrainPred);
  const ridgeMaeVal = mae(valY, ridgeValPred);

  console.log(`    Train R²: ${ridgeR2Train.toFixed(4)}  MAE: ${ridgeMaeTrain.toFixed(3)}`);
  console.log(`    Val   R²: ${ridgeR2Val.toFixed(4)}  MAE: ${ridgeMaeVal.toFixed(3)}`);

  // Feature importance from ridge coefficients
  const ridgeImportance: Record<string, number> = {};
  const totalWeight = ridge.weights.reduce((s, w) => s + Math.abs(w), 0) || 1;
  for (let i = 0; i < FEATURE_NAMES.length; i++) {
    ridgeImportance[FEATURE_NAMES[i]] = Math.round((Math.abs(ridge.weights[i]) / totalWeight) * 1000) / 1000;
  }

  console.log("    Top features:");
  const sortedRidge = Object.entries(ridgeImportance).sort((a, b) => b[1] - a[1]);
  for (const [name, imp] of sortedRidge.slice(0, 5)) {
    console.log(`      ${name.padEnd(25)} ${imp.toFixed(3)}`);
  }

  // ── Train Gradient Boosted Stumps ──────────────────────────────────────
  console.log("\n  Training Gradient Boosted Stumps (80 rounds, lr=0.1)...");
  const gbmResult = trainGBM(trainXStd, trainY, {
    numRounds: 80,
    learningRate: 0.1,
    minSamplesLeaf: Math.max(5, Math.floor(trainX.length * 0.01)),
  });

  const gbmTrainPred = predictGBM(trainXStd, gbmResult);
  const gbmValPred = predictGBM(valXStd, gbmResult);

  const gbmR2Train = r2Score(trainY, gbmTrainPred);
  const gbmR2Val = r2Score(valY, gbmValPred);
  const gbmMaeTrain = mae(trainY, gbmTrainPred);
  const gbmMaeVal = mae(valY, gbmValPred);

  console.log(`    Stumps used: ${gbmResult.stumps.length}`);
  console.log(`    Train R²: ${gbmR2Train.toFixed(4)}  MAE: ${gbmMaeTrain.toFixed(3)}`);
  console.log(`    Val   R²: ${gbmR2Val.toFixed(4)}  MAE: ${gbmMaeVal.toFixed(3)}`);

  const gbmImportance = gbmFeatureImportance(gbmResult.stumps, FEATURE_NAMES);
  console.log("    Top features:");
  const sortedGBM = Object.entries(gbmImportance).sort((a, b) => b[1] - a[1]);
  for (const [name, imp] of sortedGBM.slice(0, 5)) {
    console.log(`      ${name.padEnd(25)} ${imp.toFixed(3)}`);
  }

  // ── Ensemble (average of ridge + GBM) ──────────────────────────────────
  const ensembleValPred = valY.map((_, i) => (ridgeValPred[i] + gbmValPred[i]) / 2);
  const ensembleR2Val = r2Score(valY, ensembleValPred);
  const ensembleMaeVal = mae(valY, ensembleValPred);

  console.log(`\n  Ensemble Val R²: ${ensembleR2Val.toFixed(4)}  MAE: ${ensembleMaeVal.toFixed(3)}`);

  // ── A/B Comparison: Traditional-only baseline (no GPS features) ────────
  // Features 5-10 are traditional: ml_odds, post_time_odds, field_size, distance, surface_code, class_code
  const TRAD_INDICES = [5, 6, 7, 8, 9, 10]; // indices into FEATURE_NAMES
  const tradTrainX: Matrix = trainX.map((row) => TRAD_INDICES.map((i) => row[i]));
  const tradValX: Matrix = valX.map((row) => TRAD_INDICES.map((i) => row[i]));

  const { data: tradTrainStd, means: tradMeans, stdevs: tradStdevs } = standardize(tradTrainX);
  const tradValStd = applyStandardize(tradValX, tradMeans, tradStdevs);

  console.log("\n  Training Traditional-only baseline (no GPS features)...");
  const tradRidge = ridgeFit(tradTrainStd, trainY, 0.1);
  const tradValPred = ridgePredict(tradValStd, tradRidge.weights, tradRidge.bias);
  const tradR2Val = r2Score(valY, tradValPred);
  const tradMaeVal = mae(valY, tradValPred);

  console.log(`    Traditional-only Val R²: ${tradR2Val.toFixed(4)}  MAE: ${tradMaeVal.toFixed(3)}`);
  console.log(`    GPS+Traditional Val R²:  ${ensembleR2Val.toFixed(4)}  MAE: ${ensembleMaeVal.toFixed(3)}`);
  const r2Improvement = ensembleR2Val - tradR2Val;
  const maeImprovement = tradMaeVal - ensembleMaeVal;
  const r2ImprovePct = tradR2Val > 0 ? (r2Improvement / tradR2Val) * 100 : 0;
  console.log(`    GPS added value: +${r2Improvement.toFixed(4)} R² (+${r2ImprovePct.toFixed(1)}%), -${maeImprovement.toFixed(3)} MAE`);

  // ── Save model weights ─────────────────────────────────────────────────
  const ridgeModel: RidgeModel = {
    weights: ridge.weights,
    bias: ridge.bias,
    feature_names: FEATURE_NAMES,
    feature_means: means,
    feature_stdevs: stdevs,
  };

  const gbmModel: GBMModel = {
    stumps: gbmResult.stumps,
    learning_rate: gbmResult.learningRate,
    initial_prediction: gbmResult.initialPrediction,
    feature_names: FEATURE_NAMES,
    feature_means: means,
    feature_stdevs: stdevs,
  };

  const diagnostics: ModelDiagnostics = {
    ridge: {
      r2_train: Math.round(ridgeR2Train * 10000) / 10000,
      r2_val: Math.round(ridgeR2Val * 10000) / 10000,
      mae_train: Math.round(ridgeMaeTrain * 1000) / 1000,
      mae_val: Math.round(ridgeMaeVal * 1000) / 1000,
      feature_importance: ridgeImportance,
    },
    gbm: {
      r2_train: Math.round(gbmR2Train * 10000) / 10000,
      r2_val: Math.round(gbmR2Val * 10000) / 10000,
      mae_train: Math.round(gbmMaeTrain * 1000) / 1000,
      mae_val: Math.round(gbmMaeVal * 1000) / 1000,
      feature_importance: gbmImportance,
    },
    ensemble: {
      r2_val: Math.round(ensembleR2Val * 10000) / 10000,
      mae_val: Math.round(ensembleMaeVal * 1000) / 1000,
    },
    n_train: trainX.length,
    n_val: valX.length,
    train_date_range: `< ${VAL_CUTOFF}`,
    val_date_range: `>= ${VAL_CUTOFF}`,
    traditional_only: {
      r2_val: Math.round(tradR2Val * 10000) / 10000,
      mae_val: Math.round(tradMaeVal * 1000) / 1000,
    },
    gps_added_value: {
      r2_improvement: Math.round(r2Improvement * 10000) / 10000,
      r2_improvement_pct: Math.round(r2ImprovePct * 10) / 10,
      mae_improvement: Math.round(maeImprovement * 1000) / 1000,
    },
  };

  console.log("\nWriting output files...");
  writeJSON("model-weights.json", { ridge: ridgeModel, gbm: gbmModel });
  writeJSON("model-diagnostics.json", diagnostics);

  console.log("\n✓ Model training complete\n");
}

main();
