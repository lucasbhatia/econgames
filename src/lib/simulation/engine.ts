import type { SimConfig, SimResults, SingleRaceResult, HorseAggResult, SimHorse } from "./types";

// Box-Muller normal distribution — accepts injectable RNG
function normalRandom(mean: number, stdev: number, random: () => number): number {
  const u1 = random();
  const u2 = random();
  const z0 = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  const z = Math.max(-4, Math.min(4, z0)); // clamp to 4-sigma to prevent blowouts
  return mean + z * stdev;
}

// Trim post-finish deceleration artifacts from GPS speed curves.
// Real GPS data often has a final gate where the horse pulls up (e.g., 13.9 ft/s)
// which would unfairly penalize GPS-sourced horses in simulation.
function trimDeceleration(curve: number[]): number[] {
  if (curve.length < 3) return curve;
  const last = curve[curve.length - 1];
  const secondLast = curve[curve.length - 2];
  // If the final point drops more than 2 ft/s below the previous, it's a pullup — trim it
  if (secondLast - last > 2) {
    return curve.slice(0, -1);
  }
  return curve;
}

// Resample speed curve to match race distance
function resampleCurve(curve: number[], targetLen: number): number[] {
  const cleaned = trimDeceleration(curve);
  if (cleaned.length === targetLen) return [...cleaned];
  const result: number[] = [];
  for (let i = 0; i < targetLen; i++) {
    const srcIdx = (i / (targetLen - 1)) * (cleaned.length - 1);
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, cleaned.length - 1);
    const frac = srcIdx - lo;
    result.push(cleaned[lo] * (1 - frac) + cleaned[hi] * frac);
  }
  return result;
}

function simulateOneRace(horses: SimHorse[], distF: number, surface: string, trackBias: string, random: () => number): SingleRaceResult {
  const n = horses.length;
  const times: Record<string, number> = {};
  const gateSpeeds: Record<string, number[]> = {};

  // Pre-compute field averages for relative comparisons
  const fieldAvgSpeed = horses.reduce((s, h) => s + h.avgSpeed, 0) / n;

  for (const horse of horses) {
    const rawCurve = resampleCurve(horse.speedCurve, distF);

    // --- GPS factor: calibrate curve to avgSpeed ---
    // The speedCurve encodes the SHAPE (pacing pattern) of how the horse runs.
    // But curves from different sources (handcrafted vs GPS-derived) can have different
    // absolute levels. We normalize the curve so its mean matches the horse's avgSpeed,
    // making avgSpeed the single source of truth for baseline ability.
    const curveMean = rawCurve.reduce((a, b) => a + b, 0) / rawCurve.length;
    const curveShift = horse.avgSpeed - curveMean;
    const baseCurve = rawCurve.map(v => v + curveShift);
    const speeds: number[] = [];

    // --- GPS factor: avgSpeed edge vs field (small competitive tiebreaker) ---
    const speedEdge = (horse.avgSpeed - fieldAvgSpeed) * 0.12;

    // --- GPS factor: stride efficiency as fatigue resistance ---
    // Higher efficiency (typically 2.1-2.5) means less energy wasted per stride.
    // Normalized around 2.25 — above = bonus in final third, below = penalty.
    // Scale: 0.1 efficiency gap → ~0.03 ft/s max in final furlong.
    const efficiencyRef = 2.25;
    const efficiencyDelta = (horse.strideEfficiency - efficiencyRef) * 0.3;

    // --- Traditional factor: age peak-performance curve ---
    // Thoroughbreds peak at 4-5 years old. Small effect.
    const ageFactor = horse.age !== undefined
      ? -0.04 * Math.abs((horse.age ?? 4) - 4.5)
      : 0;

    // --- Traditional factor: experience from career wins ---
    // More wins = slightly better race IQ (small, diminishing returns)
    const experienceFactor = horse.careerWins !== undefined
      ? Math.min(0.1, (horse.careerWins ?? 0) * 0.015)
      : 0;

    for (let g = 0; g < distF; g++) {
      let speed = normalRandom(baseCurve[g], horse.consistency, random);
      const progress = g / (distF - 1);

      // --- GPS factor: avgSpeed edge (constant across race) ---
      speed += speedEdge;

      // --- GPS factor: topSpeed ceiling ---
      // In the peak-effort zone (60-85% of race), the horse can tap into its topSpeed.
      // This creates realistic "max gear" moments visible in GPS data.
      // Scale: topSpeed 1.5 ft/s above curve point → ~0.12 ft/s boost.
      if (progress >= 0.6 && progress <= 0.85) {
        const topSpeedPull = (horse.topSpeed - baseCurve[g]) * 0.08;
        if (topSpeedPull > 0) speed += topSpeedPull;
      }

      // --- GPS factor: stride efficiency as late-race fatigue resistance ---
      // In the final third, efficient horses hold speed better.
      if (progress > 0.65) {
        speed += efficiencyDelta * (progress - 0.65) / 0.35; // ramps from 0 to full
      }

      // Running style modifiers
      if (horse.runningStyle === "Front Runner") {
        speed += progress < 0.3 ? 0.3 : progress > 0.7 ? -0.4 : 0;
      } else if (horse.runningStyle === "Closer") {
        speed += progress < 0.3 ? -0.2 : progress > 0.7 ? 0.5 : 0;
      }

      // Track bias (scaled by field size)
      const insideThreshold = Math.max(2, Math.floor(n * 0.3));
      const outsideThreshold = n - Math.max(2, Math.floor(n * 0.3));
      if (trackBias === "slight_inside" && horse.postPosition <= insideThreshold) {
        speed += 0.15;
      } else if (trackBias === "slight_outside" && horse.postPosition > outsideThreshold) {
        speed += 0.15;
      }

      // Surface preference (traditional factor)
      if (surface === "Turf") {
        if (horse.bestSurface === "Turf" || horse.bestSurface === "Both") {
          speed -= 0.1;
        } else {
          speed -= 0.4;
        }
      } else {
        if (horse.bestSurface === "Turf") {
          speed -= 0.2;
        }
      }

      // Distance suitability (traditional factor)
      if (horse.bestDistance) {
        const bestDist = parseFloat(horse.bestDistance.replace("F", ""));
        const distDiff = Math.abs(bestDist - distF);
        if (distDiff >= 3) speed -= 0.3;
        else if (distDiff >= 2) speed -= 0.15;
      }

      // Recent form factor (traditional: improving vs declining)
      if (horse.recentFormAvg !== undefined) {
        if (horse.recentFormAvg <= 2.5) speed += 0.15;
        else if (horse.recentFormAvg >= 6) speed -= 0.15;
      }

      // Age and experience (traditional factors)
      speed += ageFactor;
      speed += experienceFactor;

      // Clamp to reasonable range
      speed = Math.max(12, Math.min(21, speed));
      speeds.push(speed);
    }

    // Total time = sum of (660 ft / speed) per furlong
    const totalTime = speeds.reduce((sum, spd) => sum + 660 / spd, 0);
    times[horse.name] = totalTime;
    gateSpeeds[horse.name] = speeds;
  }

  // Rank by total time (lower = faster = better)
  const finishOrder = Object.entries(times)
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);

  return { finishOrder, times, gateSpeeds };
}

