// Upcoming races with entries, speed figures, and profile references
// Demonstrates GPS-tracked vs non-GPS tracks for the extension concept

import type { RunningStyle } from "./horse-profiles";

export interface RaceEntry {
  horse: string;
  runningStyle: RunningStyle;
  speedFigure: number; // normalized 80-110 scale
  strideEfficiency: number;
  hasProfile: boolean; // true if horse exists in horse-profiles.ts
  morningLineOdds: number;
  jockey: string;
  trainer: string;
  postPosition: number;
  weight: number; // lbs
}

export interface UpcomingRace {
  id: string;
  track: string;
  trackName: string;
  date: string;
  raceNum: number;
  postTime: string; // e.g. "3:45 PM ET"
  distance: string;
  surface: "Dirt" | "Turf" | "Synthetic";
  raceType: string;
  purse: number;
  hasGPS: boolean; // whether this track has GPS sectional timing
  entries: RaceEntry[];
}

// ── Race 1: Gulfstream Park (GPS Track) ────────────────────────────────────
// Allowance Optional Claiming, 8.5F Dirt, $82,000

const gulfstreamAllowance: UpcomingRace = {
  id: "GP-2026-0329-R6",
  track: "GP",
  trackName: "Gulfstream Park",
  date: "2026-03-29",
  raceNum: 6,
  postTime: "3:45 PM ET",
  distance: "8.5F",
  surface: "Dirt",
  raceType: "AOC 62500",
  purse: 82000,
  hasGPS: true,
  entries: [
    { horse: "Confessional", runningStyle: "Stalker", speedFigure: 104, strideEfficiency: 2.19, hasProfile: true, morningLineOdds: 2.5, jockey: "I. Ortiz Jr.", trainer: "C. Brown", postPosition: 5, weight: 124 },
    { horse: "Moon Over Miami", runningStyle: "Stalker", speedFigure: 101, strideEfficiency: 2.29, hasProfile: true, morningLineOdds: 3.0, jockey: "T. Gaffalione", trainer: "S. Joseph Jr.", postPosition: 2, weight: 122 },
    { horse: "Steel Reserve", runningStyle: "Stalker", speedFigure: 98, strideEfficiency: 2.25, hasProfile: true, morningLineOdds: 5.0, jockey: "J. Castellano", trainer: "T. Pletcher", postPosition: 7, weight: 122 },
    { horse: "Firestorm King", runningStyle: "Front Runner", speedFigure: 103, strideEfficiency: 2.37, hasProfile: true, morningLineOdds: 4.0, jockey: "L. Saez", trainer: "B. Cox", postPosition: 1, weight: 124 },
    { horse: "Dawn Patrol", runningStyle: "Closer", speedFigure: 99, strideEfficiency: 2.18, hasProfile: true, morningLineOdds: 6.0, jockey: "J. Velazquez", trainer: "M. Maker", postPosition: 8, weight: 120 },
    { horse: "Harbor Point", runningStyle: "Front Runner", speedFigure: 95, strideEfficiency: 2.21, hasProfile: false, morningLineOdds: 10.0, jockey: "E. Cancel", trainer: "R. Rodriguez", postPosition: 3, weight: 120 },
    { horse: "Sandcastle Empire", runningStyle: "Stalker", speedFigure: 93, strideEfficiency: 2.17, hasProfile: false, morningLineOdds: 15.0, jockey: "C. DeCarlo", trainer: "J. Englehart", postPosition: 4, weight: 118 },
    { horse: "Street Pharoah", runningStyle: "Closer", speedFigure: 91, strideEfficiency: 2.14, hasProfile: false, morningLineOdds: 20.0, jockey: "M. Franco", trainer: "L. Rice", postPosition: 6, weight: 118 },
    { horse: "Vindication Day", runningStyle: "Front Runner", speedFigure: 89, strideEfficiency: 2.19, hasProfile: false, morningLineOdds: 30.0, jockey: "D. Davis", trainer: "G. Weaver", postPosition: 9, weight: 116 },
  ],
};

// ── Race 2: Keeneland (GPS Track) ──────────────────────────────────────────
// Grade 2 Stakes, 9F Dirt, $400,000

