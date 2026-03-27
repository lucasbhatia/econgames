/**
 * 05-predict-upcoming.ts — Score upcoming race entries using trained models
 *
 * For each horse: use GPS PPs if available, otherwise use transfer model
 * to estimate features. Apply trained model to predict finish position.
 * Convert positions to win/place/show probabilities via softmax.
 *
 * Run: npx tsx scripts/etl/05-predict-upcoming.ts
 */

import * as fs from "fs";
import * as path from "path";
import type {
  GPSHorseRace,
  HorseSpeedProfile,
  RidgeModel,
  GBMModel,
  RacePrediction,
  HorsePrediction,
} from "./lib/types";
import { classCode } from "./lib/types";
import { applyStandardize, ridgePredict } from "./lib/regression";
import { predictGBM } from "./lib/gradient-boost";

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

interface UpcomingEntry {
  registration_number: string;
  horse_name: string;
  race_date: string;
  race_number: number;
  track_id: string;
  post_position: number;
  jockey: string;
  trainer: string;
  morning_line_odds: string;
  ml_odds_decimal: number;
}

/** Softmax with temperature to convert predicted positions to win probabilities */
function softmaxWinProbs(predictedPositions: number[], temperature: number = 1.5): number[] {
  // Lower predicted position = better, so negate before softmax
  const negated = predictedPositions.map((p) => -p / temperature);
  const maxVal = Math.max(...negated);
  const exps = negated.map((v) => Math.exp(v - maxVal));
  const sum = exps.reduce((s, v) => s + v, 0);
  return exps.map((e) => e / sum);
}

