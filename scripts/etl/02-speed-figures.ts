/**
 * 02-speed-figures.ts — Compute Beyer-style normalized speed figures
 *
 * Takes aggregated GPS race data and produces normalized speed figures
 * on a 100 ± 10 scale (100 = average for track/surface/distance combo).
 *
 * Run: npx tsx scripts/etl/02-speed-figures.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { GPSHorseRace, SpeedFigureEntry, HorseSpeedProfile } from "./lib/types";
import { raceKey } from "./lib/types";

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

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) || 1;
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ETL Pipeline — Step 2: Speed Figures     ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const gpsRaces = readJSON<GPSHorseRace[]>("gps-races.json");
  console.log(`  Loaded ${gpsRaces.length.toLocaleString()} GPS horse-race records\n`);

  // Step 1: Compute raw speed per horse per race
  const rawEntries: (GPSHorseRace & { raw_speed: number; group_key: string; race_day_key: string })[] = [];

  for (const race of gpsRaces) {
    if (race.avg_speed <= 0 || isNaN(race.avg_speed)) continue;

    const distBucket = Math.round(race.distance);
    const groupKey = `${race.track_id}_${race.surface}_${distBucket}`;
    const dayKey = `${race.track_id}_${race.race_date}`;

    rawEntries.push({
      ...race,
      raw_speed: race.avg_speed,
      group_key: groupKey,
      race_day_key: dayKey,
    });
  }

  console.log(`  Valid speed entries: ${rawEntries.length.toLocaleString()}`);

  // Step 2: Group by (track, surface, distance) and compute baselines
  const groups = new Map<string, number[]>();
  for (const entry of rawEntries) {
    if (!groups.has(entry.group_key)) groups.set(entry.group_key, []);
    groups.get(entry.group_key)!.push(entry.raw_speed);
  }

  // Fallback groups: (surface, distance) for thin groups
  const surfDistGroups = new Map<string, number[]>();
  for (const entry of rawEntries) {
    const distBucket = Math.round(entry.distance);
    const key = `${entry.surface}_${distBucket}`;
    if (!surfDistGroups.has(key)) surfDistGroups.set(key, []);
    surfDistGroups.get(key)!.push(entry.raw_speed);
  }

  // Global surface baselines
  const surfaceGroups = new Map<string, number[]>();
  for (const entry of rawEntries) {
    if (!surfaceGroups.has(entry.surface)) surfaceGroups.set(entry.surface, []);
    surfaceGroups.get(entry.surface)!.push(entry.raw_speed);
  }

  console.log(`  Track/surface/distance groups: ${groups.size}`);
  console.log(`  Surface/distance fallbacks: ${surfDistGroups.size}`);
  console.log(`  Surface fallbacks: ${surfaceGroups.size}`);

  // Print group sizes
  for (const [key, vals] of groups) {
    if (vals.length < 30) {
      console.log(`    ⚠ Thin group: ${key} (${vals.length} obs)`);
    }
  }

  // Step 3: Z-score and scale to 100 ± 10
  function getBaseline(groupKey: string, surface: string, distance: number): { m: number; s: number } {
    const distBucket = Math.round(distance);
    const sdKey = `${surface}_${distBucket}`;

    // Primary: track/surface/distance
    const primary = groups.get(groupKey);
    if (primary && primary.length >= 30) {
      return { m: mean(primary), s: stdev(primary) };
    }

    // Fallback 1: surface/distance
    const fallback1 = surfDistGroups.get(sdKey);
    if (fallback1 && fallback1.length >= 30) {
      return { m: mean(fallback1), s: stdev(fallback1) };
    }

    // Fallback 2: surface only
    const fallback2 = surfaceGroups.get(surface);
    if (fallback2 && fallback2.length > 0) {
      return { m: mean(fallback2), s: stdev(fallback2) };
    }

    // Last resort: global
    const allSpeeds = rawEntries.map((e) => e.raw_speed);
    return { m: mean(allSpeeds), s: stdev(allSpeeds) };
  }

  const figures: SpeedFigureEntry[] = [];
  for (const entry of rawEntries) {
    const { m, s } = getBaseline(entry.group_key, entry.surface, entry.distance);
    const z = (entry.raw_speed - m) / s;
    const rawFigure = 100 + z * 10;
    const clamped = Math.max(60, Math.min(140, rawFigure));

    figures.push({
      registration_number: entry.registration_number,
      horse_name: entry.horse_name,
      track_id: entry.track_id,
      race_date: entry.race_date,
      race_number: entry.race_number,
      race_key: raceKey(entry.track_id, entry.race_date, entry.race_number),
      raw_speed: entry.raw_speed,
      speed_figure: Math.round(clamped * 10) / 10,
      surface: entry.surface,
      distance: entry.distance,
    });
  }

  // Step 4: Track variant adjustment (per race-day)
  const raceDayFigures = new Map<string, SpeedFigureEntry[]>();
  for (const fig of figures) {
    const dayKey = `${fig.track_id}_${fig.race_date}`;
    if (!raceDayFigures.has(dayKey)) raceDayFigures.set(dayKey, []);
    raceDayFigures.get(dayKey)!.push(fig);
  }

  for (const [dayKey, dayFigs] of raceDayFigures) {
    const dayMedian = median(dayFigs.map((f) => f.speed_figure));
    const variant = 100 - dayMedian;

    // Only apply if variant is significant (> 1 point)
    if (Math.abs(variant) > 1) {
      for (const fig of dayFigs) {
        fig.speed_figure = Math.round(Math.max(60, Math.min(140, fig.speed_figure + variant)) * 10) / 10;
      }
    }
  }

  // Step 5: Build per-horse speed profiles
  const horseMap = new Map<string, SpeedFigureEntry[]>();
  for (const fig of figures) {
    if (!horseMap.has(fig.registration_number)) horseMap.set(fig.registration_number, []);
    horseMap.get(fig.registration_number)!.push(fig);
  }

  const profiles: HorseSpeedProfile[] = [];
  for (const [regNum, horseFigs] of horseMap) {
    // Sort by date descending
    horseFigs.sort((a, b) => b.race_date.localeCompare(a.race_date));

    const allFigures = horseFigs.map((f) => f.speed_figure);
    const recentFigs = allFigures.slice(0, 3);
    const last5 = allFigures.slice(0, 5);

    profiles.push({
      registration_number: regNum,
      horse_name: horseFigs[0].horse_name,
      career_best: Math.max(...allFigures),
      recent_best: recentFigs.length > 0 ? Math.max(...recentFigs) : 0,
      avg_last_5: last5.length > 0 ? Math.round(mean(last5) * 10) / 10 : 0,
      num_races: horseFigs.length,
      figures: horseFigs,
    });
  }

  // Sort by career best descending
  profiles.sort((a, b) => b.career_best - a.career_best);

  // Write outputs
  console.log("\nWriting output files...");
  writeJSON("speed-figures.json", figures);
  writeJSON("horse-speed-profiles.json", profiles);

  // Summary
  console.log(`\n═══ Speed Figure Summary ═══`);
  console.log(`  Total figures: ${figures.length.toLocaleString()}`);
  console.log(`  Unique horses: ${profiles.length.toLocaleString()}`);
  console.log(`  Figure range: ${Math.min(...figures.map((f) => f.speed_figure)).toFixed(1)} - ${Math.max(...figures.map((f) => f.speed_figure)).toFixed(1)}`);
  console.log(`  Mean figure: ${mean(figures.map((f) => f.speed_figure)).toFixed(1)}`);
  console.log(`  Top 5 horses by career best:`);
  for (const p of profiles.slice(0, 5)) {
    console.log(`    ${p.horse_name.padEnd(25)} Best: ${p.career_best.toFixed(1)}  Recent: ${p.recent_best.toFixed(1)}  Avg5: ${p.avg_last_5.toFixed(1)}  (${p.num_races} races)`);
  }

  console.log("\n✓ Speed figures complete\n");
}

main();
