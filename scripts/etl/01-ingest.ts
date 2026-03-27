/**
 * 01-ingest.ts — ETL Step 1
 *
 * Reads all data sources, normalizes types, aggregates GPS gates, joins.
 *
 * LARGE files (GPS Races 395K rows, GPS PPs 466K rows, Upcoming GPS 62K rows)
 * are pre-converted to CSV by a Python script (convert-xlsx.py) and streamed
 * here line-by-line for constant memory usage.
 *
 * SMALL files (Traditional Races 26K, Upcoming entries/PPs) use SheetJS directly.
 *
 * Run: npx tsx scripts/etl/01-ingest.ts
 */

import * as fs from "fs";
import * as path from "path";
import { readExcel, formatDate, num, str } from "./lib/xlsx-reader";
import { streamCSV } from "./lib/csv-reader";
import {
  type GPSHorseRace,
  type TraditionalHorseRace,
  type JoinedHorseRace,
  parseFractionalOdds,
  horseRaceKey,
} from "./lib/types";

const OUT_DIR = path.resolve(__dirname, "../../src/lib/data/processed");

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function writeJSON(filename: string, data: unknown) {
  const fp = path.join(OUT_DIR, filename);
  fs.writeFileSync(fp, JSON.stringify(data), "utf-8");
  const size = fs.statSync(fp).size;
  console.log(`  → ${filename} (${(size / 1024).toFixed(0)} KB)`);
}

function readJSON<T>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(OUT_DIR, filename), "utf-8"));
}

/** Safe date formatting from CSV string (might be "2025-12-26 00:00:00" or "2025-12-26") */
function csvDate(val: string): string {
  if (!val || val === "None" || val === "null") return "";
  // Extract just the date part
  const match = val.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  // Try parsing
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return val.trim();
}

function csvNum(val: string): number {
  if (!val || val === "None" || val === "null" || val === "") return NaN;
  return Number(val);
}

// ── Aggregate GPS gate rows into 1 row per horse-race ────────────────────

interface GateAccum {
  gates: { gate: number; secTime: number; distRan: number; strides: number; position: number }[];
  first: Record<string, string>;
}

function finalizeGPSGroup(acc: GateAccum): GPSHorseRace | null {
  const { gates, first } = acc;
  gates.sort((a, b) => a.gate - b.gate);

  const gateSpeeds: number[] = [];
  const gatePositions: number[] = [];
  const strideLengths: number[] = [];

  for (const g of gates) {
    gatePositions.push(isNaN(g.position) ? 99 : g.position);
    if (g.gate > 0 && g.secTime > 0 && g.distRan > 0) {
      gateSpeeds.push(g.distRan / g.secTime);
      if (g.strides > 0) strideLengths.push(g.distRan / g.strides);
    }
  }

  if (gateSpeeds.length === 0) return null;

  const avgSpeed = gateSpeeds.reduce((a, b) => a + b, 0) / gateSpeeds.length;
  const topSpeed = Math.max(...gateSpeeds);
  const avgStride = strideLengths.length > 0
    ? strideLengths.reduce((a, b) => a + b, 0) / strideLengths.length
    : avgSpeed / 2.25;

  const earlyPos = gatePositions.slice(0, 3).filter((p) => p < 99);
  const earlySpd = gateSpeeds.slice(0, 3);
  const lateSpd = gateSpeeds.slice(-3);
  const earlySpdAvg = earlySpd.length > 0 ? earlySpd.reduce((a, b) => a + b, 0) / earlySpd.length : avgSpeed;
  const lateSpdAvg = lateSpd.length > 0 ? lateSpd.reduce((a, b) => a + b, 0) / lateSpd.length : avgSpeed;

  return {
    registration_number: (first["registration_number"] ?? "").trim(),
    horse_name: (first["horse_name"] ?? "").trim(),
    track_id: (first["track_id"] ?? "").trim(),
    race_date: csvDate(first["race_date"] ?? ""),
    race_number: csvNum(first["race_number"]),
    distance: csvNum(first["distance"]),
    surface: (first["surface"] ?? "").trim(),
    race_type: (first["race_type"] ?? "").trim(),
    grade: (first["grade"] ?? "").trim(),
    purse: csvNum(first["Purse"] || first["purse"]) || 0,
    post_position: csvNum(first["post_position"]),
    official_position: csvNum(first["official_position"]),
    field_size: csvNum(first["field_size"]) || 0,
    ml_odds_decimal: parseFractionalOdds(first["morning_line_odds"]),
    post_time_odds: csvNum(first["Post_time_Odds"] || first["post_time_odds"]) || NaN,
    avg_speed: Math.round(avgSpeed * 100) / 100,
    top_speed: Math.round(topSpeed * 100) / 100,
    avg_stride_length: Math.round(avgStride * 100) / 100,
    stride_efficiency: Math.round((avgSpeed / avgStride) * 100) / 100,
    early_position_avg: Math.round((earlyPos.length > 0 ? earlyPos.reduce((a, b) => a + b, 0) / earlyPos.length : 5) * 100) / 100,
    late_position_avg: 5,
    late_acceleration: Math.round((lateSpdAvg - earlySpdAvg) * 100) / 100,
    gate_speeds: gateSpeeds.map((s) => Math.round(s * 100) / 100),
    gate_positions: gatePositions,
    num_gates: gates.length,
  };
}