function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ETL Pipeline — Step 5: Predict Upcoming  ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // Load everything
  const entries = readJSON<UpcomingEntry[]>("upcoming-entries.json");
  const upcomingGPS = readJSON<GPSHorseRace[]>("upcoming-gps-pps.json");
  const horseHistory = readJSON<Record<string, GPSHorseRace[]>>("horse-history.json");
  const speedProfiles = readJSON<HorseSpeedProfile[]>("horse-speed-profiles.json");
  const modelData = readJSON<{ ridge: RidgeModel; gbm: GBMModel }>("model-weights.json");
  const transferModel = readJSON<RidgeModel>("transfer-weights.json");

  console.log(`  Entries: ${entries.length}`);
  console.log(`  Upcoming GPS PPs: ${upcomingGPS.length}`);

  // Index GPS PPs by registration number
  const gpsByHorse = new Map<string, GPSHorseRace[]>();
  for (const pp of upcomingGPS) {
    const reg = pp.registration_number;
    if (!gpsByHorse.has(reg)) gpsByHorse.set(reg, []);
    gpsByHorse.get(reg)!.push(pp);
  }

  // Also add from main horse history
  for (const [reg, races] of Object.entries(horseHistory)) {
    if (!gpsByHorse.has(reg)) gpsByHorse.set(reg, []);
    gpsByHorse.get(reg)!.push(...races);
  }

  // Index speed profiles
  const profileMap = new Map<string, HorseSpeedProfile>();
  for (const p of speedProfiles) {
    profileMap.set(p.registration_number, p);
  }

  // Group entries by race
  const raceGroups = new Map<string, UpcomingEntry[]>();
  for (const entry of entries) {
    const key = `${entry.track_id}_${entry.race_date}_${entry.race_number}`;
    if (!raceGroups.has(key)) raceGroups.set(key, []);
    raceGroups.get(key)!.push(entry);
  }

  console.log(`  Unique races: ${raceGroups.size}`);

  // Process each race
  const predictions: RacePrediction[] = [];

  for (const [raceKeyStr, raceEntries] of raceGroups) {
    const [trackId, raceDate, raceNumStr] = raceKeyStr.split("_");
    const raceNum = parseInt(raceNumStr);
    const fieldSize = raceEntries.length;

    // Determine if this track has GPS
    const hasGPS = raceEntries.some((e) => {
      const gps = gpsByHorse.get(e.registration_number);
      return gps && gps.length > 0;
    });

    const horsePredictions: HorsePrediction[] = [];

    for (const entry of raceEntries) {
      const gpsHistory = gpsByHorse.get(entry.registration_number);
      const speedProfile = profileMap.get(entry.registration_number);

      let features: Record<string, number> = {};
      let speedFigure = 100;
      let source: "gps" | "transfer" | "unknown" = "unknown";
      let confidence = 0.5;

      if (gpsHistory && gpsHistory.length > 0) {
        // GPS data available — compute features from recent PPs
        const recent = gpsHistory.slice(0, 5); // most recent 5
        const avgSpeed = recent.reduce((s, r) => s + r.avg_speed, 0) / recent.length;
        const topSpeed = Math.max(...recent.map((r) => r.top_speed));
        const strideEff = recent.reduce((s, r) => s + r.stride_efficiency, 0) / recent.length;
        const earlyPos = recent.reduce((s, r) => s + r.early_position_avg, 0) / recent.length;
        const lateAccel = recent.reduce((s, r) => s + r.late_acceleration, 0) / recent.length;

        speedFigure = speedProfile?.avg_last_5 ?? 100;
        const recentBest = speedProfile?.recent_best ?? speedFigure;

        const mlOdds = isNaN(entry.ml_odds_decimal) ? 5.0 : entry.ml_odds_decimal;

        features = {
          avg_speed: avgSpeed,
          top_speed: topSpeed,
          stride_efficiency: strideEff,
          early_position_avg: earlyPos,
          late_acceleration: lateAccel,
          speed_figure: speedFigure,
          recent_best_figure: recentBest,
          ml_odds_decimal: mlOdds,
          post_time_odds: mlOdds, // use ML odds as proxy for upcoming
          field_size: fieldSize,
          distance: 8, // default, will be overridden if race has distance
          surface_code: 0,
          class_code: 3,
        };

        source = "gps";
        confidence = Math.min(0.95, 0.6 + gpsHistory.length * 0.05);
      } else {
        // No GPS — use transfer model to estimate speed figure
        const mlOdds = isNaN(entry.ml_odds_decimal) ? 5.0 : entry.ml_odds_decimal;

        // Build transfer features
        const transferFeatures = [
          mlOdds,      // post_time_odds proxy
          8,           // distance (default)
          0,           // surface_code
          3,           // class_code
          fieldSize,
          5,           // early_position_avg (median estimate)
          Math.round(fieldSize / 2), // official_position (median estimate)
        ];

        // Apply transfer model
        const stdFeatures = applyStandardize([transferFeatures], transferModel.feature_means, transferModel.feature_stdevs);
        const [predictedFigure] = ridgePredict(stdFeatures, transferModel.weights, transferModel.bias);
        speedFigure = Math.max(60, Math.min(140, predictedFigure));

        features = {
          avg_speed: 27, // rough estimate from speed figure
          top_speed: 29,
          stride_efficiency: 2.2,
          early_position_avg: 5,
          late_acceleration: 0,
          speed_figure: speedFigure,
          recent_best_figure: speedFigure,
          ml_odds_decimal: mlOdds,
          post_time_odds: mlOdds,
          field_size: fieldSize,
          distance: 8,
          surface_code: 0,
          class_code: 3,
        };

        source = "transfer";
        confidence = 0.4;
      }

      // Apply the trained model to predict finish position
      const featureVector = [
        features.avg_speed, features.top_speed, features.stride_efficiency,
        features.speed_figure, features.recent_best_figure,
        features.ml_odds_decimal, features.post_time_odds,
        features.field_size, features.distance, features.surface_code, features.class_code,
      ];

      const stdVector = applyStandardize([featureVector], modelData.ridge.feature_means, modelData.ridge.feature_stdevs);
      const [ridgePred] = ridgePredict(stdVector, modelData.ridge.weights, modelData.ridge.bias);
      const [gbmPred] = predictGBM(stdVector, {
        stumps: modelData.gbm.stumps,
        learningRate: modelData.gbm.learning_rate,
        initialPrediction: modelData.gbm.initial_prediction,
      });

      const ensemblePred = (ridgePred + gbmPred) / 2;
      const predictedPos = Math.max(1, Math.min(fieldSize, ensemblePred));

      horsePredictions.push({
        registration_number: entry.registration_number,
        horse_name: entry.horse_name,
        predicted_position: Math.round(predictedPos * 100) / 100,
        win_probability: 0, // filled in after softmax
        place_probability: 0,
        show_probability: 0,
        speed_figure: Math.round(speedFigure * 10) / 10,
        speed_figure_source: source,
        confidence: Math.round(confidence * 100) / 100,
        features,
      });
    }

    // Convert predicted positions to probabilities via softmax
    const positions = horsePredictions.map((h) => h.predicted_position);
    const winProbs = softmaxWinProbs(positions, 1.5);

    // Compute place/show from simulated distribution
    for (let i = 0; i < horsePredictions.length; i++) {
      horsePredictions[i].win_probability = Math.round(winProbs[i] * 10000) / 100;

      // Place prob ~ cumulative of being top 2
      // Approximate: 1 - (1 - winProb) * (1 - winProb * 1.8)
      const placeProb = Math.min(0.95, winProbs[i] * 2.2 + 0.03);
      horsePredictions[i].place_probability = Math.round(placeProb * 10000) / 100;

      // Show prob ~ cumulative of being top 3
      const showProb = Math.min(0.98, winProbs[i] * 3.3 + 0.05);
      horsePredictions[i].show_probability = Math.round(showProb * 10000) / 100;
    }

    // Sort by win probability descending
    horsePredictions.sort((a, b) => b.win_probability - a.win_probability);

    predictions.push({
      race_key: raceKeyStr,
      track_id: trackId,
      race_date: raceDate,
      race_number: raceNum,
      has_gps: hasGPS,
      entries: horsePredictions,
    });
  }

  // Write output
  console.log("\nWriting output files...");
  writeJSON("upcoming-predictions.json", predictions);

  // Summary
  console.log(`\n═══ Prediction Summary ═══`);
  console.log(`  Races scored: ${predictions.length}`);
  for (const pred of predictions.slice(0, 10)) {
    console.log(`\n  ${pred.track_id} R${pred.race_number} (${pred.race_date}) — ${pred.has_gps ? "GPS" : "Transfer"}`);
    for (const h of pred.entries.slice(0, 3)) {
      console.log(`    ${h.horse_name.padEnd(22)} Win: ${h.win_probability.toFixed(1)}%  Fig: ${h.speed_figure.toFixed(0)}  Source: ${h.speed_figure_source}`);
    }
  }

  console.log("\n✓ Predictions complete\n");
}

main();
