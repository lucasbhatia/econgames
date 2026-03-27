// ── Shared types for the ETL pipeline ──────────────────────────────────────

/** A single GPS gate measurement (one row in GPS Races xlsx) */
export interface RawGPSGate {
  track_id: string;
  race_date: string;
  race_number: number;
  distance: number;
  surface: string;
  race_type: string;
  grade: string;
  purse: number;
  registration_number: string; // always cast to string
  horse_name: string;
  gate: number;
  post_position: number;
  morning_line_odds: string;
  position: number;
  official_position: number;
  post_time_odds: number;
  sectional_time: number;
  running_time: number;
  time_behind: number;
  distance_behind: number;
  distance_ran: number;
  cumulative_distance_ran: number;
  strides: number;
  cumulative_strides: number;
  field_size: number;
}

/** Aggregated GPS data: 1 row per horse per race */
export interface GPSHorseRace {
  registration_number: string;
  horse_name: string;
  track_id: string;
  race_date: string;
  race_number: number;
  distance: number;
  surface: string;
  race_type: string;
  grade: string;
  purse: number;
  post_position: number;
  official_position: number;
  field_size: number;
  ml_odds_decimal: number;
  post_time_odds: number;
  // GPS-derived aggregates
  avg_speed: number;          // mean(distance_ran/sectional_time) for gates 1+
  top_speed: number;          // max speed across gates
  avg_stride_length: number;  // mean(distance_ran/strides)
  stride_efficiency: number;  // avg_speed / avg_stride_length
  early_position_avg: number; // mean position at gates 0-2
  late_position_avg: number;  // mean position at last 3 gates
  late_acceleration: number;  // avg speed last 3 gates - first 3 gates
  gate_speeds: number[];      // speed at each gate (for speed curve)
  gate_positions: number[];   // position at each gate
  num_gates: number;
}

/** Traditional race data: 1 row per horse per race */
export interface TraditionalHorseRace {
  registration_number: string;
  horse_name: string;
  track_id: string;
  race_date: string;
  race_number: number;
  distance: number;
  surface: string;
  race_type: string;
  grade: string;
  purse: number;
  post_position: number;
  official_position: number;
  field_size: number;
  ml_odds_decimal: number;
  post_time_odds: number;
  positions_at_calls: number[];    // position at poc 1-5
  lengths_behind_at_calls: number[]; // lengths behind at poc 1-5
  length_behind_at_finish: number;
}

/** Joined GPS + Traditional record */
export interface JoinedHorseRace extends GPSHorseRace {
  positions_at_calls: number[];
  lengths_behind_at_calls: number[];
  length_behind_at_finish: number;
  has_traditional: boolean;
}

/** Speed figure for one horse in one race */
export interface SpeedFigureEntry {
  registration_number: string;
  horse_name: string;
  track_id: string;
  race_date: string;
  race_number: number;
  race_key: string; // "track_date_racenum"
  raw_speed: number;
  speed_figure: number;
  surface: string;
  distance: number;
}

/** Per-horse aggregated speed figures */
export interface HorseSpeedProfile {
  registration_number: string;
  horse_name: string;
  career_best: number;
  recent_best: number;    // best of last 3
  avg_last_5: number;
  num_races: number;
  figures: SpeedFigureEntry[];
}

/** Model weights (ridge regression) */
export interface RidgeModel {
  weights: number[];
  bias: number;
  feature_names: string[];
  feature_means: number[];
  feature_stdevs: number[];
}

/** GBM stump */
export interface Stump {
  feature_index: number;
  threshold: number;
  left_value: number;
  right_value: number;
}

/** GBM model */
export interface GBMModel {
  stumps: Stump[];
  learning_rate: number;
  initial_prediction: number;
  feature_names: string[];
  feature_means: number[];
  feature_stdevs: number[];
}

/** Model diagnostics */
export interface ModelDiagnostics {
  ridge: {
    r2_train: number;
    r2_val: number;
    mae_train: number;
    mae_val: number;
    feature_importance: Record<string, number>;
  };
  gbm: {
    r2_train: number;
    r2_val: number;
    mae_train: number;
    mae_val: number;
    feature_importance: Record<string, number>;
  };
  ensemble: {
    r2_val: number;
    mae_val: number;
  };
  n_train: number;
  n_val: number;
  train_date_range: string;
  val_date_range: string;
  traditional_only: {
    r2_val: number;
    mae_val: number;
  };
  gps_added_value: {
    r2_improvement: number;
    r2_improvement_pct: number;
    mae_improvement: number;
  };
}

/** Transfer model diagnostics */
export interface TransferDiagnostics {
  overall_r2: number;
  overall_mae: number;
  per_track_r2: Record<string, number>;
  n_total: number;
  features_used: string[];
}

/** Upcoming race prediction */
export interface HorsePrediction {
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

export interface RacePrediction {
  race_key: string;
  track_id: string;
  race_date: string;
  race_number: number;
  has_gps: boolean;
  entries: HorsePrediction[];
}

/** Value odds entry */
export interface ValueOddsEntry {
  horse_name: string;
  race_key: string;
  model_win_pct: number;
  ml_implied_pct: number;
  edge: number;
  edge_pct: number;
  classification: "strong_value" | "moderate_value" | "fair" | "overbet";
  gps_insight: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse fractional odds string to decimal: "7/2" → 3.5, "3-1" → 3.0 */
export function parseFractionalOdds(s: string | number | null | undefined): number {
  if (s === null || s === undefined) return NaN;
  const str = String(s).trim();
  if (!str || str === "---" || str === "SCR") return NaN;
  // "7/2" format
  if (str.includes("/")) {
    const [num, den] = str.split("/").map(Number);
    if (den && !isNaN(num) && !isNaN(den)) return num / den;
  }
  // "3-1" format
  if (str.includes("-") && !str.startsWith("-")) {
    const [num, den] = str.split("-").map(Number);
    if (den && !isNaN(num) && !isNaN(den)) return num / den;
  }
  // "Even" or numeric
  if (str.toLowerCase() === "even") return 1.0;
  const n = parseFloat(str);
  return isNaN(n) ? NaN : n;
}

/** Composite race key */
export function raceKey(track: string, date: string, num: number): string {
  return `${track.trim()}_${date}_${num}`;
}

/** Composite horse-race key */
export function horseRaceKey(regNum: string, track: string, date: string, num: number): string {
  return `${regNum}_${track.trim()}_${date}_${num}`;
}

/** Race type to ordinal class code */
export function classCode(raceType: string, grade: string): number {
  const rt = (raceType || "").toUpperCase().trim();
  const g = (grade || "").toUpperCase().trim();
  if (g === "G1" || g === "1") return 7;
  if (g === "G2" || g === "2") return 6;
  if (g === "G3" || g === "3") return 5;
  if (rt === "STK") return 4;
  if (rt === "ALW" || rt === "AOC") return 3;
  if (rt === "CLM") return 2;
  if (rt === "MSW" || rt === "MCL") return 1;
  return 2; // default
}