const keenelandStakes: UpcomingRace = {
  id: "KEE-2026-0405-R9",
  track: "KEE",
  trackName: "Keeneland",
  date: "2026-04-05",
  raceNum: 9,
  postTime: "5:15 PM ET",
  distance: "9F",
  surface: "Dirt",
  raceType: "G2 STK",
  purse: 400000,
  hasGPS: true,
  entries: [
    { horse: "Regal Prince", runningStyle: "Stalker", speedFigure: 108, strideEfficiency: 2.32, hasProfile: true, morningLineOdds: 2.0, jockey: "J. Rosario", trainer: "C. Brown", postPosition: 4, weight: 124 },
    { horse: "Incredibolt", runningStyle: "Closer", speedFigure: 106, strideEfficiency: 2.22, hasProfile: true, morningLineOdds: 3.0, jockey: "I. Ortiz Jr.", trainer: "T. Pletcher", postPosition: 7, weight: 122 },
    { horse: "Buetane", runningStyle: "Closer", speedFigure: 105, strideEfficiency: 2.24, hasProfile: true, morningLineOdds: 3.5, jockey: "L. Saez", trainer: "B. Cox", postPosition: 2, weight: 122 },
    { horse: "Quiet Storm", runningStyle: "Closer", speedFigure: 104, strideEfficiency: 2.20, hasProfile: true, morningLineOdds: 5.0, jockey: "J. Velazquez", trainer: "W. Mott", postPosition: 8, weight: 120 },
    { horse: "Lockstocknpharoah", runningStyle: "Front Runner", speedFigure: 102, strideEfficiency: 2.25, hasProfile: true, morningLineOdds: 6.0, jockey: "T. Gaffalione", trainer: "S. Asmussen", postPosition: 1, weight: 122 },
    { horse: "Silk and Steel", runningStyle: "Stalker", speedFigure: 103, strideEfficiency: 2.31, hasProfile: true, morningLineOdds: 5.0, jockey: "F. Prat", trainer: "J. Sadler", postPosition: 6, weight: 120 },
    { horse: "Continental Drift", runningStyle: "Stalker", speedFigure: 97, strideEfficiency: 2.23, hasProfile: false, morningLineOdds: 12.0, jockey: "B. Hernandez Jr.", trainer: "D. Romans", postPosition: 3, weight: 118 },
    { horse: "Moonshine Runner", runningStyle: "Front Runner", speedFigure: 94, strideEfficiency: 2.28, hasProfile: false, morningLineOdds: 20.0, jockey: "C. Landeros", trainer: "K. McPeek", postPosition: 5, weight: 118 },
    { horse: "Iron Constitution", runningStyle: "Closer", speedFigure: 96, strideEfficiency: 2.16, hasProfile: false, morningLineOdds: 15.0, jockey: "J. Castellano", trainer: "M. Maker", postPosition: 9, weight: 118 },
    { horse: "Sovereign Light", runningStyle: "Stalker", speedFigure: 92, strideEfficiency: 2.20, hasProfile: false, morningLineOdds: 30.0, jockey: "A. Beschizza", trainer: "I. Wilkes", postPosition: 10, weight: 116 },
  ],
};

// ── Race 3: Santa Anita (Non-GPS Track — extension concept) ────────────────
// Grade 3 Stakes, 7F Dirt, $200,000
// No GPS sectional data — demonstrates how the model extends to non-GPS tracks
// using traditional timing + inferred stride data from PPs

const santaAnitaSprint: UpcomingRace = {
  id: "SA-2026-0412-R8",
  track: "SA",
  trackName: "Santa Anita Park",
  date: "2026-04-12",
  raceNum: 8,
  postTime: "6:30 PM PT",
  distance: "7F",
  surface: "Dirt",
  raceType: "G3 STK",
  purse: 200000,
  hasGPS: false,
  entries: [
    { horse: "Blazing Glory", runningStyle: "Front Runner", speedFigure: 107, strideEfficiency: 2.38, hasProfile: true, morningLineOdds: 2.5, jockey: "F. Prat", trainer: "B. Baffert", postPosition: 3, weight: 124 },
    { horse: "Copper Bullet", runningStyle: "Front Runner", speedFigure: 105, strideEfficiency: 2.41, hasProfile: true, morningLineOdds: 3.0, jockey: "J. Rosario", trainer: "T. Pletcher", postPosition: 6, weight: 122 },
    { horse: "Last Tycoon", runningStyle: "Front Runner", speedFigure: 101, strideEfficiency: 2.35, hasProfile: true, morningLineOdds: 5.0, jockey: "I. Ortiz Jr.", trainer: "C. Brown", postPosition: 1, weight: 122 },
    { horse: "Silk and Steel", runningStyle: "Stalker", speedFigure: 103, strideEfficiency: 2.31, hasProfile: true, morningLineOdds: 4.0, jockey: "M. Smith", trainer: "J. Sadler", postPosition: 5, weight: 120 },
    { horse: "Pacific Thunder", runningStyle: "Stalker", speedFigure: 99, strideEfficiency: 2.27, hasProfile: false, morningLineOdds: 8.0, jockey: "U. Rispoli", trainer: "P. D'Amato", postPosition: 2, weight: 120 },
    { horse: "Golden State Kid", runningStyle: "Closer", speedFigure: 96, strideEfficiency: 2.19, hasProfile: false, morningLineOdds: 12.0, jockey: "D. Van Dyke", trainer: "R. Mandella", postPosition: 7, weight: 118 },
    { horse: "Malibu Express", runningStyle: "Front Runner", speedFigure: 94, strideEfficiency: 2.33, hasProfile: false, morningLineOdds: 15.0, jockey: "R. Gonzalez", trainer: "M. Glatt", postPosition: 4, weight: 118 },
    { horse: "Arcadia Storm", runningStyle: "Closer", speedFigure: 92, strideEfficiency: 2.15, hasProfile: false, morningLineOdds: 20.0, jockey: "J. Bravo", trainer: "J. Shirreffs", postPosition: 8, weight: 116 },
  ],
};

// ── Exports ────────────────────────────────────────────────────────────────

export const UPCOMING_RACES: UpcomingRace[] = [
  gulfstreamAllowance,
  keenelandStakes,
  santaAnitaSprint,
];

/** Get races that have GPS tracking available */
export function getGPSRaces(): UpcomingRace[] {
  return UPCOMING_RACES.filter((r) => r.hasGPS);
}

/** Get races at a specific track */
export function getRacesByTrack(trackCode: string): UpcomingRace[] {
  return UPCOMING_RACES.filter((r) => r.track === trackCode);
}

/** Get all entries that have a horse profile for deeper analysis */
export function getProfiledEntries(race: UpcomingRace): RaceEntry[] {
  return race.entries.filter((e) => e.hasProfile);
}
