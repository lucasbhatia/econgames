/**
 * Pipeline data loader — bridges ETL output to the app.
 *
 * Attempts to load computed data from processed/ JSON files.
 * Falls back to hardcoded data if the ETL hasn't been run.
 * This allows the app to work both with and without the pipeline.
 */

import * as fs from "fs";
import * as path from "path";

const PROCESSED_DIR = path.resolve(__dirname, "processed");

function tryLoadJSON<T>(filename: string): T | null {
  try {
    const fp = path.join(PROCESSED_DIR, filename);
    if (fs.existsSync(fp)) {
      return JSON.parse(fs.readFileSync(fp, "utf-8"));
    }
  } catch {
    // Silently fall back
  }
  return null;
}

// ── Model Diagnostics ────────────────────────────────────────────────────

export interface ModelDiagnosticsData {
  ridge: { r2_val: number; mae_val: number; feature_importance: Record<string, number> };
  gbm: { r2_val: number; mae_val: number; feature_importance: Record<string, number> };
  ensemble: { r2_val: number; mae_val: number };
  n_train: number;
  n_val: number;
}

export interface TransferDiagnosticsData {
  overall_r2: number;
  overall_mae: number;
  per_track_r2: Record<string, number>;
  n_total: number;
}

export interface PredictionEntry {
  registration_number: string;
  horse_name: string;
  predicted_position: number;
  win_probability: number;
  place_probability: number;
  show_probability: number;
  speed_figure: number;
  speed_figure_source: "gps" | "transfer" | "unknown";
  confidence: number;
  features: Record<string, number>;
}

export interface RacePredictionData {
  race_key: string;
  track_id: string;
  race_date: string;
  race_number: number;
  has_gps: boolean;
  entries: PredictionEntry[];
}

export interface ValueOddsData {
  horse_name: string;
  race_key: string;
  model_win_pct: number;
  ml_implied_pct: number;
  edge: number;
  edge_pct: number;
  classification: "strong_value" | "moderate_value" | "fair" | "overbet";
  gps_insight: string;
}

// ── Exported loaders ─────────────────────────────────────────────────────

/** Whether the ETL pipeline has been run (processed data exists) */
export function hasPipelineData(): boolean {
  return fs.existsSync(path.join(PROCESSED_DIR, "model-diagnostics.json"));
}

export function loadModelDiagnostics(): ModelDiagnosticsData | null {
  return tryLoadJSON("model-diagnostics.json");
}

export function loadTransferDiagnostics(): TransferDiagnosticsData | null {
  return tryLoadJSON("transfer-diagnostics.json");
}

export function loadPredictions(): RacePredictionData[] {
  return tryLoadJSON("upcoming-predictions.json") ?? [];
}

export function loadValueOdds(): ValueOddsData[] {
  return tryLoadJSON("value-odds.json") ?? [];
}

/** Get transfer model R² (real if pipeline ran, fallback otherwise) */
export function getTransferR2(): { value: number; isReal: boolean } {
  const diag = loadTransferDiagnostics();
  if (diag) return { value: diag.overall_r2, isReal: true };
  return { value: 0.68, isReal: false }; // fallback — same as current hardcoded
}

/** Get prediction for a specific horse in a specific race */
export function getHorsePrediction(
  horseName: string,
  raceKey: string,
): PredictionEntry | null {
  const predictions = loadPredictions();
  for (const race of predictions) {
    if (race.race_key === raceKey) {
      const entry = race.entries.find((e) => e.horse_name === horseName);
      if (entry) return entry;
    }
  }
  return null;
}

/** Get value odds for a specific horse */
export function getHorseValueOdds(
  horseName: string,
  raceKey: string,
): ValueOddsData | null {
  const odds = loadValueOdds();
  return odds.find((o) => o.horse_name === horseName && o.race_key === raceKey) ?? null;
}