// ODDS AUDIT FIX [P1]: Unified fractional odds formatting.
// Uses the same track-standard fraction table as formatOddsDisplay() in constants.ts.
// Converts win percentage to fair (no-vig) fractional odds for the simulate page.
function formatOdds(winPct: number): string {
  if (winPct <= 0) return "99-1";
  if (winPct >= 100) return "1-20";
  const profit = (100 / winPct) - 1; // profit per $1 wagered
  if (profit >= 30) return "30-1";
  if (profit >= 10) return `${Math.round(profit)}-1`;
  if (profit >= 5) return `${Math.round(profit)}-1`;
  // Standard track fractions — snap to nearest
  const FRACTIONS: [number, string][] = [
    [5.0, "5-1"], [4.5, "9-2"], [4.0, "4-1"], [3.5, "7-2"],
    [3.0, "3-1"], [2.5, "5-2"], [2.0, "2-1"], [1.5, "3-2"],
    [1.2, "6-5"], [1.0, "Even"], [0.8, "4-5"], [0.6, "3-5"],
    [0.5, "1-2"], [0.4, "2-5"], [0.2, "1-5"],
  ];
  let best = FRACTIONS[0];
  let bestDist = Math.abs(profit - best[0]);
  for (const entry of FRACTIONS) {
    const dist = Math.abs(profit - entry[0]);
    if (dist < bestDist) { bestDist = dist; best = entry; }
  }
  return best[1];
}

