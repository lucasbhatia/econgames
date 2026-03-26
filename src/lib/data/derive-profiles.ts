// Auto-derive HorseProfile objects from GPS race data (HorseData + RaceData)
// Used to ensure every horse that appears in an XRay race can be simulated

import type { HorseData, RaceData, GateData } from "./race-data";
import type { HorseProfile, RunningStyle } from "./horse-profiles";

const DERIVED_COLORS = [
  "#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#e67e22",
  "#1abc9c", "#34495e", "#f39c12", "#c0392b", "#2980b9",
  "#27ae60", "#8e44ad", "#d35400", "#16a085", "#7f8c8d",
  "#c9a84c", "#1a3a2a", "#5b3e8a", "#c41e3a", "#3a7cc9",
  "#d4763a", "#2aa198", "#b55dba", "#8b7355", "#6c8c3c",
];

const SIRES = [
  "Into Mischief", "Gun Runner", "Quality Road", "Curlin", "Tapit",
  "Nyquist", "Uncle Mo", "Pioneerof the Nile", "Medaglia d'Oro", "Speightstown",
  "War Front", "Kingman (GB)", "Dubawi (IRE)", "Frankel (GB)", "American Pharoah",
  "Constitution", "Not This Time", "Munnings", "City of Light", "Justify",
];

const DAMS = [
  "Starlight Melody", "Diamond Creek", "Autumn Wind", "Silver Lining", "Crimson Dawn",
  "Velvet Thunder", "Midnight Bloom", "Golden Horizon", "Storm Chaser", "Iron Rose",
  "Pacific Breeze", "Desert Flower", "Nordic Spirit", "Crystal Bay", "Emerald Isle",
  "Thunder Queen", "Silk Voyage", "Royal Gem", "Amber Grace", "Wild Lavender",
];

const TRAINERS = [
  "Chad Brown", "Bob Baffert", "Todd Pletcher", "Steve Asmussen", "Brad Cox",
  "Bill Mott", "Shug McGaughey", "Mark Casse", "Mike Maker", "Dale Romans",
  "John Sadler", "Christophe Clement", "Richard Mandella", "Doug O'Neill", "Peter Miller",
];

const JOCKEYS = [
  "Irad Ortiz Jr", "Flavien Prat", "John Velazquez", "Joel Rosario", "Tyler Gaffalione",
  "Luis Saez", "Javier Castellano", "Jose Ortiz", "Florent Geroux", "Mike Smith",
  "Drayden Van Dyke", "Ricardo Santana Jr", "Manny Franco", "Junior Alvarado", "Brian Hernandez Jr",
];

/** Deterministic hash from a string to pick consistent random-seeming values */
function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], name: string, offset = 0): T {
  return arr[(hashName(name) + offset) % arr.length];
}

function inferRunningStyle(gates: GateData[]): RunningStyle {
  if (!gates || gates.length < 4) return "Stalker";
  const earlyAvg = (gates[0].p + gates[1].p + gates[2].p) / 3;
  if (earlyAvg <= 2.5) return "Front Runner";
  if (earlyAvg <= 5.5) return "Stalker";
  return "Closer";
}

function resampleTo10(speeds: number[]): number[] {
  if (speeds.length === 10) return speeds;
  const result: number[] = [];
  for (let i = 0; i < 10; i++) {
    const srcIdx = (i / 9) * (speeds.length - 1);
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, speeds.length - 1);
    const frac = srcIdx - lo;
    result.push(Math.round((speeds[lo] * (1 - frac) + speeds[hi] * frac) * 10) / 10);
  }
  return result;
}

function generatePersonality(name: string, style: RunningStyle, topSpeed: number, finish: number): string {
  if (style === "Front Runner") {
    if (finish <= 2) {
      return `${name} is a wire-to-wire warrior who takes the lead from the break and dares the field to catch them. GPS data shows blistering early fractions that most horses simply can't match. When ${name} gets loose on the front end, the race is often over before it starts.`;
    }
    return `${name} wants the lead and usually gets it, but sustaining that speed is the challenge. The GPS profile shows strong early speed that fades in the stretch — the kind of horse that makes you hold your breath in the final furlong.`;
  }
  if (style === "Closer") {
    if (finish <= 2) {
      return `${name} is a patient closer with a devastating late kick. They sit quietly in the back of the pack, saving energy while the speed horses do the dirty work, then unleash in the stretch. GPS telemetry shows a dramatic acceleration curve that peaks exactly when it matters most.`;
    }
    return `${name} comes from well off the pace and relies on closing speed to pick up the pieces. The late turn of foot is real — GPS data confirms genuine acceleration — but sometimes the front runners are just too far gone.`;
  }
  // Stalker
  if (finish <= 2) {
    return `${name} is the textbook stalker — sits within striking distance, saves ground on the turns, and pounces when the leaders get tired. The GPS speed curve is remarkably smooth, showing a horse that rations energy perfectly and always has something left for the drive.`;
  }
  return `${name} runs a tactically smart race from mid-pack, tracking the pace and looking for an opening. The GPS profile shows steady speed throughout with a moderate late move — reliable but rarely explosive.`;
}

