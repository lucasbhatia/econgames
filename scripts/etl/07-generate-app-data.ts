/**
 * 07-generate-app-data.ts — Generate TypeScript data files for the Next.js app
 *
 * Reads pipeline JSON outputs and generates importable .ts files with
 * the model diagnostics, predictions, and value odds baked in.
 * This avoids runtime fs.readFileSync in client components.
 *
 * Run: npx tsx scripts/etl/07-generate-app-data.ts
 */

import * as fs from "fs";
import * as path from "path";

const PROCESSED = path.resolve(__dirname, "../../src/lib/data/processed");
const OUT_FILE = path.resolve(__dirname, "../../src/lib/data/pipeline-output.ts");

function readJSON<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(PROCESSED, filename), "utf-8"));
}

interface ModelDiag {
  ridge: { r2_val: number; mae_val: number; feature_importance: Record<string, number> };
  gbm: { r2_val: number; mae_val: number; feature_importance: Record<string, number> };
  ensemble: { r2_val: number; mae_val: number };
  n_train: number;
  n_val: number;
}

interface TransferDiag {
  overall_r2: number;
  overall_mae: number;
  per_track_r2: Record<string, number>;
}

interface Prediction {
  race_key: string;
  track_id: string;
  race_date: string;
  race_number: number;
  has_gps: boolean;
  entries: {
    registration_number: string;
    horse_name: string;
    predicted_position: number;
    win_probability: number;
    place_probability: number;
    show_probability: number;
    speed_figure: number;
    speed_figure_source: string;
    confidence: number;
  }[];
}

interface ValueOdds {
  horse_name: string;
  race_key: string;
  model_win_pct: number;
  ml_implied_pct: number;
  edge: number;
  edge_pct: number;
  classification: string;
  gps_insight: string;
}

