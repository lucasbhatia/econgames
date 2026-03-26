import type { SimConfig, SimResults, SingleRaceResult, HorseAggResult, SimHorse } from "./types";

// Box-Muller normal distribution
function normalRandom(mean: number, stdev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdev;
}

// Resample speed curve to match race distance
function resampleCurve(curve: number[], targetLen: number): number[] {
  if (curve.length === targetLen) return [...curve];
  const result: number[] = [];
  for (let i = 0; i < targetLen; i++) {
    const srcIdx = (i / (targetLen - 1)) * (curve.length - 1);
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, curve.length - 1);
    const frac = srcIdx - lo;
    result.push(curve[lo] * (1 - frac) + curve[hi] * frac);
  }
  return result;
}

function simulateOneRace(horses: SimHorse[], distF: number, surface: string, trackBias: string): SingleRaceResult {
  const n = horses.length;
  const times: Record<string, number> = {};
  const gateSpeeds: Record<string, number[]> = {};

  for (const horse of horses) {
    const baseCurve = resampleCurve(horse.speedCurve, distF);
    const speeds: number[] = [];

    for (let g = 0; g < distF; g++) {
      let speed = normalRandom(baseCurve[g], horse.consistency);
      const progress = g / (distF - 1);

      // Running style modifiers
      if (horse.runningStyle === "Front Runner") {
        speed += progress < 0.3 ? 0.3 : progress > 0.7 ? -0.4 : 0;
      } else if (horse.runningStyle === "Closer") {
        speed += progress < 0.3 ? -0.2 : progress > 0.7 ? 0.5 : 0;
      }

      // Track bias
      if (trackBias === "slight_inside" && horse.postPosition <= 3) {
        speed += 0.15;
      } else if (trackBias === "slight_outside" && horse.postPosition > n - 3) {
        speed += 0.15;
      }

      // Surface modifier
      if (surface === "Turf") speed -= 0.3;

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

function formatOdds(winPct: number): string {
  if (winPct <= 0) return "99-1";
  if (winPct >= 100) return "1-99";
  const odds = (100 / winPct) - 1;
  if (odds < 1) {
    const inv = Math.round(1 / odds);
    return `${inv > 99 ? 99 : inv}-${Math.max(1, Math.round(inv * odds))} ON`;
  }
  return `${odds.toFixed(1)}-1`;
}

export function runMonteCarlo(config: SimConfig): SimResults {
  const { horses, distanceFurlongs, surface, trackBias, numSimulations } = config;
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
    const result = simulateOneRace(horses, distanceFurlongs, surface, trackBias);

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

      // Second half of furlong (slight variation)
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