function generateStrengths(style: RunningStyle, topSpeed: number, avgSpeed: number, efficiency: number): string[] {
  const strengths: string[] = [];
  if (topSpeed >= 18.0) {
    strengths.push(`Elite top speed of ${topSpeed.toFixed(1)} ft/s — in the upper tier of GPS-tracked horses`);
  } else if (topSpeed >= 17.5) {
    strengths.push(`Strong peak velocity of ${topSpeed.toFixed(1)} ft/s — competitive with top-level competition`);
  }
  if (style === "Front Runner") {
    strengths.push("Can dictate pace from the front, forcing others to chase");
  } else if (style === "Closer") {
    strengths.push("Patient running style preserves energy for a strong stretch run");
  } else {
    strengths.push("Versatile tactical position allows adaptation to different pace scenarios");
  }
  if (efficiency >= 2.3) {
    strengths.push(`Stride efficiency of ${efficiency.toFixed(2)} indicates excellent biomechanics`);
  } else {
    strengths.push(`Consistent GPS speed profile shows professional-level fitness`);
  }
  return strengths;
}

function generateWeaknesses(style: RunningStyle, topSpeed: number, avgSpeed: number, finish: number): string[] {
  const weaknesses: string[] = [];
  if (style === "Front Runner" && finish > 4) {
    weaknesses.push("GPS data shows significant late-race deceleration — tires when pressured");
  } else if (style === "Closer" && finish > 4) {
    weaknesses.push("Closing kick doesn't always arrive in time — can run out of real estate");
  } else if (finish > 6) {
    weaknesses.push("Finishing positions suggest this horse is outclassed at the highest level");
  }
  if (topSpeed < 17.5) {
    weaknesses.push(`Top speed of ${topSpeed.toFixed(1)} ft/s is below the elite threshold — may struggle against top-tier closers`);
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Limited GPS sample size means consistency is still unproven");
  }
  return weaknesses;
}

function generateFunFacts(name: string, race: RaceData, horse: HorseData): string[] {
  const facts: string[] = [];
  facts.push(`Raced at ${race.track} on ${race.date} in a $${race.purse >= 1000000 ? (race.purse / 1000000).toFixed(0) + "M" : (race.purse / 1000).toFixed(0) + "K"} ${race.raceType === "STK" ? "Stakes" : race.raceType} event`);
  if (horse.odds !== null && horse.odds < 5) {
    facts.push(`Went off at ${horse.odds}-1 odds — the bettors' pick`);
  } else if (horse.odds !== null && horse.odds > 40) {
    facts.push(`Longshot at ${horse.odds}-1 odds — the kind of horse that makes trifectas pay`);
  }
  const maxSpd = Math.max(...horse.gates.map((g) => g.spd));
  facts.push(`Peak GPS speed of ${maxSpd.toFixed(1)} ft/s recorded during the race`);
  return facts;
}

/**
 * Derive a HorseProfile from raw GPS race data.
 * Uses the horse's gate-by-gate telemetry to compute all performance metrics.
 */
export function deriveProfileFromGPS(
  horse: HorseData,
  race: RaceData,
  colorIndex: number
): HorseProfile {
  const speeds = horse.gates.map((g) => g.spd);
  const strides = horse.gates.map((g) => g.sl);
  const topSpeed = Math.max(...speeds);
  const avgSpeed = Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10;
  const avgStride = strides.reduce((a, b) => a + b, 0) / strides.length;
  const strideEfficiency = Math.round((avgSpeed / avgStride) * 100) / 100;
  const runningStyle = inferRunningStyle(horse.gates);
  const speedCurve = resampleTo10(speeds);
  const h = hashName(horse.name);
  const surface = race.surface === "D" ? "Dirt" : race.surface === "T" ? "Turf" : "Dirt";

  return {
    name: horse.name,
    registrationNumber: `GPS-${race.track}-${String(h % 10000).padStart(5, "0")}`,
    runningStyle,
    topSpeed,
    avgSpeed,
    strideEfficiency,
    avgFinish: horse.finish,
    races: 1,
    bestDistance: `${race.distance}F`,
    bestSurface: surface === "Dirt" ? "Dirt" : "Turf",
    speedCurve,
    recentForm: [
      { finish: horse.finish, date: race.date, track: race.track.trim() },
    ],
    color: DERIVED_COLORS[colorIndex % DERIVED_COLORS.length],
    imageUrl: `/horses/${horse.name.replace(/[^a-zA-Z]/g, "")}.png`,
    sire: pick(SIRES, horse.name, 0),
    dam: pick(DAMS, horse.name, 1),
    age: 3 + (h % 4), // 3-6
    weight: 1120 + (h % 80), // 1120-1200
    trainer: pick(TRAINERS, horse.name, 2),
    jockey: pick(JOCKEYS, horse.name, 3),
    earnings: 50000 + (h % 20) * 75000,
    wins: 1 + (h % 8),
    personality: generatePersonality(horse.name, runningStyle, topSpeed, horse.finish),
    funFacts: generateFunFacts(horse.name, race, horse),
    strengths: generateStrengths(runningStyle, topSpeed, avgSpeed, strideEfficiency),
    weaknesses: generateWeaknesses(runningStyle, topSpeed, avgSpeed, horse.finish),
  };
}

/**
 * Derive profiles for ALL horses in the provided races,
 * skipping any that already exist in the handcrafted profiles set.
 */
export function deriveAllMissingProfiles(
  races: RaceData[],
  existingNames: Set<string>
): HorseProfile[] {
  const derived: HorseProfile[] = [];
  const seen = new Set<string>();
  let colorIdx = 0;

  for (const race of races) {
    for (const horse of race.horses) {
      const nameLower = horse.name.toLowerCase();
      if (existingNames.has(nameLower) || seen.has(nameLower)) continue;
      seen.add(nameLower);
      derived.push(deriveProfileFromGPS(horse, race, colorIdx));
      colorIdx++;
    }
  }

  return derived;
}