/** Stream a GPS CSV and aggregate into horse-race records */
async function aggregateGPSCSV(csvFile: string): Promise<GPSHorseRace[]> {
  const groups = new Map<string, GateAccum>();

  await streamCSV(csvFile, (row) => {
    const regNum = (row["registration_number"] ?? "").trim();
    const track = (row["track_id"] ?? "").trim();
    const date = csvDate(row["race_date"] ?? "");
    const raceNum = csvNum(row["race_number"]);
    const key = `${regNum}_${track}_${date}_${raceNum}`;

    if (!groups.has(key)) {
      groups.set(key, { gates: [], first: row });
    }

    groups.get(key)!.gates.push({
      gate: csvNum(row["gate"]),
      secTime: csvNum(row["sectional_time"]),
      distRan: csvNum(row["distance_ran"]),
      strides: csvNum(row["strides"]),
      position: csvNum(row["position"]),
    });
  });

  console.log(`  Grouped: ${groups.size.toLocaleString()} horse-race records`);

  const results: GPSHorseRace[] = [];
  for (const [, acc] of groups) {
    const result = finalizeGPSGroup(acc);
    if (result) results.push(result);
  }

  return results;
}

// ── Step 1: Traditional Races (small, use xlsx) ──────────────────────────

function step1_traditional(): TraditionalHorseRace[] {
  console.log("\n[1/5] Traditional Races...");
  const rows = readExcel("Traditional Races (December 24, 2025 – March 24, 2026).xlsx");

  const results: TraditionalHorseRace[] = [];
  for (const row of rows) {
    const positions: number[] = [];
    const lengths: number[] = [];
    for (let i = 1; i <= 5; i++) {
      positions.push(num(row[`position_at_point_of_call_${i}`]));
      lengths.push(num(row[`length_behind_at_poc_${i}`]));
    }

    results.push({
      registration_number: str(row["registration_number"]),
      horse_name: str(row["horse_name"]),
      track_id: str(row["track_id"]),
      race_date: formatDate(row["race_date"]),
      race_number: num(row["race_number"]),
      distance: num(row["distance"]),
      surface: str(row["surface"]),
      race_type: str(row["race_type"]),
      grade: str(row["grade"]),
      purse: num(row["Purse"]) || num(row["purse"]) || 0,
      post_position: num(row["post_position"]),
      official_position: num(row["official_position"]),
      field_size: num(row["field_size"]),
      ml_odds_decimal: parseFractionalOdds(row["morning_line_odds"] as string),
      post_time_odds: num(row["post_time_odds"]) || num(row["Post_time_Odds"]) || NaN,
      positions_at_calls: positions,
      lengths_behind_at_calls: lengths,
      length_behind_at_finish: num(row["length_behind_at_finish"]),
    });
  }

  writeJSON("traditional-races.json", results);
  console.log(`  ✓ ${results.length.toLocaleString()} records`);
  return results;
}

// ── Step 2: GPS Races (large, use CSV) ───────────────────────────────────

async function step2_gpsRaces(): Promise<GPSHorseRace[]> {
  console.log("\n[2/5] GPS Races (streaming from CSV)...");
  const results = await aggregateGPSCSV("gps_races.csv");
  writeJSON("gps-races.json", results);
  console.log(`  ✓ ${results.length.toLocaleString()} horse-race records`);
  return results;
}

// ── Step 3: GPS PPs (large, use CSV) ─────────────────────────────────────

async function step3_gpsPPs(): Promise<GPSHorseRace[]> {
  console.log("\n[3/5] GPS PPs (streaming from CSV)...");
  const results = await aggregateGPSCSV("gps_pps.csv");
  writeJSON("gps-pps.json", results);
  console.log(`  ✓ ${results.length.toLocaleString()} PP records`);
  return results;
}

// ── Step 4: Upcoming (small sheets via xlsx + GPS PPs via CSV) ───────────