export function runMonteCarlo(config: SimConfig): SimResults {
  const { horses, distanceFurlongs, surface, trackBias, numSimulations, random = Math.random } = config;
  const n = horses.length;

  // Initialize counters
  const wins: Record<string, number> = {};
  const places: Record<string, number> = {};
  const shows: Record<string, number> = {};
  const finishSums: Record<string, number> = {};
  const finishDists: Record<string, number[]> = {};

  for (const h of horses) {
    wins[h.name] = 0;
    places[h.name] = 0;
    shows[h.name] = 0;
    finishSums[h.name] = 0;
    finishDists[h.name] = new Array(n).fill(0);
  }

  const allRaces: SingleRaceResult[] = [];
  const orderCounts: Record<string, number> = {};

  for (let i = 0; i < numSimulations; i++) {
    const result = simulateOneRace(horses, distanceFurlongs, surface, trackBias, random);

    // Only store first 100 races for replay (memory)
    if (i < 100) allRaces.push(result);

    const order = result.finishOrder;
    if (order[0]) wins[order[0]]++;
    if (order[0]) places[order[0]]++;
    if (order[1]) places[order[1]]++;
    if (order[0]) shows[order[0]]++;
    if (order[1]) shows[order[1]]++;
    if (order[2]) shows[order[2]]++;

    for (let pos = 0; pos < order.length; pos++) {
      finishSums[order[pos]] += pos + 1;
      finishDists[order[pos]][pos]++;
    }

    // Track exact order frequency (top 3 only for memory)
    const orderKey = order.slice(0, 3).join(",");
    orderCounts[orderKey] = (orderCounts[orderKey] || 0) + 1;
  }

  // Build aggregate results
  const horseResults: HorseAggResult[] = horses.map((h) => ({
    name: h.name,
    color: h.color,
    winPct: (wins[h.name] / numSimulations) * 100,
    placePct: (places[h.name] / numSimulations) * 100,
    showPct: (shows[h.name] / numSimulations) * 100,
    fairOdds: formatOdds((wins[h.name] / numSimulations) * 100),
    avgFinish: finishSums[h.name] / numSimulations,
    finishDist: finishDists[h.name],
  }));

  horseResults.sort((a, b) => b.winPct - a.winPct);

  // Top 5 exact orders
  const topOrders = Object.entries(orderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => ({
      order: key.split(","),
      count,
      pct: (count / numSimulations) * 100,
    }));

  return { horses: horseResults, allRaces, topOrders };
}

// Convert a single sim result into RaceReplay-compatible gate data
export function simToReplayData(
  result: SingleRaceResult,
  horses: SimHorse[],
  distance: number
) {
  // Compute cumulative time at each half-furlong for each horse
  const halfFurlongs = distance * 2;
  const horseTimelines: Record<string, { time: number; speed: number }[]> = {};

  for (const horse of horses) {
    const speeds = result.gateSpeeds[horse.name];
    const timeline: { time: number; speed: number }[] = [];
    let cumTime = 0;

    for (let g = 0; g < speeds.length; g++) {
      // First half of furlong
      const halfDist = 330; // half furlong in feet
      const t1 = halfDist / speeds[g];
      cumTime += t1;
      timeline.push({ time: cumTime, speed: speeds[g] });

      // Second half of furlong (same speed within furlong)
      const t2 = halfDist / speeds[g];
      cumTime += t2;
      timeline.push({ time: cumTime, speed: speeds[g] });
    }
    horseTimelines[horse.name] = timeline;
  }

  // At each half-furlong gate, rank horses by cumulative time
  const replayHorses = horses.map((horse) => {
    const timeline = horseTimelines[horse.name];
    const gates: { g: number; p: number; spd: number; sl: number; t: number }[] = [];
    const finishPos = result.finishOrder.indexOf(horse.name) + 1;

    for (let hf = 0; hf < halfFurlongs && hf < timeline.length; hf++) {
      const gate = hf * 0.5;
      const myTime = timeline[hf].time;

      // Count how many horses have less cumulative time at this gate
      let position = 1;
      for (const other of horses) {
        if (other.name === horse.name) continue;
        const otherTimeline = horseTimelines[other.name];
        if (hf < otherTimeline.length && otherTimeline[hf].time < myTime) {
          position++;
        }
      }

      gates.push({
        g: gate,
        p: position,
        spd: Math.round(timeline[hf].speed * 10) / 10,
        sl: Math.round((timeline[hf].speed / horse.strideEfficiency) * 10) / 10,
        t: Math.round((hf > 0 ? timeline[hf].time - timeline[hf - 1].time : timeline[hf].time) * 100) / 100,
      });
    }

    return {
      name: horse.name,
      postPos: horse.postPosition,
      finish: finishPos,
      odds: null,
      gates,
    };
  });

  return {
    horses: replayHorses,
    colors: horses.map((h) => h.color),
  };
}
