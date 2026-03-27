// Race cycle timing constants — shared across navbar, live page, and context
export const CYCLE_DURATION = 360;       // 6 minutes total
export const BETTING_DURATION = 280;     // 4:40 to bet
export const POST_PARADE_DURATION = 15;  // 15s gate load
export const RACING_DURATION = 30;       // 30s race
export const RESULTS_DURATION = CYCLE_DURATION - BETTING_DURATION - POST_PARADE_DURATION - RACING_DURATION; // 35s

export type RacePhase = "betting" | "post_parade" | "racing" | "results";

export function getCurrentEpoch(): number {
  return Math.floor(Date.now() / (CYCLE_DURATION * 1000));
}

export function getTimeInCycle(): number {
  return (Date.now() / 1000) % CYCLE_DURATION;
}

export function getPhaseFromCycleTime(t: number): RacePhase {
  if (t < BETTING_DURATION) return "betting";
  if (t < BETTING_DURATION + POST_PARADE_DURATION) return "post_parade";
  if (t < BETTING_DURATION + POST_PARADE_DURATION + RACING_DURATION) return "racing";
  return "results";
}

export function getPhaseTimer(t: number): number {
  if (t < BETTING_DURATION) return Math.ceil(BETTING_DURATION - t);
  if (t < BETTING_DURATION + POST_PARADE_DURATION) return Math.ceil(BETTING_DURATION + POST_PARADE_DURATION - t);
  if (t < BETTING_DURATION + POST_PARADE_DURATION + RACING_DURATION)
    return Math.ceil(BETTING_DURATION + POST_PARADE_DURATION + RACING_DURATION - t);
  return Math.ceil(CYCLE_DURATION - t);
}

export function formatRaceTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const PHASE_LABELS: Record<RacePhase, string> = {
  betting: "Betting",
  post_parade: "Post Parade",
  racing: "Racing",
  results: "Results",
};
