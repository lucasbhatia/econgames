/**
 * 04-transfer-model.ts — Transfer learning: predict GPS speed figures from traditional-only features
 *
 * Uses leave-one-track-out cross-validation to estimate how well GPS metrics
 * can be predicted for tracks without GPS sensors.
 *
 * Run: npx tsx scripts/etl/04-transfer-model.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { JoinedHorseRace, SpeedFigureEntry, TransferDiagnostics, RidgeModel } from "./lib/types";
import { classCode, raceKey } from "./lib/types";
import { standardize, applyStandardize, ridgeFit, ridgePredict, r2Score, mae } from "./lib/regression";
import type { Matrix, Vector } from "./lib/regression";

const PROCESSED = path.resolve(__dirname, "../../src/lib/data/processed");

function readJSON<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(PROCESSED, filename), "utf-8"));
}

function writeJSON(filename: string, data: unknown) {
  const fp = path.join(PROCESSED, filename);
  fs.writeFileSync(fp, JSON.stringify(data), "utf-8");
  const size = fs.statSync(fp).size;
  console.log(`  → ${filename} (${(size / 1024).toFixed(0)} KB)`);
}

const TRANSFER_FEATURES = [
  "post_time_odds", "distance", "surface_code", "class_code",
  "field_size", "early_position_avg", "official_position",
];

function buildTransferFeatures(race: JoinedHorseRace): number[] | null {
  const ptOdds = isNaN(race.post_time_odds) ? (isNaN(race.ml_odds_decimal) ? 5.0 : race.ml_odds_decimal) : race.post_time_odds;
  const fieldSize = isNaN(race.field_size) || race.field_size === 0 ? 8 : race.field_size;
  const surfaceCode = race.surface === "T" ? 1 : 0;
  const cc = classCode(race.race_type, race.grade);
  // For transfer model, we use early_position_avg as a proxy (it comes from traditional POC data too)
  const earlyPos = race.early_position_avg;
  const offPos = race.official_position;

  const features = [ptOdds, race.distance, surfaceCode, cc, fieldSize, earlyPos, offPos];

  if (features.some((f) => isNaN(f) || !isFinite(f))) return null;
  return features;
}

function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ETL Pipeline — Step 4: Transfer Model    ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const joined = readJSON<JoinedHorseRace[]>("joined-races.json");
  const speedFigures = readJSON<SpeedFigureEntry[]>("speed-figures.json");

  // Build speed figure lookup
  const figMap = new Map<string, number>();
  for (const fig of speedFigures) {
    figMap.set(`${fig.registration_number}_${fig.race_key}`, fig.speed_figure);
  }

  // Build dataset: features (traditional-only) → target (GPS speed figure)
  interface Sample {
    features: number[];
    target: number; // speed figure
    track: string;
  }

  const samples: Sample[] = [];
  for (const race of joined) {
    const rk = raceKey(race.track_id, race.race_date, race.race_number);
    const figKey = `${race.registration_number}_${rk}`;
    const target = figMap.get(figKey);
    if (target === undefined) continue;

    const features = buildTransferFeatures(race);
    if (!features) continue;

    samples.push({ features, target, track: race.track_id.trim() });
  }

  console.log(`  Total samples: ${samples.length.toLocaleString()}`);

  // Get unique tracks
  const tracks = [...new Set(samples.map((s) => s.track))];
  console.log(`  Tracks: ${tracks.join(", ")} (${tracks.length})`);

  // ── Leave-one-track-out cross-validation ───────────────────────────────
  console.log("\n  Running leave-one-track-out CV...\n");

  const perTrackR2: Record<string, number> = {};
  let allActual: number[] = [];
  let allPredicted: number[] = [];

  for (const holdout of tracks) {
    const train = samples.filter((s) => s.track !== holdout);
    const test = samples.filter((s) => s.track === holdout);

    if (train.length < 30 || test.length < 5) {
      console.log(`    Skip ${holdout}: train=${train.length}, test=${test.length} (too few)`);
      continue;
    }

    const trainX: Matrix = train.map((s) => s.features);
    const trainY: Vector = train.map((s) => s.target);
    const testX: Matrix = test.map((s) => s.features);
    const testY: Vector = test.map((s) => s.target);

    const { data: trainXStd, means, stdevs } = standardize(trainX);
    const testXStd = applyStandardize(testX, means, stdevs);

    const model = ridgeFit(trainXStd, trainY, 0.1);
    const preds = ridgePredict(testXStd, model.weights, model.bias);

    const trackR2 = r2Score(testY, preds);
    const trackMae = mae(testY, preds);

    perTrackR2[holdout] = Math.round(trackR2 * 10000) / 10000;
    console.log(`    ${holdout.padEnd(6)} R²: ${trackR2.toFixed(4)}  MAE: ${trackMae.toFixed(2)}  (train=${train.length}, test=${test.length})`);

    allActual = allActual.concat(testY);
    allPredicted = allPredicted.concat(preds);
  }

  const overallR2 = r2Score(allActual, allPredicted);
  const overallMae = mae(allActual, allPredicted);

  console.log(`\n  Overall CV R²: ${overallR2.toFixed(4)}  MAE: ${overallMae.toFixed(2)}`);

  // ── Train final model on all data ──────────────────────────────────────
  console.log("\n  Training final transfer model on all data...");

  const allX: Matrix = samples.map((s) => s.features);
  const allY: Vector = samples.map((s) => s.target);

  const { data: allXStd, means: finalMeans, stdevs: finalStdevs } = standardize(allX);
  const finalModel = ridgeFit(allXStd, allY, 0.1);

  const finalPreds = ridgePredict(allXStd, finalModel.weights, finalModel.bias);
  const finalR2 = r2Score(allY, finalPreds);

  console.log(`  Full-data R²: ${finalR2.toFixed(4)}`);

  // Save
  const transferWeights: RidgeModel = {
    weights: finalModel.weights,
    bias: finalModel.bias,
    feature_names: TRANSFER_FEATURES,
    feature_means: finalMeans,
    feature_stdevs: finalStdevs,
  };

  const diagnostics: TransferDiagnostics = {
    overall_r2: Math.round(overallR2 * 10000) / 10000,
    overall_mae: Math.round(overallMae * 100) / 100,
    per_track_r2: perTrackR2,
    n_total: samples.length,
    features_used: TRANSFER_FEATURES,
  };

  console.log("\nWriting output files...");
  writeJSON("transfer-weights.json", transferWeights);
  writeJSON("transfer-diagnostics.json", diagnostics);

  console.log("\n✓ Transfer model complete\n");
}

main();
