import type { SimHorse } from "./types";
import type { HorseProfile } from "@/lib/data/horse-profiles";

/**
 * Convert a HorseProfile to a SimHorse for use in the simulation engine.
 * Computes consistency from recent form standard deviation.
 *
 * @param profile   The horse profile to convert
 * @param postPosition  Post position (1-indexed)
 * @param colorOverride Optional color — defaults to profile.color
 */
export function profileToSim(
  profile: HorseProfile,
  postPosition: number,
  colorOverride?: string,
): SimHorse {
  const finishes = profile.recentForm.map((r) => r.finish);
  const mean = finishes.reduce((a, b) => a + b, 0) / finishes.length;
  const variance = finishes.reduce((a, f) => a + (f - mean) ** 2, 0) / finishes.length;
  const stdev = Math.sqrt(variance);
  // Continuous consistency: map stdev linearly from [0, 4] → [0.2, 0.9]
  // stdev ~0 (perfectly consistent) → 0.2 noise
  // stdev ~4 (wildly inconsistent) → 0.9 noise
  const consistency = Math.min(0.9, Math.max(0.2, 0.2 + stdev * 0.175));

  const recentFormAvg = finishes.length > 0 ? mean : undefined;

  return {
    name: profile.name,
    color: colorOverride ?? profile.color,
    imageUrl: profile.imageUrl,
    speedCurve: profile.speedCurve,
    topSpeed: profile.topSpeed,
    avgSpeed: profile.avgSpeed,
    strideEfficiency: profile.strideEfficiency,
    runningStyle: profile.runningStyle,
    consistency,
    postPosition,
    isCustom: false,
    bestDistance: profile.bestDistance,
    bestSurface: profile.bestSurface,
    recentFormAvg,
    careerWins: profile.wins,
    age: profile.age,
  };
}