function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  Generate App Data from Pipeline Output   ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const modelDiag = readJSON<ModelDiag>("model-diagnostics.json");
  const transferDiag = readJSON<TransferDiag>("transfer-diagnostics.json");
  const predictions = readJSON<Prediction[]>("upcoming-predictions.json");
  const valueOdds = readJSON<ValueOdds[]>("value-odds.json");

  // Horse speed profiles — career/recent figures for the profile page
  interface SpeedProfile {
    horse_name: string;
    career_best: number;
    recent_best: number;
    avg_last_5: number;
    num_races: number;
  }
  const speedProfiles = readJSON<SpeedProfile[]>("horse-speed-profiles.json");
  // Build a name→profile map, keeping only summary stats (not per-race figures)
  const horseSpeedMap: Record<string, { career_best: number; recent_best: number; avg_last_5: number; num_races: number }> = {};
  for (const p of speedProfiles) {
    horseSpeedMap[p.horse_name] = {
      career_best: p.career_best,
      recent_best: p.recent_best,
      avg_last_5: p.avg_last_5,
      num_races: p.num_races,
    };
  }
  console.log(`  Horse speed profiles: ${Object.keys(horseSpeedMap).length}`);

  // Only include top predictions per race (top 5 horses) to keep file size manageable
  const slimPredictions = predictions.map((race) => ({
    race_key: race.race_key,
    track_id: race.track_id,
    race_date: race.race_date,
    race_number: race.race_number,
    has_gps: race.has_gps,
    entries: race.entries.slice(0, 8).map((e) => ({
      horse_name: e.horse_name,
      predicted_position: e.predicted_position,
      win_probability: e.win_probability,
      speed_figure: e.speed_figure,
      speed_figure_source: e.speed_figure_source,
      confidence: e.confidence,
    })),
  }));

  // Only include value odds with significant edges
  const significantOdds = valueOdds.filter(
    (v) => v.classification === "strong_value" || v.classification === "overbet" || Math.abs(v.edge) > 3
  ).map((v) => ({
    horse_name: v.horse_name,
    race_key: v.race_key,
    model_win_pct: v.model_win_pct,
    ml_implied_pct: v.ml_implied_pct,
    edge: v.edge,
    edge_pct: v.edge_pct,
    classification: v.classification,
    gps_insight: v.gps_insight,
  }));

  // Type definitions for the generated data
  const typeDefs = `
interface PipelineDiagnostics {
  ridge: { r2_train: number; r2_val: number; mae_train: number; mae_val: number; feature_importance: Record<string, number> };
  gbm: { r2_train: number; r2_val: number; mae_train: number; mae_val: number; feature_importance: Record<string, number> };
  ensemble: { r2_val: number; mae_val: number };
  n_train: number;
  n_val: number;
  train_date_range: string;
  val_date_range: string;
  traditional_only: { r2_val: number; mae_val: number };
  gps_added_value: { r2_improvement: number; r2_improvement_pct: number; mae_improvement: number };
}

interface PipelineTransfer {
  overall_r2: number;
  overall_mae: number;
  per_track_r2: Record<string, number>;
  n_total: number;
  features_used: string[];
}

interface PipelinePredictionEntry {
  horse_name: string;
  predicted_position: number;
  win_probability: number;
  speed_figure: number;
  speed_figure_source: string;
  confidence: number;
}

interface PipelinePrediction {
  race_key: string;
  track_id: string;
  race_date: string;
  race_number: number;
  has_gps: boolean;
  entries: PipelinePredictionEntry[];
}

interface PipelineValueOdds {
  horse_name: string;
  race_key: string;
  model_win_pct: number;
  ml_implied_pct: number;
  edge: number;
  edge_pct: number;
  classification: string;
  gps_insight: string;
}

interface HorseSpeedFigures {
  career_best: number;
  recent_best: number;
  avg_last_5: number;
  num_races: number;
}`;

  const code = `// AUTO-GENERATED by scripts/etl/07-generate-app-data.ts
// Do not edit manually — re-run: npm run etl && npx tsx scripts/etl/07-generate-app-data.ts
${typeDefs}

/** Whether the quantitative pipeline has been run */
export const PIPELINE_ACTIVE = true;

/** Model performance diagnostics */
export const MODEL_DIAGNOSTICS: PipelineDiagnostics = ${JSON.stringify(modelDiag, null, 2)};

/** Transfer model diagnostics (GPS prediction from traditional features) */
export const TRANSFER_DIAGNOSTICS: PipelineTransfer = ${JSON.stringify(transferDiag, null, 2)};

/** Upcoming race predictions (top entries per race) */
export const UPCOMING_PREDICTIONS: PipelinePrediction[] = ${JSON.stringify(slimPredictions)};

/** Value odds — horses where model disagrees with morning line */
export const VALUE_ODDS: PipelineValueOdds[] = ${JSON.stringify(significantOdds)};

/** Horse speed figures from pipeline (keyed by horse name) */
export const HORSE_SPEED_FIGURES: Record<string, HorseSpeedFigures> = ${JSON.stringify(horseSpeedMap)};

/** Helper: get speed figures for a horse by name */
export function getHorseSpeedFigures(horseName: string): HorseSpeedFigures | null {
  return HORSE_SPEED_FIGURES[horseName] ?? null;
}

/** Helper: get prediction for a race */
export function getPrediction(trackId: string, raceDate: string, raceNumber: number): PipelinePrediction | null {
  return UPCOMING_PREDICTIONS.find(
    (p) => p.track_id === trackId && p.race_date === raceDate && p.race_number === raceNumber
  ) ?? null;
}

/** Helper: get value odds for a horse in a race */
export function getValueOdds(horseName: string, raceKey: string): PipelineValueOdds | null {
  return VALUE_ODDS.find(
    (v) => v.horse_name === horseName && v.race_key === raceKey
  ) ?? null;
}

/** Helper: get transfer R² (real from pipeline) */
export function getTransferR2(): number {
  return TRANSFER_DIAGNOSTICS.overall_r2;
}
`;

  fs.writeFileSync(OUT_FILE, code, "utf-8");
  const size = fs.statSync(OUT_FILE).size;
  console.log(`  → pipeline-output.ts (${(size / 1024).toFixed(0)} KB)`);
  console.log(`  Predictions: ${slimPredictions.length} races`);
  console.log(`  Value odds: ${significantOdds.length} significant entries`);
  console.log("\n✓ App data generated\n");
}

main();
