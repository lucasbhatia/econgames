import type { SimHorse, Surface, TrackBias } from "@/lib/simulation/types";

/* ================================================================== */
/*  Color Constants                                                    */
/* ================================================================== */

export const GOLD = "#b8941f";
export const GOLD_LIGHT = "#c9a84c";
export const BG_WHITE = "#ffffff";
export const BG_CARD = "#f8f6f2";
export const BG_DARK = "#1a1a2a";
export const TEXT = "#1a1a2a";
export const TEXT_SEC = "#6b7280";
export const TEXT_MUTED = "#9ca3af";
export const BORDER = "#e5e2db";
export const GREEN = "#16a34a";
export const RED = "#dc2626";
export const BLUE = "#2563eb";
export const PURPLE = "#7c3aed";
export const ORANGE = "#ea580c";

export const RACE_COLORS = [
  "#c9a84c", "#e74c3c", "#3498db", "#2ecc71", "#9b59b6",
  "#e67e22", "#1abc9c", "#34495e", "#f39c12", "#c0392b",
  "#2980b9", "#27ae60",
];

/* ================================================================== */
/*  Track & Race Constants                                             */
/* ================================================================== */

export const TRACK_CONFIGS = [
  { name: "Churchill Downs", id: "CD", bias: "none" as TrackBias },
  { name: "Saratoga", id: "SAR", bias: "slight_inside" as TrackBias },
  { name: "Santa Anita", id: "SA", bias: "none" as TrackBias },
  { name: "Belmont Park", id: "BEL", bias: "slight_outside" as TrackBias },
  { name: "Del Mar", id: "DMR", bias: "none" as TrackBias },
  { name: "Keeneland", id: "KEE", bias: "slight_inside" as TrackBias },
  { name: "Gulfstream Park", id: "GP", bias: "none" as TrackBias },
  { name: "Aqueduct", id: "AQU", bias: "slight_inside" as TrackBias },
  { name: "Oaklawn Park", id: "OP", bias: "none" as TrackBias },
  { name: "Tampa Bay Downs", id: "TAM", bias: "none" as TrackBias },
];

export const RACE_NAMES = [
  "The Sprint Classic", "The Maiden Dash", "The Turf Mile",
  "The Champagne Stakes", "The Gold Cup", "The Derby Trial",
  "The Breeders' Challenge", "The Lightning Stakes",
  "The Crown Jewel", "The Midnight Run", "The Iron Horse",
  "The Victory Lap", "The Thunder Cup", "The Diamond Stakes",
  "The Eclipse Run", "The Phoenix Stakes",
];

export const CONDITIONS = ["Fast", "Good", "Yielding", "Firm"];

export const SCHOOLS = [
  "University of Kentucky",
  "NYU",
  "MIT",
  "Stanford",
  "Harvard",
  "Wharton",
  "University of Chicago",
  "Columbia",
  "Duke",
  "Yale",
  "Princeton",
  "Georgetown",
  "UCLA",
  "UC Berkeley",
  "Michigan",
  "Virginia",
  "Cornell",
  "Northwestern",
  "Notre Dame",
  "Other",
];

/* ================================================================== */
/*  Bet Types                                                          */
/* ================================================================== */

export type Phase = "betting" | "post_parade" | "racing" | "results";

export type BetType = "win" | "place" | "show" | "exacta" | "exacta_box" | "trifecta" | "trifecta_box" | "trifecta_key" | "superfecta" | "superfecta_box";

export const BET_TYPE_CONFIG: Record<BetType, { label: string; picks: number; description: string; category: "straight" | "exotic" }> = {
  win:             { label: "Win",            picks: 1, description: "Horse must finish 1st",                     category: "straight" },
  place:           { label: "Place",          picks: 1, description: "Horse must finish 1st or 2nd",              category: "straight" },
  show:            { label: "Show",           picks: 1, description: "Horse must finish in top 3",                category: "straight" },
  exacta:          { label: "Exacta",         picks: 2, description: "Pick 1st and 2nd in exact order",           category: "exotic" },
  exacta_box:      { label: "Exacta Box",     picks: 2, description: "Pick 1st and 2nd in any order",             category: "exotic" },
  trifecta:        { label: "Trifecta",       picks: 3, description: "Pick 1st, 2nd, 3rd in exact order",         category: "exotic" },
  trifecta_box:    { label: "Trifecta Box",   picks: 3, description: "Pick top 3 in any order",                   category: "exotic" },
  trifecta_key:    { label: "Tri Key",        picks: 3, description: "Key horse wins, others fill 2nd/3rd",       category: "exotic" },
  superfecta:      { label: "Superfecta",     picks: 4, description: "Pick 1st through 4th in exact order",       category: "exotic" },
  superfecta_box:  { label: "Super Box",      picks: 4, description: "Pick top 4 in any order",                   category: "exotic" },
};

export function boxCombinations(picks: number): number {
  if (picks === 2) return 2;
  if (picks === 3) return 6;
  if (picks === 4) return 24;
  return 1;
}

/* ================================================================== */
/*  Shared Types                                                       */
/* ================================================================== */

export interface Bet {
  id: string;
  type: BetType;
  horseNames: string[];
  amount: number;
  totalCost: number;
  combinations: number;
}

export interface UserProfile {
  id: string;
  name: string;
  school: string;
  bankroll: number;
  startingBankroll: number;
  totalProfit: number;
  racesPlayed: number;
  biggestWin: number;
  history: { raceEpoch: number; profit: number; bankroll: number }[];
}

export interface RaceCard {
  name: string;
  track: (typeof TRACK_CONFIGS)[number];
  distance: number;
  surface: Surface;
  condition: string;
  purse: number;
  raceNumber: number;
  epoch: number;
  horses: SimHorse[];
  odds: Record<string, { win: number; place: number; show: number }>;
}

export interface BetResult {
  bet: Bet;
  payout: number;
  won: boolean;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

/** Convert decimal odds to traditional track fractional display */
export function formatOddsDisplay(decimalOdds: number): string {
  if (!isFinite(decimalOdds) || decimalOdds <= 1) return "Even";
  const profit = decimalOdds - 1;
  if (profit >= 30) return "30-1";
  if (profit >= 10) return `${Math.round(profit)}-1`;
  if (profit >= 5) return `${Math.round(profit)}-1`;
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
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  return best[1];
}

export function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 10000) return `$${(amount / 1000).toFixed(0)}k`;
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

export function getHorseSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
