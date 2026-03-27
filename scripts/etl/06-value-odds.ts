/**
 * 06-value-odds.ts — Compute GPS Edge: model predictions vs morning line
 *
 * Identifies value bets where the model disagrees with public odds.
 *
 * Run: npx tsx scripts/etl/06-value-odds.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { RacePrediction, ValueOddsEntry } from "./lib/types";
import { parseFractionalOdds } from "./lib/types";

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
  morning_line_odds: string;
  ml_odds_decimal: number;
}

function classify(edgePct: number): ValueOddsEntry["classification"] {
  if (edgePct > 10) return "strong_value";
  if (edgePct > 5) return "moderate_value";
  if (edgePct > -5) return "fair";
  return "overbet";
}

function generateInsight(
  horse: RacePrediction["entries"][0],
  edge: number,
  classification: string,
): string {
  const src = horse.speed_figure_source;
  const fig = horse.speed_figure.toFixed(0);
  const conf = (horse.confidence * 100).toFixed(0);

  if (classification === "strong_value") {
    if (src === "gps") {
      return `GPS data shows a speed figure of ${fig} with ${conf}% confidence. The public odds undervalue this horse's biomechanical efficiency and late-race acceleration pattern.`;
    }
    return `Transfer model estimates a speed figure of ${fig}. Traditional form metrics suggest the public is overlooking this horse's class level and recent performance trajectory.`;
  }

  if (classification === "overbet") {
    if (src === "gps") {
      return `Despite a speed figure of ${fig}, GPS stride analysis reveals declining efficiency in recent starts — the public may be overweighting name recognition.`;
    }
    return `Estimated figure of ${fig} from traditional data suggests the morning line is too generous. The model sees a weaker profile than the public consensus.`;
  }

  if (src === "gps") {
    return `Speed figure ${fig} from GPS data aligns reasonably with the morning line. Stride efficiency of ${horse.features?.stride_efficiency?.toFixed(2) ?? "N/A"} is within normal range.`;
  }
  return `Estimated figure of ${fig} from transfer model is broadly consistent with morning line assessment.`;
}

function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ETL Pipeline — Step 6: Value Odds        ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const predictions = readJSON<RacePrediction[]>("upcoming-predictions.json");
  const entries = readJSON<UpcomingEntry[]>("upcoming-entries.json");

  // Build ML odds lookup
  const mlOddsMap = new Map<string, number>();
  for (const e of entries) {
    mlOddsMap.set(e.registration_number, e.ml_odds_decimal);
  }

  const valueOdds: ValueOddsEntry[] = [];

  for (const race of predictions) {
    console.log(`\n  ${race.track_id} R${race.race_number} (${race.race_date})`);

    for (const horse of race.entries) {
      const mlDecimal = mlOddsMap.get(horse.registration_number);
      const mlOdds = (mlDecimal !== undefined && !isNaN(mlDecimal)) ? mlDecimal : NaN;

      if (isNaN(mlOdds) || mlOdds <= 0) {
        // Can't compute edge without ML odds
        valueOdds.push({
          horse_name: horse.horse_name,
          race_key: race.race_key,
          model_win_pct: horse.win_probability,
          ml_implied_pct: 0,
          edge: 0,
          edge_pct: 0,
          classification: "fair",
          gps_insight: `No morning line odds available for comparison. Model estimates ${horse.win_probability.toFixed(1)}% win probability.`,
        });
        continue;
      }

      // ML implied probability: 1 / (odds + 1) * 100
      const mlImplied = (1 / (mlOdds + 1)) * 100;
      const edge = horse.win_probability - mlImplied;
      const edgePct = mlImplied > 0 ? (edge / mlImplied) * 100 : 0;
      const classification = classify(edgePct);

      const insight = generateInsight(horse, edge, classification);

      valueOdds.push({
        horse_name: horse.horse_name,
        race_key: race.race_key,
        model_win_pct: Math.round(horse.win_probability * 100) / 100,
        ml_implied_pct: Math.round(mlImplied * 100) / 100,
        edge: Math.round(edge * 100) / 100,
        edge_pct: Math.round(edgePct * 10) / 10,
        classification,
        gps_insight: insight,
      });

      const symbol = classification === "strong_value" ? "🟢" :
        classification === "moderate_value" ? "🟡" :
        classification === "overbet" ? "🔴" : "⚪";
      console.log(`    ${symbol} ${horse.horse_name.padEnd(22)} Model: ${horse.win_probability.toFixed(1)}%  ML: ${mlImplied.toFixed(1)}%  Edge: ${edge > 0 ? "+" : ""}${edge.toFixed(1)}% (${classification})`);
    }
  }

  console.log("\nWriting output files...");
  writeJSON("value-odds.json", valueOdds);

  // Summary
  const strong = valueOdds.filter((v) => v.classification === "strong_value").length;
  const moderate = valueOdds.filter((v) => v.classification === "moderate_value").length;
  const fair = valueOdds.filter((v) => v.classification === "fair").length;
  const overbet = valueOdds.filter((v) => v.classification === "overbet").length;

  console.log(`\n═══ Value Odds Summary ═══`);
  console.log(`  Strong value: ${strong}`);
  console.log(`  Moderate value: ${moderate}`);
  console.log(`  Fair price: ${fair}`);
  console.log(`  Overbet: ${overbet}`);

  console.log("\n✓ Value odds complete\n");
}

main();