async function step4_upcoming() {
  console.log("\n[4/5] Upcoming Races...");

  // Sheet 1: entries (small, xlsx)
  const entryRows = readExcel("upcoming races.xlsx", { sheet: "upcoming races" });
  const entries = entryRows.map((r) => ({
    registration_number: str(r["registration_number"]),
    horse_name: str(r["horse_name"]),
    race_date: formatDate(r["race_date"]),
    race_number: num(r["race_number"]),
    track_id: str(r["track_id"]),
    post_position: num(r["post_position"]),
    jockey: [str(r["temp_jockey_first_name"]), str(r["temp_jockey_last_name"])].filter(Boolean).join(" "),
    trainer: [str(r["temp_trainer_first_name"]), str(r["temp_trainer_last_name"])].filter(Boolean).join(" "),
    morning_line_odds: str(r["morning_line_odds"]),
    ml_odds_decimal: parseFractionalOdds(r["morning_line_odds"] as string),
  }));
  console.log(`  Entries: ${entries.length}`);

  // Sheet 2: traditional PPs (small, xlsx)
  const tradRows = readExcel("upcoming races.xlsx", { sheet: "upcoming starters" });
  console.log(`  Traditional PPs: ${tradRows.length}`);

  // Sheet 3: GPS PPs (large, pre-converted to CSV)
  console.log("  Upcoming GPS PPs (streaming from CSV)...");
  const upcomingGPS = await aggregateGPSCSV("upcoming_gps_pps.csv");
  console.log(`  GPS PPs aggregated: ${upcomingGPS.length}`);

  writeJSON("upcoming-entries.json", entries);
  writeJSON("upcoming-gps-pps.json", upcomingGPS);
  writeJSON("upcoming-trad-pps.json", tradRows);
  console.log(`  ✓ Upcoming data written`);
}

// ── Step 5: Join GPS + Traditional ───────────────────────────────────────

function step5_join() {
  console.log("\n[5/5] Joining GPS + Traditional...");

  const gps = readJSON<GPSHorseRace[]>("gps-races.json");
  const trad = readJSON<TraditionalHorseRace[]>("traditional-races.json");

  const tradMap = new Map<string, TraditionalHorseRace>();
  for (const t of trad) {
    const key = horseRaceKey(t.registration_number, t.track_id, t.race_date, t.race_number);
    tradMap.set(key, t);
  }

  const joined: JoinedHorseRace[] = [];
  let matchCount = 0;

  for (const g of gps) {
    const key = horseRaceKey(g.registration_number, g.track_id, g.race_date, g.race_number);
    const t = tradMap.get(key);

    joined.push({
      ...g,
      positions_at_calls: t?.positions_at_calls ?? [],
      lengths_behind_at_calls: t?.lengths_behind_at_calls ?? [],
      length_behind_at_finish: t?.length_behind_at_finish ?? NaN,
      has_traditional: !!t,
    });
    if (t) matchCount++;
  }

  writeJSON("joined-races.json", joined);
  console.log(`  ✓ ${joined.length.toLocaleString()} joined (${matchCount} GPS↔Traditional matches)`);

  // Horse history index
  const gpsPPs = readJSON<GPSHorseRace[]>("gps-pps.json");
  const history = new Map<string, GPSHorseRace[]>();
  for (const record of [...gpsPPs, ...gps]) {
    const reg = record.registration_number;
    if (!history.has(reg)) history.set(reg, []);
    history.get(reg)!.push(record);
  }
  for (const [, races] of history) {
    races.sort((a, b) => b.race_date.localeCompare(a.race_date));
  }

  const historyObj: Record<string, GPSHorseRace[]> = {};
  for (const [reg, races] of history) historyObj[reg] = races;
  writeJSON("horse-history.json", historyObj);
  console.log(`  ✓ ${history.size.toLocaleString()} horses indexed`);
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ETL Pipeline — Step 1: Ingest           ║");
  console.log("╚══════════════════════════════════════════╝");

  // Check that CSV pre-conversions exist
  const csvFiles = ["gps_races.csv", "gps_pps.csv", "upcoming_gps_pps.csv"];
  const missing = csvFiles.filter((f) => !fs.existsSync(path.join(OUT_DIR, f)));
  if (missing.length > 0) {
    console.error(`\n  ❌ Missing pre-converted CSV files: ${missing.join(", ")}`);
    console.error("  Run the Python converter first:");
    console.error("    python3 scripts/etl/convert-xlsx.py\n");
    process.exit(1);
  }

  ensureOutDir();

  step1_traditional();
  await step2_gpsRaces();
  await step3_gpsPPs();
  await step4_upcoming();
  step5_join();

  // Summary
  const gps = readJSON<GPSHorseRace[]>("gps-races.json");
  const tracks = [...new Set(gps.map((r) => r.track_id.trim()))];
  const dates = gps.map((r) => r.race_date).filter(Boolean).sort();

  console.log("\n═══ Ingest Summary ═══");
  console.log(`  GPS races:   ${gps.length.toLocaleString()} horse-race records`);
  console.log(`  Tracks:      ${tracks.join(", ")}`);
  console.log(`  Date range:  ${dates[0]} → ${dates[dates.length - 1]}`);
  console.log("\n✓ Ingest complete\n");
}

main().catch((err) => {
  console.error("ETL Ingest failed:", err);
  process.exit(1);
});
