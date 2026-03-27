/**
 * Centralized glossary for horse racing terminology, statistical terms,
 * and model concepts used throughout the app.
 *
 * Every entry has:
 * - label: plain-English short name for UI labels
 * - tooltip: 1-2 sentence explanation for hover/tap, zero jargon
 * - analogy: optional comparison to mainstream sports or everyday life
 * - unit: optional display unit with human context
 */

export interface GlossaryEntry {
  /** The raw/technical term as used in code or data */
  term: string;
  /** Plain-English short label for UI */
  label: string;
  /** 1-2 sentence explanation, no jargon */
  tooltip: string;
  /** Optional analogy to mainstream sport or everyday life */
  analogy?: string;
  /** Optional human-readable unit */
  unit?: string;
}

// ── Racing Terms ─────────────────────────────────────────────────────────

export const GLOSSARY: Record<string, GlossaryEntry> = {
  furlong: {
    term: "furlong",
    label: "Race Segment",
    tooltip: "One furlong is about 200 meters (or 660 feet). Most races are 5 to 12 furlongs long.",
    analogy: "Think of it like laps — a 6-furlong race has 6 segments to track.",
  },
  gate: {
    term: "gate",
    label: "Checkpoint",
    tooltip: "A GPS measurement point on the track. Horses are tracked at every half-furlong (about 100 meters) throughout the race.",
    analogy: "Like split-time markers in a swimming race — we know exactly how fast each horse was at every checkpoint.",
  },
  front_runner: {
    term: "Front Runner",
    label: "Front Runner",
    tooltip: "A horse that likes to lead from the start. They go fast early and try to hold on at the end.",
    analogy: "Like a sprinter who takes the lead from the gun — exciting to watch, but can they keep it up?",
  },
  stalker: {
    term: "Stalker",
    label: "Stalker",
    tooltip: "A horse that sits just behind the leaders, saving energy for a push in the final stretch.",
    analogy: "Like a cyclist who drafts behind the pack before making their move — strategic and patient.",
  },
  closer: {
    term: "Closer",
    label: "Closer",
    tooltip: "A horse that starts near the back and makes a big move at the end. They rely on a powerful finishing kick.",
    analogy: "Like a marathon runner who negative-splits — slow and steady early, then surges past everyone at the end.",
  },
  post_position: {
    term: "Post Position",
    label: "Starting Gate",
    tooltip: "The numbered gate a horse starts from (1 is closest to the inside rail). Some positions have slight advantages depending on the track.",
    analogy: "Like lane assignments in swimming or track — the inside lane can be an advantage on turns.",
  },
  morning_line: {
    term: "Morning Line",
    label: "Opening Odds",
    tooltip: "The track handicapper's estimate of each horse's chances, set before any bets are placed. Lower odds = more likely to win.",
    analogy: "Like a pre-game point spread in football — the expert's best guess before the public weighs in.",
  },
  field_size: {
    term: "Field Size",
    label: "Number of Horses",
    tooltip: "How many horses are in this race. Larger fields (10+) are harder to predict; smaller fields (5-6) tend to favor the best horse.",
  },

  // ── GPS & Speed Terms ─────────────────────────────────────────────────

  speed_figure: {
    term: "Speed Figure",
    label: "Speed Rating",
    tooltip: "A score that measures how fast a horse ran, adjusted for track conditions and distance. 100 is average; 110+ is elite. Higher is better.",
    analogy: "Like a quarterback's passer rating — one number that captures overall performance, adjusted for difficulty.",
    unit: "points (100 = average)",
  },
  stride_efficiency: {
    term: "Stride Efficiency",
    label: "Stride Efficiency",
    tooltip: "How much speed a horse gets from each stride. Higher efficiency means the horse covers more ground per stride, wasting less energy.",
    analogy: "Like miles per gallon in a car — a more efficient horse can maintain speed with less effort, which matters most at the end of a race.",
  },
  top_speed: {
    term: "Top Speed",
    label: "Peak Speed",
    tooltip: "The fastest speed this horse reached during a race, measured by GPS at every checkpoint.",
    unit: "ft/s",
  },
  avg_speed: {
    term: "Avg Speed",
    label: "Average Speed",
    tooltip: "The horse's average speed across the entire race. A good overall indicator of ability.",
    unit: "ft/s",
  },
  ft_per_second: {
    term: "ft/s",
    label: "feet per second",
    tooltip: "Speed measured in feet per second. A fast racehorse runs about 55-60 feet per second (roughly 37-40 mph). For reference, Usain Bolt's top speed was about 34 ft/s.",
  },
  speed_curve: {
    term: "Speed Curve",
    label: "Race Speed Pattern",
    tooltip: "A graph showing how a horse's speed changes throughout the race — from the start, through the middle, to the finish line.",
    analogy: "Like a heart rate graph during a workout — you can see when they pushed hard, when they coasted, and when they sprinted to the finish.",
  },
  late_acceleration: {
    term: "Late Acceleration",
    label: "Finishing Kick",
    tooltip: "How much faster a horse runs in the final stretch compared to the beginning. A positive number means they sped up when it mattered most.",
  },

  // ── Pace & Race Dynamics ──────────────────────────────────────────────

  pace: {
    term: "Pace",
    label: "Race Tempo",
    tooltip: "How fast the race is being run early on. A fast pace tires out the leaders and helps horses who come from behind. A slow pace helps the leaders hold on.",
    analogy: "Like pacing in a marathon — go out too fast and you'll fade; go too slow and the front-runners get away.",
  },
  pace_fit: {
    term: "Pace Fit",
    label: "Style Match",
    tooltip: "Whether this horse's running style benefits from the expected pace of this race. A green checkmark means conditions favor them.",
  },

  // ── Betting Terms ─────────────────────────────────────────────────────

  win_pct: {
    term: "Win %",
    label: "Win Chance",
    tooltip: "The percentage of simulated races this horse won. We run hundreds of simulations using each horse's GPS speed data to estimate their chances.",
  },
  place_pct: {
    term: "Place %",
    label: "Top 2 Chance",
    tooltip: "The percentage of simulated races this horse finished 1st or 2nd.",
  },
  show_pct: {
    term: "Show %",
    label: "Top 3 Chance",
    tooltip: "The percentage of simulated races this horse finished in the top 3.",
  },
  fair_odds: {
    term: "Fair Odds",
    label: "True Odds",
    tooltip: "What the odds should be based purely on the simulation results — before the track takes their cut.",
  },
  gps_edge: {
    term: "GPS Edge",
    label: "GPS Advantage",
    tooltip: "The difference between what our GPS model predicts and what the morning line odds suggest. A positive number means our model sees value the odds don't reflect.",
    analogy: "Like finding a stock that's undervalued — the market price doesn't reflect what the data shows.",
  },

  // ── Model & Statistical Terms ─────────────────────────────────────────

  r_squared: {
    term: "R²",
    label: "Prediction Accuracy",
    tooltip: "How well the model's predictions match actual race results. 0% = random guess, 100% = perfect prediction. Our GPS model achieves about 37% — significantly better than the 23% from traditional data alone.",
    analogy: "Think of it like a weather forecast accuracy score. 37% might sound low, but in horse racing (where upsets happen constantly), it's a meaningful edge.",
  },
  mae: {
    term: "MAE",
    label: "Average Error",
    tooltip: "On average, how many positions off our prediction is. An MAE of 1.6 means we typically predict a horse's finish within about 1-2 places of where they actually end up.",
    analogy: "If we predict a horse finishes 3rd and they actually finish 2nd or 4th, that's an error of 1 position — pretty close.",
  },
  monte_carlo: {
    term: "Monte Carlo",
    label: "Race Simulation",
    tooltip: "We simulate each race hundreds of times with realistic randomness — just like how a real race has unexpected moments. The win percentage is how often each horse won across all those simulated races.",
    analogy: "Imagine re-running the same race 500 times. Some races the favorite wins, some races an underdog pulls an upset. The percentages show how often each outcome happened.",
  },
  transfer_model: {
    term: "Transfer Model",
    label: "Estimated GPS Data",
    tooltip: "For tracks without GPS sensors, we estimate what the GPS data would look like based on traditional race results. It's less accurate than real GPS, but still adds useful insight.",
    analogy: "Like estimating someone's marathon time from their 5K time — directionally useful, but not as precise as actually timing the marathon.",
  },
  ensemble: {
    term: "Ensemble",
    label: "Combined Model",
    tooltip: "We use two different prediction methods and average their answers. This is more reliable than using just one — like getting a second opinion from a doctor.",
  },

  // ── Track/Surface Terms ───────────────────────────────────────────────

  surface_dirt: {
    term: "Dirt",
    label: "Dirt Track",
    tooltip: "A traditional racetrack surface made of packed dirt or sand. Most American races are run on dirt. Horses can run faster on dirt than turf.",
  },
  surface_turf: {
    term: "Turf",
    label: "Grass Track",
    tooltip: "A racetrack surface of natural grass. Turf races tend to be slightly slower, and some horses strongly prefer one surface over the other.",
    analogy: "Like the difference between playing soccer on grass vs. artificial turf — same sport, different feel, different specialists.",
  },
  track_bias: {
    term: "Track Bias",
    label: "Track Advantage",
    tooltip: "Some tracks give an advantage to horses on the inside rail or outside. This depends on track conditions, weather, and maintenance.",
    analogy: "Like home-field advantage in team sports — subtle but real.",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────

/** Get a glossary entry by key */
export function getGlossary(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key];
}

/** Get the plain-English label for a term */
export function plainLabel(key: string): string {
  return GLOSSARY[key]?.label ?? key;
}

/** Get the tooltip text for a term */
export function getTooltip(key: string): string {
  return GLOSSARY[key]?.tooltip ?? "";
}

/** Format a speed in ft/s with human context */
export function humanSpeed(ftPerSec: number): string {
  const mph = ftPerSec * 0.6818;
  return `${ftPerSec.toFixed(1)} ft/s (${mph.toFixed(0)} mph)`;
}

/** Format a speed figure with context */
export function humanSpeedFigure(figure: number): string {
  if (figure >= 115) return `${Math.round(figure)} — elite (top 5%)`;
  if (figure >= 105) return `${Math.round(figure)} — above average`;
  if (figure >= 95) return `${Math.round(figure)} — average`;
  if (figure >= 85) return `${Math.round(figure)} — below average`;
  return `${Math.round(figure)} — developing`;
}

/** Format a win probability with field context */
export function humanWinPct(pct: number, fieldSize: number): string {
  const rank = pct > 30 ? "strong favorite" :
    pct > 20 ? "one of the top contenders" :
    pct > 10 ? "a solid chance" :
    pct > 5 ? "a longshot with a real chance" :
    "a longshot";
  return `${pct.toFixed(1)}% — ${rank} in a field of ${fieldSize}`;
}

/** Format R² for non-technical audiences */
export function humanR2(r2: number): string {
  const pct = Math.round(r2 * 100);
  if (r2 >= 0.5) return `${pct}% accuracy — strong predictive power`;
  if (r2 >= 0.3) return `${pct}% accuracy — meaningful edge over random`;
  if (r2 >= 0.15) return `${pct}% accuracy — useful but limited`;
  return `${pct}% accuracy — weak signal`;
}

/** Format MAE for non-technical audiences */
export function humanMAE(mae: number): string {
  if (mae <= 1.0) return `Within ${mae.toFixed(1)} position on average — very accurate`;
  if (mae <= 2.0) return `Within ${mae.toFixed(1)} positions on average — good`;
  if (mae <= 3.0) return `Within ${mae.toFixed(1)} positions on average — moderate`;
  return `Within ${mae.toFixed(1)} positions on average — rough estimate`;
}

/** Format a GPS Edge value with context */
export function humanEdge(edge: number, classification: string): string {
  if (classification === "strong_value") return `+${edge.toFixed(1)}% — GPS sees hidden value here`;
  if (classification === "moderate_value") return `+${edge.toFixed(1)}% — slight GPS advantage`;
  if (classification === "fair") return `${edge > 0 ? "+" : ""}${edge.toFixed(1)}% — odds look about right`;
  return `${edge.toFixed(1)}% — public may be overvaluing this horse`;
}

/** Convert feet to a human-scale comparison */
export function humanDistance(feet: number): string {
  if (feet <= 3) return `${feet.toFixed(1)} feet — about one stride`;
  if (feet <= 10) return `${feet.toFixed(0)} feet — the length of a car`;
  if (feet <= 30) return `${feet.toFixed(0)} feet — about a school bus length`;
  if (feet <= 100) return `${feet.toFixed(0)} feet — roughly a basketball court`;
  return `${feet.toFixed(0)} feet — more than a football field`;
}

/** Convert a time delta to human-scale for racing */
export function humanTimeDelta(seconds: number): string {
  if (seconds < 0.1) return "a nose — virtually identical";
  if (seconds < 0.3) return `${seconds.toFixed(1)}s — about 1 horse length`;
  if (seconds < 0.5) return `${seconds.toFixed(1)}s — about 2 horse lengths`;
  if (seconds < 1.0) return `${seconds.toFixed(1)}s — about ${Math.round(seconds / 0.17)} lengths`;
  return `${seconds.toFixed(1)}s — a significant gap (${Math.round(seconds / 0.17)} lengths)`;
}
