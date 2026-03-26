"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Trophy,
  DollarSign,
  Play,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  Crown,
  Medal,
  Ticket,
  TrendingUp,
  Zap,
  RotateCcw,
  AlertCircle,
  Clock,
  Flag,
  Eye,
  Lock,
  Sparkles,
  CircleDot,
  Hash,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ALL_PROFILES } from "@/lib/data/horse-profiles";
import type { HorseProfile } from "@/lib/data/horse-profiles";
import { runMonteCarlo, simToReplayData } from "@/lib/simulation/engine";
import type { SimHorse, SimResults, Surface, TrackBias } from "@/lib/simulation/types";
import RaceReplay from "@/components/arena/RaceReplay";
import { useLeaderboard } from "@/lib/supabase/useLeaderboard";
import type { LeaderboardEntry, SchoolStanding } from "@/lib/supabase/useLeaderboard";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const GOLD = "#b8941f";
const GOLD_LIGHT = "#d4b84a";
const BG_WHITE = "#ffffff";
const BG_CARD = "#f8f6f2";
const BG_DARK = "#1a1a2a";
const TEXT = "#1a1a2a";
const TEXT_SEC = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#e5e2db";
const GREEN = "#16a34a";
const RED = "#dc2626";
const BLUE = "#2563eb";
const PURPLE = "#7c3aed";
const ORANGE = "#ea580c";

const RACE_COLORS = [
  "#c9a84c", "#e74c3c", "#3498db", "#2ecc71", "#9b59b6",
  "#e67e22", "#1abc9c", "#34495e", "#f39c12", "#c0392b",
  "#2980b9", "#27ae60",
];

const TRACK_CONFIGS = [
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

const RACE_NAMES = [
  "The Sprint Classic", "The Maiden Dash", "The Turf Mile",
  "The Champagne Stakes", "The Gold Cup", "The Derby Trial",
  "The Breeders' Challenge", "The Lightning Stakes",
  "The Crown Jewel", "The Midnight Run", "The Iron Horse",
  "The Victory Lap", "The Thunder Cup", "The Diamond Stakes",
  "The Eclipse Run", "The Phoenix Stakes",
];

const CONDITIONS = ["Fast", "Good", "Yielding", "Firm"];

// Phase durations in seconds
const CYCLE_DURATION = 420; // 7 minutes total
const BETTING_DURATION = 300; // 5 minutes to bet
const POST_PARADE_DURATION = 20; // 20 second gate load
const RACING_DURATION = 30; // 30 seconds for race (longer for drama)
const RESULTS_DURATION = CYCLE_DURATION - BETTING_DURATION - POST_PARADE_DURATION - RACING_DURATION; // 70 sec

type Phase = "betting" | "post_parade" | "racing" | "results";

type BetType = "win" | "place" | "show" | "exacta" | "exacta_box" | "trifecta" | "trifecta_box" | "trifecta_key" | "superfecta" | "superfecta_box";

const BET_TYPE_CONFIG: Record<BetType, { label: string; picks: number; description: string; category: "straight" | "exotic" }> = {
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

// How many combinations for box bets
function boxCombinations(picks: number): number {
  if (picks === 2) return 2; // 2!
  if (picks === 3) return 6; // 3!
  if (picks === 4) return 24; // 4!
  return 1;
}

interface Bet {
  id: string;
  type: BetType;
  horseNames: string[];
  amount: number;       // per combination
  totalCost: number;    // amount * combinations
  combinations: number;
}

const SCHOOLS = [
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

interface UserProfile {
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

interface RaceCard {
  name: string;
  track: typeof TRACK_CONFIGS[number];
  distance: number;
  surface: Surface;
  condition: string;
  purse: number;
  raceNumber: number;
  epoch: number;
  horses: SimHorse[];
  odds: Record<string, { win: number; place: number; show: number }>;
}

interface BetResult {
  bet: Bet;
  payout: number;
  won: boolean;
}

/* ================================================================== */
/*  Seeded PRNG (Mulberry32)                                           */
/* ================================================================== */

function createSeededRandom(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function seededPick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/* ================================================================== */
/*  Race Epoch                                                         */
/* ================================================================== */

function getCurrentEpoch(): number {
  return Math.floor(Date.now() / (CYCLE_DURATION * 1000));
}

function getTimeInCycle(): number {
  return (Date.now() / 1000) % CYCLE_DURATION;
}

function getPhaseFromCycleTime(t: number): Phase {
  if (t < BETTING_DURATION) return "betting";
  if (t < BETTING_DURATION + POST_PARADE_DURATION) return "post_parade";
  if (t < BETTING_DURATION + POST_PARADE_DURATION + RACING_DURATION) return "racing";
  return "results";
}

function getPhaseTimer(t: number): number {
  if (t < BETTING_DURATION) return Math.ceil(BETTING_DURATION - t);
  if (t < BETTING_DURATION + POST_PARADE_DURATION) return Math.ceil(BETTING_DURATION + POST_PARADE_DURATION - t);
  if (t < BETTING_DURATION + POST_PARADE_DURATION + RACING_DURATION)
    return Math.ceil(BETTING_DURATION + POST_PARADE_DURATION + RACING_DURATION - t);
  return Math.ceil(CYCLE_DURATION - t);
}

function getRaceProgress(t: number): number {
  const raceStart = BETTING_DURATION + POST_PARADE_DURATION;
  const raceEnd = raceStart + RACING_DURATION;
  if (t < raceStart) return 0;
  if (t >= raceEnd) return 1;
  return (t - raceStart) / RACING_DURATION;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function profileToSim(profile: HorseProfile, postPosition: number): SimHorse {
  const finishes = profile.recentForm.map((r) => r.finish);
  const mean = finishes.reduce((a, b) => a + b, 0) / finishes.length;
  const variance = finishes.reduce((a, f) => a + (f - mean) ** 2, 0) / finishes.length;
  const stdev = Math.sqrt(variance);
  const consistency = stdev < 1.5 ? 0.3 : stdev < 2.5 ? 0.5 : 0.8;

  return {
    name: profile.name,
    color: RACE_COLORS[postPosition % RACE_COLORS.length],
    imageUrl: profile.imageUrl,
    speedCurve: profile.speedCurve,
    topSpeed: profile.topSpeed,
    avgSpeed: profile.avgSpeed,
    strideEfficiency: profile.strideEfficiency,
    runningStyle: profile.runningStyle,
    consistency,
    postPosition,
    isCustom: false,
  };
}

function generateSeededRace(epoch: number): RaceCard {
  const rand = createSeededRandom(epoch * 7919 + 31337);

  const numHorses = 6 + Math.floor(rand() * 5); // 6-10
  const shuffled = seededShuffle(ALL_PROFILES, rand);
  const selected = shuffled.slice(0, Math.min(numHorses, shuffled.length));
  const horses = selected.map((p, i) => profileToSim(p, i + 1));

  const distances = [5, 6, 7, 8, 9, 10];
  const distance = distances[Math.floor(rand() * distances.length)];
  const surface: Surface = rand() > 0.3 ? "Dirt" : "Turf";
  const condition = seededPick(CONDITIONS, rand);
  const purses = [50000, 75000, 100000, 150000, 250000, 500000];
  const purse = purses[Math.floor(rand() * purses.length)];
  const track = seededPick(TRACK_CONFIGS, rand);
  const name = seededPick(RACE_NAMES, rand);

  // Run Monte Carlo for odds (uses Math.random but that's fine for odds)
  const simResults = runMonteCarlo({
    horses,
    distanceFurlongs: distance,
    surface,
    trackBias: track.bias,
    numSimulations: 500,
  });

  const odds: Record<string, { win: number; place: number; show: number }> = {};
  for (const h of simResults.horses) {
    const winOdds = h.winPct > 0 ? Math.min(99, Math.max(1.2, (100 / h.winPct) * 0.85)) : 99;
    const placeOdds = h.placePct > 0 ? Math.min(50, Math.max(1.1, (100 / h.placePct) * 0.85)) : 50;
    const showOdds = h.showPct > 0 ? Math.min(30, Math.max(1.05, (100 / h.showPct) * 0.85)) : 30;
    odds[h.name] = {
      win: Math.round(winOdds * 10) / 10,
      place: Math.round(placeOdds * 10) / 10,
      show: Math.round(showOdds * 10) / 10,
    };
  }

  // Race number: cycle through
  const raceNumber = (epoch % 99) + 1;

  return { name, track, distance, surface, condition, purse, raceNumber, epoch, horses, odds };
}

/** Generate a deterministic race result from epoch seed */
function generateSeededResult(race: RaceCard) {
  // Use a separate seed derived from epoch for the actual result
  const resultSeed = race.epoch * 13397 + 77773;
  const savedRandom = Math.random;

  // Temporarily override Math.random with seeded version for simulation
  const seededRand = createSeededRandom(resultSeed);
  (Math as { random: () => number }).random = seededRand;

  const results = runMonteCarlo({
    horses: race.horses,
    distanceFurlongs: race.distance,
    surface: race.surface,
    trackBias: race.track.bias,
    numSimulations: 1,
  });

  // Restore real Math.random
  (Math as { random: () => number }).random = savedRandom;

  const order = results.allRaces[0]?.finishOrder ?? [];
  const replay = results.allRaces[0]
    ? simToReplayData(results.allRaces[0], race.horses, race.distance)
    : null;

  return { results, order, replay };
}

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 10000) return `$${(amount / 1000).toFixed(1)}k`;
  if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

function formatOddsDisplay(odds: number): string {
  if (!isFinite(odds) || odds <= 0) return "99-1";
  if (odds >= 100) return "99-1";
  if (odds >= 10) return `${Math.round(odds)}-1`;
  if (odds >= 2) return `${odds.toFixed(1)}-1`;
  if (odds >= 1.1) return `${(odds - 1).toFixed(1)}-1`;
  return "1-5";
}

/** Get horse profile slug for linking */
function getHorseSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** Find profile by horse name to get imageUrl */
function getHorseImage(name: string): string | null {
  const profile = ALL_PROFILES.find((p) => p.name === name);
  return profile?.imageUrl ?? null;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ================================================================== */
/*  localStorage User Management                                       */
/* ================================================================== */

const STORAGE_KEY = "econgames_live_user";

function loadUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return null;
}

function saveUser(user: UserProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

function createUser(name: string, school: string): UserProfile {
  return {
    id: crypto.randomUUID(),
    name,
    school,
    bankroll: 1000,
    startingBankroll: 1000,
    totalProfit: 0,
    racesPlayed: 0,
    biggestWin: 0,
    history: [],
  };
}

/* ================================================================== */
/*  Payout Calculation                                                 */
/* ================================================================== */

function calculateBetPayout(bet: Bet, finishOrder: string[], odds: RaceCard["odds"]): { won: boolean; payout: number } {
  const first = finishOrder[0];
  const second = finishOrder[1];
  const third = finishOrder[2];
  const fourth = finishOrder[3];

  switch (bet.type) {
    case "win":
      if (bet.horseNames[0] === first) {
        return { won: true, payout: Math.round(bet.amount * (odds[first]?.win ?? 2)) };
      }
      return { won: false, payout: 0 };

    case "place":
      if (finishOrder.slice(0, 2).includes(bet.horseNames[0])) {
        return { won: true, payout: Math.round(bet.amount * (odds[bet.horseNames[0]]?.place ?? 1.5)) };
      }
      return { won: false, payout: 0 };

    case "show":
      if (finishOrder.slice(0, 3).includes(bet.horseNames[0])) {
        return { won: true, payout: Math.round(bet.amount * (odds[bet.horseNames[0]]?.show ?? 1.2)) };
      }
      return { won: false, payout: 0 };

    case "exacta":
      if (bet.horseNames[0] === first && bet.horseNames[1] === second) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        return { won: true, payout: Math.round(bet.amount * o1 * o2 * 0.6) };
      }
      return { won: false, payout: 0 };

    case "exacta_box": {
      const top2 = [first, second];
      if (bet.horseNames.every((n) => top2.includes(n))) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        // Box pays less since more combinations
        return { won: true, payout: Math.round(bet.amount * o1 * o2 * 0.6) };
      }
      return { won: false, payout: 0 };
    }

    case "trifecta":
      if (bet.horseNames[0] === first && bet.horseNames[1] === second && bet.horseNames[2] === third) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        return { won: true, payout: Math.round(bet.amount * o1 * o2 * o3 * 0.4) };
      }
      return { won: false, payout: 0 };

    case "trifecta_box": {
      const top3 = [first, second, third];
      if (bet.horseNames.every((n) => top3.includes(n))) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        return { won: true, payout: Math.round(bet.amount * o1 * o2 * o3 * 0.4) };
      }
      return { won: false, payout: 0 };
    }

    case "trifecta_key": {
      // First horse is the key (must win), others fill 2nd/3rd in any order
      if (bet.horseNames[0] === first) {
        const others = bet.horseNames.slice(1);
        if (others.every((n) => [second, third].includes(n))) {
          const o1 = odds[first]?.win ?? 2;
          const o2 = odds[second]?.win ?? 2;
          const o3 = odds[third]?.win ?? 2;
          return { won: true, payout: Math.round(bet.amount * o1 * o2 * o3 * 0.45) };
        }
      }
      return { won: false, payout: 0 };
    }

    case "superfecta":
      if (bet.horseNames[0] === first && bet.horseNames[1] === second &&
          bet.horseNames[2] === third && bet.horseNames[3] === fourth) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        const o4 = odds[fourth]?.win ?? 2;
        return { won: true, payout: Math.round(bet.amount * o1 * o2 * o3 * o4 * 0.3) };
      }
      return { won: false, payout: 0 };

    case "superfecta_box": {
      const top4 = [first, second, third, fourth];
      if (bet.horseNames.every((n) => top4.includes(n))) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        const o4 = odds[fourth]?.win ?? 2;
        return { won: true, payout: Math.round(bet.amount * o1 * o2 * o3 * o4 * 0.3) };
      }
      return { won: false, payout: 0 };
    }

    default:
      return { won: false, payout: 0 };
  }
}

/* ================================================================== */
/*  Animated Balance Counter                                           */
/* ================================================================== */

function AnimatedBalance({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    prevRef.current = to;

    const diff = to - from;
    const duration = 1500;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  const isUp = value > prevRef.current;
  const isDown = value < prevRef.current;

  return (
    <span className="font-mono font-bold tabular-nums">
      {prefix}{display.toLocaleString()}
    </span>
  );
}

/* ================================================================== */
/*  Timer Ring                                                         */
/* ================================================================== */

function TimerRing({ seconds, total, phase, label }: { seconds: number; total: number; phase: Phase; label: string }) {
  const pct = total > 0 ? seconds / total : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const color = phase === "betting" ? GOLD : phase === "post_parade" ? ORANGE : phase === "racing" ? GREEN : BLUE;
  const isUrgent = phase === "betting" && seconds <= 30;

  return (
    <div className="relative w-[88px] h-[88px] flex items-center justify-center">
      <svg width="88" height="88" className="absolute -rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke={`${BORDER}`} strokeWidth="3.5" />
        <motion.circle
          cx="44" cy="44" r={radius} fill="none"
          stroke={isUrgent ? RED : color} strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          animate={isUrgent ? { opacity: [1, 0.5, 1] } : {}}
          transition={isUrgent ? { repeat: Infinity, duration: 0.8 } : {}}
        />
      </svg>
      <div className="text-center z-10">
        <div
          className="text-lg font-mono font-bold"
          style={{ color: isUrgent ? RED : TEXT }}
        >
          {formatTimer(seconds)}
        </div>
        <div
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: isUrgent ? RED : color }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Name Entry Modal                                                   */
/* ================================================================== */

function NameEntryModal({ onSubmit }: { onSubmit: (name: string, school: string) => void }) {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = name.trim().length >= 2 && name.trim().length <= 20 && school !== "";

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(name.trim(), school);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,26,42,0.85)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="w-full max-w-md p-8 rounded-3xl space-y-6"
        style={{ background: BG_WHITE, border: `2px solid ${BORDER}` }}
      >
        <div className="text-center space-y-2">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: `${GOLD}15` }}
          >
            <Zap className="w-8 h-8" style={{ color: GOLD }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: TEXT }}>
            Welcome to Race Night
          </h2>
          <p className="text-sm" style={{ color: TEXT_SEC }}>
            $1,000 bankroll. New race every 7 minutes. Compete against other schools.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>Display Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Your name..."
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: BG_CARD,
                border: `2px solid ${name.trim().length >= 2 ? GOLD : BORDER}`,
                color: TEXT,
              }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: TEXT_SEC }}>School</label>
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all appearance-none cursor-pointer"
              style={{
                background: BG_CARD,
                border: `2px solid ${school ? GOLD : BORDER}`,
                color: school ? TEXT : TEXT_MUTED,
              }}
            >
              <option value="">Select your school...</option>
              {SCHOOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-all"
            style={{
              background: isValid ? GOLD : BORDER,
              opacity: isValid ? 1 : 0.5,
            }}
          >
            Enter the Track
          </button>
        </div>

        <p className="text-[11px] text-center" style={{ color: TEXT_MUTED }}>
          Your progress is saved locally. No account needed.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Bet Slip Builder                                                   */
/* ================================================================== */

function BetSlipBuilder({
  race,
  bets,
  bankroll,
  onPlaceBet,
  onRemoveBet,
}: {
  race: RaceCard;
  bets: Bet[];
  bankroll: number;
  onPlaceBet: (bet: Omit<Bet, "id">) => void;
  onRemoveBet: (betId: string) => void;
}) {
  const [betType, setBetType] = useState<BetType>("win");
  const [selectedHorses, setSelectedHorses] = useState<string[]>([]);
  const [amount, setAmount] = useState(10);
  const [showExotics, setShowExotics] = useState(false);

  const config = BET_TYPE_CONFIG[betType];
  const totalBet = bets.reduce((s, b) => s + b.totalCost, 0);
  const remaining = bankroll - totalBet;

  const isBox = betType.includes("box");
  const isKey = betType.includes("key");
  const combos = isBox ? boxCombinations(config.picks) : isKey ? 2 : 1; // key = 2 combos (2nd/3rd swap)
  const totalCost = amount * combos;

  const canPlace =
    amount > 0 &&
    totalCost <= remaining &&
    selectedHorses.length === config.picks;

  const handleHorseSelect = (name: string) => {
    setSelectedHorses((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= config.picks) {
        // Replace the last one
        return [...prev.slice(0, -1), name];
      }
      return [...prev, name];
    });
  };

  const handlePlaceBet = () => {
    if (!canPlace) return;
    onPlaceBet({
      type: betType,
      horseNames: [...selectedHorses],
      amount,
      totalCost,
      combinations: combos,
    });
    setSelectedHorses([]);
  };

  // Potential payout estimation
  const potentialPayout = useMemo(() => {
    if (!canPlace) return 0;
    if (betType === "win") return amount * (race.odds[selectedHorses[0]]?.win ?? 2);
    if (betType === "place") return amount * (race.odds[selectedHorses[0]]?.place ?? 1.5);
    if (betType === "show") return amount * (race.odds[selectedHorses[0]]?.show ?? 1.2);

    // Exotic estimate
    const horseOdds = selectedHorses.map((n) => race.odds[n]?.win ?? 2);
    const product = horseOdds.reduce((a, b) => a * b, 1);
    const multiplier = betType.includes("superfecta") ? 0.3 : betType.includes("trifecta") ? 0.4 : 0.6;
    return Math.round(amount * product * multiplier);
  }, [canPlace, betType, selectedHorses, amount, race.odds]);

  const straightTypes: BetType[] = ["win", "place", "show"];
  const exoticTypes: BetType[] = ["exacta", "exacta_box", "trifecta", "trifecta_box", "trifecta_key", "superfecta", "superfecta_box"];

  return (
    <div className="space-y-3">
      {/* Straight bet types */}
      <div className="flex gap-1">
        {straightTypes.map((t) => (
          <button
            key={t}
            onClick={() => { setBetType(t); setSelectedHorses([]); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all"
            style={{
              background: betType === t ? GOLD : BG_CARD,
              color: betType === t ? "#fff" : TEXT_SEC,
              border: `1px solid ${betType === t ? GOLD : BORDER}`,
            }}
          >
            {BET_TYPE_CONFIG[t].label}
          </button>
        ))}
        <button
          onClick={() => setShowExotics(!showExotics)}
          className="px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
          style={{
            background: exoticTypes.includes(betType) ? `${PURPLE}15` : BG_CARD,
            color: exoticTypes.includes(betType) ? PURPLE : TEXT_SEC,
            border: `1px solid ${exoticTypes.includes(betType) ? PURPLE : BORDER}`,
          }}
        >
          Exotic
          <ChevronDown className={`w-3 h-3 transition-transform ${showExotics ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Exotic bet types */}
      <AnimatePresence>
        {showExotics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1">
              {exoticTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => { setBetType(t); setSelectedHorses([]); setShowExotics(false); }}
                  className="py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-left"
                  style={{
                    background: betType === t ? PURPLE : BG_CARD,
                    color: betType === t ? "#fff" : TEXT_SEC,
                    border: `1px solid ${betType === t ? PURPLE : BORDER}`,
                  }}
                >
                  <div>{BET_TYPE_CONFIG[t].label}</div>
                  <div className="text-[9px] opacity-70 font-normal mt-0.5">
                    {BET_TYPE_CONFIG[t].picks} picks
                    {t.includes("box") ? ` × ${boxCombinations(BET_TYPE_CONFIG[t].picks)} combos` : ""}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bet type description */}
      <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: `${GOLD}06`, border: `1px solid ${GOLD}20`, color: TEXT_SEC }}>
        <span className="font-semibold" style={{ color: GOLD }}>{config.label}:</span> {config.description}
        {combos > 1 && (
          <span className="ml-1 font-mono" style={{ color: PURPLE }}>({combos} combos = ${amount} {"×"} {combos} = ${totalCost})</span>
        )}
      </div>

      {/* Horse Selection */}
      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
        {race.horses.map((horse, i) => {
          const isSelected = selectedHorses.includes(horse.name);
          const orderIdx = selectedHorses.indexOf(horse.name);
          const odds = race.odds[horse.name];
          const imgUrl = getHorseImage(horse.name);

          return (
            <button
              key={horse.name}
              onClick={() => handleHorseSelect(horse.name)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left group"
              style={{
                background: isSelected ? `${GOLD}08` : BG_WHITE,
                border: `1.5px solid ${isSelected ? GOLD : BORDER}`,
              }}
            >
              {/* Horse image or post position */}
              <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${isSelected ? GOLD : horse.color}` }}>
                {imgUrl ? (
                  <Image src={imgUrl} alt={horse.name} width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: horse.color }}>
                    {i + 1}
                  </div>
                )}
                {config.picks > 1 && isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[10px] font-bold">
                    {isKey && orderIdx === 0 ? "K" : orderIdx + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: TEXT }}>
                  #{i + 1} {horse.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: TEXT_MUTED }}>
                  <span className="px-1.5 py-0.5 rounded" style={{ background: `${horse.color}12`, color: horse.color, fontWeight: 600 }}>
                    {horse.runningStyle}
                  </span>
                  <span>{horse.topSpeed.toFixed(1)} ft/s</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold font-mono" style={{ color: GOLD }}>
                  {formatOddsDisplay(odds?.win ?? 2)}
                </div>
              </div>
              {isSelected && (
                <Check className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Wager Amount */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: TEXT_SEC }}>Wager</span>
          <div className="flex-1 flex items-center gap-1">
            <button
              onClick={() => setAmount(Math.max(2, amount - 5))}
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
            >
              <Minus className="w-3 h-3" style={{ color: TEXT_SEC }} />
            </button>
            <div
              className="flex-1 text-center py-1.5 rounded-md font-mono font-bold text-sm"
              style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: TEXT }}
            >
              ${amount} {combos > 1 && <span className="text-[10px] font-normal" style={{ color: TEXT_MUTED }}>{"×"}{combos}</span>}
            </div>
            <button
              onClick={() => setAmount(Math.min(Math.floor(remaining / combos), amount + 5))}
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
            >
              <Plus className="w-3 h-3" style={{ color: TEXT_SEC }} />
            </button>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-1">
          {[2, 5, 10, 25, 50, 100].map((a) => (
            <button
              key={a}
              onClick={() => setAmount(Math.min(a, Math.floor(remaining / combos)))}
              className="flex-1 py-1 rounded text-[11px] font-mono font-semibold transition-all"
              style={{
                background: amount === a ? `${GOLD}15` : BG_CARD,
                color: amount === a ? GOLD : TEXT_SEC,
                border: `1px solid ${amount === a ? GOLD : BORDER}`,
              }}
            >
              ${a}
            </button>
          ))}
        </div>

        {canPlace && (
          <div className="text-xs text-center" style={{ color: GREEN }}>
            Est. payout: <span className="font-bold font-mono">${potentialPayout.toLocaleString()}</span>
          </div>
        )}

        <button
          onClick={handlePlaceBet}
          disabled={!canPlace}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all"
          style={{
            background: canPlace ? GOLD : BORDER,
            color: canPlace ? "#fff" : TEXT_MUTED,
            opacity: canPlace ? 1 : 0.6,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Ticket className="w-4 h-4" />
            Place {config.label} {totalCost > amount ? `\u2014 $${totalCost}` : `\u2014 $${amount}`}
          </div>
        </button>

        <div className="text-[11px] text-center" style={{ color: TEXT_MUTED }}>
          Available: <span className="font-mono font-semibold" style={{ color: remaining < 50 ? RED : TEXT }}>${remaining.toLocaleString()}</span>
          {bets.length > 0 && ` · ${bets.length} bet${bets.length > 1 ? "s" : ""} on slip`}
        </div>
      </div>

      {/* Active Bets on Slip */}
      {bets.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXT_SEC }}>
            Your Slip
          </div>
          {bets.map((bet) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
            >
              <span
                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: bet.type.includes("exacta") || bet.type.includes("tri") || bet.type.includes("super")
                    ? `${PURPLE}15` : `${GOLD}15`,
                  color: bet.type.includes("exacta") || bet.type.includes("tri") || bet.type.includes("super")
                    ? PURPLE : GOLD,
                }}
              >
                {BET_TYPE_CONFIG[bet.type].label}
              </span>
              <span className="flex-1 text-[11px] font-medium truncate" style={{ color: TEXT }}>
                {bet.horseNames.join(" → ")}
              </span>
              <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: TEXT }}>
                ${bet.totalCost}
              </span>
              <button onClick={() => onRemoveBet(bet.id)} className="p-0.5 rounded hover:bg-red-50">
                <X className="w-3 h-3" style={{ color: RED }} />
              </button>
            </motion.div>
          ))}
          <div className="text-[10px] font-mono text-right" style={{ color: TEXT_SEC }}>
            Total wagered: ${bets.reduce((s, b) => s + b.totalCost, 0)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Post Parade Overlay                                                */
/* ================================================================== */

function PostParadeOverlay({ race, timer }: { race: RaceCard; timer: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: BG_DARK }}
    >
      <div className="px-6 py-8 text-center space-y-4">
        {/* Gate loading animation */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="space-y-3"
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            Post Parade
          </div>
          <h2 className="text-2xl font-bold text-white">
            {race.name}
          </h2>
          <div className="text-sm text-white/60">
            {race.track.name} {"·"} {race.distance}F {race.surface} {"·"} {race.condition}
          </div>
        </motion.div>

        {/* Horses loading into gates */}
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mt-6">
          {race.horses.map((horse, i) => (
            <motion.div
              key={horse.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: horse.color }}
              >
                {i + 1}
              </div>
              <span className="text-xs font-medium text-white truncate">
                {horse.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Countdown */}
        <motion.div
          className="mt-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="text-4xl font-mono font-bold" style={{ color: GOLD }}>
            {timer}
          </div>
          <div className="text-xs text-white/40 uppercase tracking-wider mt-1">
            seconds to post
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Win Celebration Overlay                                            */
/* ================================================================== */

function WinCelebration({ winnerName, totalWinnings }: { winnerName: string; totalWinnings: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
      style={{ background: "rgba(26,26,42,0.9)", backdropFilter: "blur(4px)" }}
    >
      <div className="text-center space-y-3">
        {/* Confetti particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              rotate: 0,
            }}
            animate={{
              x: (Math.random() - 0.5) * 300,
              y: (Math.random() - 0.5) * 200 - 100,
              scale: [0, 1, 0],
              rotate: Math.random() * 720,
            }}
            transition={{
              duration: 2,
              delay: Math.random() * 0.3,
              ease: "easeOut",
            }}
            className="absolute w-2 h-2 rounded-sm"
            style={{
              background: [GOLD, GREEN, "#e74c3c", "#3498db", "#9b59b6", "#f39c12"][i % 6],
              left: "50%",
              top: "50%",
            }}
          />
        ))}

        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Trophy className="w-16 h-16 mx-auto" style={{ color: GOLD }} />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white"
        >
          Winner!
        </motion.h2>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg font-bold"
          style={{ color: GOLD }}
        >
          {winnerName}
        </motion.div>

        {totalWinnings > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl mt-2"
            style={{ background: `${GREEN}20`, border: `2px solid ${GREEN}` }}
          >
            <DollarSign className="w-5 h-5" style={{ color: GREEN }} />
            <span className="text-2xl font-mono font-bold" style={{ color: GREEN }}>
              +${totalWinnings.toLocaleString()}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  Results Panel                                                      */
/* ================================================================== */

function ResultsPanel({
  race,
  finishOrder,
  betResults,
  totalWinnings,
  totalWagered,
}: {
  race: RaceCard;
  finishOrder: string[];
  betResults: BetResult[];
  totalWinnings: number;
  totalWagered: number;
}) {
  const netProfit = totalWinnings - totalWagered;

  return (
    <div className="space-y-5">
      {/* Finish Order */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: TEXT_SEC }}>
          Official Results
        </h3>
        <div className="space-y-1">
          {finishOrder.slice(0, 5).map((name, i) => {
            const horse = race.horses.find((h) => h.name === name);
            const badgeColors = [GOLD, "#94a3b8", "#b45309", TEXT_MUTED, TEXT_MUTED];
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{
                  background: i === 0 ? `${GOLD}10` : BG_WHITE,
                  border: `1.5px solid ${i === 0 ? GOLD : BORDER}`,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: badgeColors[i] }}
                >
                  {i + 1}
                </div>
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: horse?.color ?? TEXT_MUTED }}
                />
                <span className="text-sm font-bold flex-1 truncate" style={{ color: TEXT }}>
                  {name}
                </span>
                <span className="text-xs font-mono" style={{ color: TEXT_MUTED }}>
                  {formatOddsDisplay(race.odds[name]?.win ?? 2)}
                </span>
                {i === 0 && <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Photo finish indicator for close races */}
      {finishOrder.length >= 2 && (
        (() => {
          const o1 = race.odds[finishOrder[0]]?.win ?? 2;
          const o2 = race.odds[finishOrder[1]]?.win ?? 2;
          const isClose = Math.abs(o1 - o2) < 3;
          if (!isClose) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: `${ORANGE}08`, border: `1px solid ${ORANGE}30` }}
            >
              <Eye className="w-3.5 h-3.5" style={{ color: ORANGE }} />
              <span className="text-[11px] font-semibold" style={{ color: ORANGE }}>
                Photo Finish! {finishOrder[0]} edges {finishOrder[1]}
              </span>
            </motion.div>
          );
        })()
      )}

      {/* Bet Results */}
      {betResults.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: TEXT_SEC }}>
            Your Bets
          </h3>
          <div className="space-y-1.5">
            {betResults.map((br, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                style={{
                  background: br.won ? `${GREEN}08` : `${RED}05`,
                  border: `1.5px solid ${br.won ? GREEN : `${RED}30`}`,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
                >
                  {br.won ? (
                    <Check className="w-4 h-4" style={{ color: GREEN }} />
                  ) : (
                    <X className="w-4 h-4" style={{ color: RED }} />
                  )}
                </motion.div>
                <span
                  className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    background: br.won ? `${GREEN}15` : `${RED}10`,
                    color: br.won ? GREEN : RED,
                  }}
                >
                  {BET_TYPE_CONFIG[br.bet.type].label}
                </span>
                <span className="flex-1 text-[11px] font-medium truncate" style={{ color: TEXT }}>
                  {br.bet.horseNames.join(" → ")}
                </span>
                <span className="font-mono font-bold text-sm shrink-0" style={{ color: br.won ? GREEN : RED }}>
                  {br.won ? `+$${(br.payout - br.bet.totalCost).toLocaleString()}` : `-$${br.bet.totalCost}`}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Net summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-3 flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{
              background: netProfit >= 0 ? `${GREEN}08` : `${RED}06`,
              border: `1.5px solid ${netProfit >= 0 ? GREEN : RED}`,
            }}
          >
            <span className="text-xs font-semibold" style={{ color: TEXT }}>
              Race P&L
            </span>
            <span className="font-mono font-bold text-lg" style={{ color: netProfit >= 0 ? GREEN : RED }}>
              {netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()}
            </span>
          </motion.div>
        </div>
      )}

      {betResults.length === 0 && (
        <div className="text-center py-4 rounded-lg" style={{ background: BG_CARD }}>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>No bets placed this race</p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Leaderboard (local, Supabase-ready)                                */
/* ================================================================== */

function UserStats({ user }: { user: UserProfile }) {
  const profit = user.bankroll - user.startingBankroll;
  const roi = user.startingBankroll > 0 ? (profit / user.startingBankroll) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white"
          style={{ background: GOLD }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: TEXT }}>{user.name}</div>
          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {user.school && <>{user.school} · </>}{user.racesPlayed} race{user.racesPlayed !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg text-center" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <div className="text-[10px] font-semibold uppercase" style={{ color: TEXT_MUTED }}>Bankroll</div>
          <div className="text-sm font-bold font-mono mt-0.5" style={{ color: TEXT }}>
            <AnimatedBalance value={user.bankroll} />
          </div>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <div className="text-[10px] font-semibold uppercase" style={{ color: TEXT_MUTED }}>Profit</div>
          <div className="text-sm font-bold font-mono mt-0.5" style={{ color: profit >= 0 ? GREEN : RED }}>
            {profit >= 0 ? "+" : ""}{profit}
          </div>
        </div>
        <div className="p-2.5 rounded-lg text-center" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
          <div className="text-[10px] font-semibold uppercase" style={{ color: TEXT_MUTED }}>Best Win</div>
          <div className="text-sm font-bold font-mono mt-0.5" style={{ color: GOLD }}>
            ${user.biggestWin}
          </div>
        </div>
      </div>

      {/* Race history sparkline */}
      {user.history.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT_MUTED }}>
            Recent Races
          </div>
          <div className="flex gap-0.5">
            {user.history.slice(-20).map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${Math.max(4, Math.min(24, Math.abs(h.profit) / 5 + 4))}px`,
                  background: h.profit >= 0 ? GREEN : RED,
                  opacity: 0.3 + (i / 20) * 0.7,
                }}
                title={`Race: ${h.profit >= 0 ? "+" : ""}${h.profit}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Shared Leaderboard Component                                       */
/* ================================================================== */

function SharedLeaderboard({
  entries,
  schoolStandings,
  currentUserId,
  connected,
  loading,
}: {
  entries: LeaderboardEntry[];
  schoolStandings: SchoolStanding[];
  currentUserId?: string;
  connected: boolean;
  loading: boolean;
}) {
  const [tab, setTab] = useState<"players" | "schools">("players");

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-pulse text-xs" style={{ color: TEXT_MUTED }}>Loading leaderboard...</div>
      </div>
    );
  }

  if (entries.length === 0 && !connected) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs" style={{ color: TEXT_MUTED }}>Leaderboard offline</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_SEC }}>
          Leaderboard
        </span>
        {connected && (
          <span className="ml-auto flex items-center gap-1 text-[9px]" style={{ color: GREEN }}>
            <CircleDot className="w-2 h-2" /> Live
          </span>
        )}
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: BG_CARD }}>
        {(["players", "schools"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all"
            style={{
              background: tab === t ? BG_WHITE : "transparent",
              color: tab === t ? TEXT : TEXT_MUTED,
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Players tab */}
      {tab === "players" && (
        <div className="space-y-1">
          {entries.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: TEXT_MUTED }}>No players yet. Be the first!</p>
          ) : entries.slice(0, 10).map((entry, i) => {
            const isYou = entry.id === currentUserId;
            const profit = entry.total_profit;
            const Icon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Trophy : Hash;

            return (
              <motion.div
                key={entry.id}
                layout
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all"
                style={{
                  background: isYou ? `${GOLD}06` : BG_WHITE,
                  border: `1px solid ${isYou ? GOLD : BORDER}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i === 0 ? `${GOLD}20` : i < 3 ? `${TEXT_MUTED}10` : "transparent",
                    color: i === 0 ? GOLD : TEXT_MUTED,
                  }}
                >
                  {i < 3 ? <Icon className="w-2.5 h-2.5" /> : <span className="text-[9px] font-mono">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate" style={{ color: TEXT }}>
                    {entry.name} {isYou && <span className="text-[9px] font-normal" style={{ color: GOLD }}>(you)</span>}
                  </div>
                  <div className="text-[9px] truncate" style={{ color: TEXT_MUTED }}>
                    {entry.school || "No school"} · {entry.races_played}R
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold font-mono" style={{ color: TEXT }}>
                    ${Math.round(entry.bankroll).toLocaleString()}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: profit >= 0 ? GREEN : RED }}>
                    {profit >= 0 ? "+" : ""}{Math.round(profit)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Schools tab */}
      {tab === "schools" && (
        <div className="space-y-1">
          {schoolStandings.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: TEXT_MUTED }}>No school data yet</p>
          ) : schoolStandings.slice(0, 10).map((school, i) => (
            <motion.div
              key={school.school}
              layout
              className="px-2.5 py-2.5 rounded-lg"
              style={{ background: BG_WHITE, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                    style={{
                      background: i === 0 ? `${GOLD}20` : i < 3 ? `${TEXT_MUTED}10` : BG_CARD,
                      color: i === 0 ? GOLD : TEXT_MUTED,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate" style={{ color: TEXT }}>
                      {school.school}
                    </div>
                    <div className="text-[9px]" style={{ color: TEXT_MUTED }}>
                      {school.players} player{school.players !== 1 ? "s" : ""} · Top: {school.topPlayer}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-[11px] font-bold font-mono" style={{ color: school.totalProfit >= 0 ? GREEN : RED }}>
                    {school.totalProfit >= 0 ? "+" : ""}${Math.abs(school.totalProfit).toLocaleString()}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: TEXT_MUTED }}>
                    avg ${school.avgBankroll.toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

export default function LiveRacingPage() {
  /* ---- User state ---- */
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* ---- Supabase leaderboard ---- */
  const { leaderboard, schoolStandings, loading: lbLoading, connected: lbConnected, syncPlayer, logBets } = useLeaderboard();

  /* ---- Race state ---- */
  const [epoch, setEpoch] = useState(0);
  const [phase, setPhase] = useState<Phase>("betting");
  const [timer, setTimer] = useState(0);
  const [race, setRace] = useState<RaceCard | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);

  /* ---- Results state ---- */
  const [finishOrder, setFinishOrder] = useState<string[]>([]);
  const [replayData, setReplayData] = useState<{ horses: any[]; colors: string[] } | null>(null);
  const [betResults, setBetResults] = useState<BetResult[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [totalWagered, setTotalWagered] = useState(0);
  const [resultsProcessed, setResultsProcessed] = useState(false);

  /* ---- Refs ---- */
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEpochRef = useRef(0);
  const resultsProcessedRef = useRef(false);

  /* ---- Initialize ---- */
  useEffect(() => {
    setMounted(true);
    const saved = loadUser();
    if (saved) {
      setUser(saved);
      // Sync existing user to Supabase on load
      syncPlayer({
        id: saved.id,
        name: saved.name,
        school: saved.school || "",
        bankroll: saved.bankroll,
        total_profit: saved.totalProfit,
        races_played: saved.racesPlayed,
        biggest_win: saved.biggestWin,
      });
    } else {
      setShowNameEntry(true);
    }
  }, [syncPlayer]);

  /* ---- Create user ---- */
  const handleCreateUser = useCallback((name: string, school: string) => {
    const newUser = createUser(name, school);
    setUser(newUser);
    saveUser(newUser);
    setShowNameEntry(false);
    syncPlayer({
      id: newUser.id,
      name: newUser.name,
      school: newUser.school,
      bankroll: newUser.bankroll,
      total_profit: newUser.totalProfit,
      races_played: newUser.racesPlayed,
      biggest_win: newUser.biggestWin,
    });
  }, [syncPlayer]);

  /* ---- Master clock — ticks every 200ms ---- */
  useEffect(() => {
    if (!mounted) return;

    const tick = () => {
      const currentEpoch = getCurrentEpoch();
      const cycleTime = getTimeInCycle();
      const currentPhase = getPhaseFromCycleTime(cycleTime);
      const currentTimer = getPhaseTimer(cycleTime);

      setEpoch(currentEpoch);
      setPhase(currentPhase);
      setTimer(currentTimer);

      // New race epoch — generate race
      if (currentEpoch !== lastEpochRef.current) {
        lastEpochRef.current = currentEpoch;
        const newRace = generateSeededRace(currentEpoch);
        setRace(newRace);
        setBets([]);
        setFinishOrder([]);
        setReplayData(null);
        setBetResults([]);
        setShowCelebration(false);
        setTotalWinnings(0);
        setTotalWagered(0);
        setResultsProcessed(false);
        resultsProcessedRef.current = false;
      }

      // Generate race if we don't have one yet
      if (!lastEpochRef.current) {
        lastEpochRef.current = currentEpoch;
        const newRace = generateSeededRace(currentEpoch);
        setRace(newRace);
      }
    };

    tick(); // Run immediately
    tickRef.current = setInterval(tick, 200);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [mounted]);

  /* ---- Generate race results when entering racing phase ---- */
  useEffect(() => {
    if (!race) return;

    if ((phase === "racing" || phase === "results") && finishOrder.length === 0) {
      const { order, replay } = generateSeededResult(race);
      setFinishOrder(order);
      if (replay) setReplayData(replay);
    }
  }, [phase, race, finishOrder.length]);

  /* ---- Process payouts when entering results phase ---- */
  useEffect(() => {
    if (phase !== "results" || !race || finishOrder.length === 0 || resultsProcessedRef.current) return;
    resultsProcessedRef.current = true;
    setResultsProcessed(true);

    const results: BetResult[] = bets.map((bet) => {
      const { won, payout } = calculateBetPayout(bet, finishOrder, race.odds);
      return { bet, payout, won };
    });

    setBetResults(results);

    const wagered = bets.reduce((s, b) => s + b.totalCost, 0);
    const winnings = results.reduce((s, r) => s + (r.won ? r.payout : 0), 0);
    setTotalWagered(wagered);
    setTotalWinnings(winnings);

    // Update user
    if (user && bets.length > 0) {
      const netProfit = winnings - wagered;
      const newBankroll = Math.max(0, user.bankroll + netProfit);
      const newBiggestWin = Math.max(user.biggestWin, ...results.filter(r => r.won).map(r => r.payout - r.bet.totalCost));

      const updatedUser: UserProfile = {
        ...user,
        bankroll: newBankroll,
        totalProfit: user.totalProfit + netProfit,
        racesPlayed: user.racesPlayed + 1,
        biggestWin: newBiggestWin,
        history: [...user.history, { raceEpoch: epoch, profit: netProfit, bankroll: newBankroll }],
      };
      setUser(updatedUser);
      saveUser(updatedUser);

      // Sync to Supabase
      syncPlayer({
        id: updatedUser.id,
        name: updatedUser.name,
        school: updatedUser.school,
        bankroll: updatedUser.bankroll,
        total_profit: updatedUser.totalProfit,
        races_played: updatedUser.racesPlayed,
        biggest_win: updatedUser.biggestWin,
      });

      // Log bets to Supabase
      logBets(
        results.map((r) => ({
          player_id: updatedUser.id,
          race_epoch: epoch,
          bet_type: r.bet.type,
          selections: r.bet.horseNames,
          amount: r.bet.amount,
          total_cost: r.bet.totalCost,
          combinations: r.bet.combinations,
          payout: r.payout,
          won: r.won,
        }))
      );

      // Show celebration if any bet won
      if (winnings > 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }
    } else if (user && bets.length === 0) {
      // Still count as race played
      const updatedUser: UserProfile = {
        ...user,
        racesPlayed: user.racesPlayed + 1,
        history: [...user.history, { raceEpoch: epoch, profit: 0, bankroll: user.bankroll }],
      };
      setUser(updatedUser);
      saveUser(updatedUser);

      // Sync to Supabase
      syncPlayer({
        id: updatedUser.id,
        name: updatedUser.name,
        school: updatedUser.school,
        bankroll: updatedUser.bankroll,
        total_profit: updatedUser.totalProfit,
        races_played: updatedUser.racesPlayed,
        biggest_win: updatedUser.biggestWin,
      });
    }
  }, [phase, race, finishOrder, bets, user, epoch, syncPlayer, logBets]);

  /* ---- Bet management ---- */
  const placeBet = useCallback((bet: Omit<Bet, "id">) => {
    if (phase !== "betting" || !user) return;
    const totalBetSoFar = bets.reduce((s, b) => s + b.totalCost, 0);
    if (totalBetSoFar + bet.totalCost > user.bankroll) return;

    setBets((prev) => [
      ...prev,
      { ...bet, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
    ]);
  }, [phase, user, bets]);

  const removeBet = useCallback((betId: string) => {
    if (phase !== "betting") return;
    setBets((prev) => prev.filter((b) => b.id !== betId));
  }, [phase]);

  /* ---- Reset bankroll ---- */
  const resetBankroll = useCallback(() => {
    if (!user) return;
    const reset: UserProfile = {
      ...user,
      bankroll: 1000,
      startingBankroll: 1000,
      totalProfit: 0,
      racesPlayed: 0,
      biggestWin: 0,
      history: [],
    };
    setUser(reset);
    saveUser(reset);
    syncPlayer({
      id: reset.id,
      name: reset.name,
      school: reset.school,
      bankroll: reset.bankroll,
      total_profit: reset.totalProfit,
      races_played: reset.racesPlayed,
      biggest_win: reset.biggestWin,
    });
  }, [user, syncPlayer]);

  /* ---- Phase labels ---- */
  const phaseLabel = phase === "betting" ? "Place Your Bets"
    : phase === "post_parade" ? "Loading Gates"
    : phase === "racing" ? "They're Off!"
    : "Results";

  const phaseBadgeColor = phase === "betting" ? GOLD : phase === "post_parade" ? ORANGE : phase === "racing" ? GREEN : BLUE;

  const timerTotal = phase === "betting" ? BETTING_DURATION
    : phase === "post_parade" ? POST_PARADE_DURATION
    : phase === "racing" ? RACING_DURATION
    : RESULTS_DURATION;

  /* ---- Don't render until mounted (avoid hydration mismatch) ---- */
  if (!mounted) {
    return (
      <main className="min-h-screen pt-16" style={{ background: BG_WHITE }}>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="animate-pulse text-sm" style={{ color: TEXT_MUTED }}>Loading race night...</div>
        </div>
      </main>
    );
  }

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <main className="min-h-screen pt-16 pb-12" style={{ background: BG_WHITE }}>
      {/* Name entry modal */}
      <AnimatePresence>
        {showNameEntry && <NameEntryModal onSubmit={handleCreateUser} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ──────────── Top Bar ──────────── */}
        <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{ background: `${phaseBadgeColor}15`, color: phaseBadgeColor }}
                >
                  {phaseLabel}
                </span>
                {race && (
                  <span
                    className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                    style={{ background: `${TEXT_MUTED}10`, color: TEXT_MUTED }}
                  >
                    Race #{race.raceNumber}
                  </span>
                )}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: `${GREEN}10`, color: GREEN }}
                >
                  <CircleDot className="w-2.5 h-2.5" /> Live
                </span>
              </div>
              {race && (
                <>
                  <h2 className="text-xl font-bold mt-1" style={{ color: TEXT }}>
                    {race.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: TEXT_SEC }}>
                    <span>{race.track.name}</span>
                    <span>{"·"}</span>
                    <span>{race.distance}F {race.surface}</span>
                    <span>{"·"}</span>
                    <span>{race.condition}</span>
                    <span>{"·"}</span>
                    <span>${(race.purse / 1000).toFixed(0)}K Purse</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="text-right mr-2">
                <div className="text-[10px] uppercase font-semibold" style={{ color: TEXT_MUTED }}>Balance</div>
                <div className="text-lg font-bold font-mono" style={{ color: GOLD }}>
                  <AnimatedBalance value={user.bankroll} />
                </div>
              </div>
            )}
            <TimerRing seconds={timer} total={timerTotal} phase={phase} label={phaseLabel} />
          </div>
        </div>

        {/* ──────────── Main Layout ──────────── */}
        {race && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-8">
            {/* ──── Left: Bet Slip / Results ──── */}
            <div className="lg:col-span-4 space-y-4">
              {phase === "betting" && user && (
                <div className="p-4 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold" style={{ color: TEXT }}>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" style={{ color: GOLD }} />
                        Bet Slip
                      </div>
                    </h3>
                    <span className="text-xs font-mono font-bold" style={{ color: GOLD }}>
                      ${user.bankroll.toLocaleString()}
                    </span>
                  </div>
                  <BetSlipBuilder
                    race={race}
                    bets={bets}
                    bankroll={user.bankroll}
                    onPlaceBet={placeBet}
                    onRemoveBet={removeBet}
                  />
                </div>
              )}

              {phase === "post_parade" && (
                <div className="p-5 rounded-2xl text-center space-y-3" style={{ background: BG_CARD, border: `1.5px solid ${BORDER}` }}>
                  <Lock className="w-6 h-6 mx-auto" style={{ color: ORANGE }} />
                  <p className="text-sm font-bold" style={{ color: TEXT }}>Bets Locked</p>
                  <p className="text-xs" style={{ color: TEXT_SEC }}>
                    {bets.length > 0 ? `${bets.length} bet${bets.length > 1 ? "s" : ""} on your slip` : "No bets placed"}
                  </p>
                  {bets.length > 0 && (
                    <div className="space-y-1">
                      {bets.map((bet) => (
                        <div key={bet.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: BG_WHITE, border: `1px solid ${BORDER}` }}>
                          <span className="font-semibold" style={{ color: GOLD }}>{BET_TYPE_CONFIG[bet.type].label}</span>
                          <span style={{ color: TEXT }}>{bet.horseNames.join(" → ")}</span>
                          <span className="font-mono font-bold" style={{ color: TEXT }}>${bet.totalCost}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {phase === "racing" && (
                <div className="p-5 rounded-2xl text-center space-y-3" style={{ background: BG_DARK, border: `1.5px solid ${BG_DARK}` }}>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Zap className="w-8 h-8 mx-auto" style={{ color: GOLD }} />
                  </motion.div>
                  <p className="text-base font-bold text-white">Race in Progress</p>
                  <p className="text-xs text-white/50">Watch the track!</p>
                  {bets.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {bets.map((bet) => (
                        <div key={bet.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <span className="font-semibold" style={{ color: GOLD }}>{BET_TYPE_CONFIG[bet.type].label}</span>
                          <span className="text-white/70 truncate px-2">{bet.horseNames.join(" → ")}</span>
                          <span className="font-mono font-bold text-white">${bet.totalCost}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {phase === "results" && (
                <div className="p-4 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                  <ResultsPanel
                    race={race}
                    finishOrder={finishOrder}
                    betResults={betResults}
                    totalWinnings={totalWinnings}
                    totalWagered={totalWagered}
                  />
                </div>
              )}
            </div>

            {/* ──── Center: Race Track ──── */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${BORDER}` }}>
                {/* Win celebration overlay */}
                <AnimatePresence>
                  {showCelebration && finishOrder[0] && (
                    <WinCelebration
                      winnerName={finishOrder[0]}
                      totalWinnings={totalWinnings - totalWagered > 0 ? totalWinnings - totalWagered : 0}
                    />
                  )}
                </AnimatePresence>

                {/* Post Parade */}
                {phase === "post_parade" && (
                  <PostParadeOverlay race={race} timer={timer} />
                )}

                {/* Race replay during racing + results */}
                {(phase === "racing" || phase === "results") && replayData && (
                  <RaceReplay
                    horses={replayData.horses}
                    colors={replayData.colors}
                    distance={race.distance}
                  />
                )}

                {/* Race card during betting */}
                {phase === "betting" && (
                  <div className="p-5 space-y-2.5" style={{ background: BG_WHITE }}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_SEC }}>
                        Post Positions
                      </h3>
                      <span className="text-[10px] font-mono" style={{ color: TEXT_MUTED }}>
                        {race.horses.length} runners
                      </span>
                    </div>

                    {race.horses.map((horse, i) => {
                      const odds = race.odds[horse.name];
                      const profile = ALL_PROFILES.find(p => p.name === horse.name);
                      const imgUrl = getHorseImage(horse.name);
                      const slug = getHorseSlug(horse.name);
                      return (
                        <div
                          key={horse.name}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:shadow-sm"
                          style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
                        >
                          {/* Horse image */}
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${horse.color}` }}>
                            {imgUrl ? (
                              <Image src={imgUrl} alt={horse.name} width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: horse.color }}>
                                {i + 1}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: horse.color, width: 16, height: 16, fontSize: 9 }}>
                              {i + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profiles/${slug}`} className="text-sm font-bold truncate block hover:underline" style={{ color: TEXT }}>
                              {horse.name}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{ color: TEXT_MUTED }}>
                              <span className="px-1.5 py-0.5 rounded" style={{ background: `${horse.color}12`, color: horse.color, fontWeight: 600 }}>
                                {horse.runningStyle}
                              </span>
                              <span>{horse.topSpeed.toFixed(1)} ft/s</span>
                              {profile && <span>Avg finish: {profile.avgFinish.toFixed(1)}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base font-bold font-mono" style={{ color: GOLD }}>
                              {formatOddsDisplay(odds?.win ?? 2)}
                            </div>
                            <div className="text-[9px] uppercase font-semibold" style={{ color: TEXT_MUTED }}>
                              ML
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pace projection */}
                    <div className="mt-3 p-3 rounded-xl" style={{ background: `${GOLD}06`, border: `1px solid ${GOLD}20` }}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: GOLD }}>
                        <TrendingUp className="w-3.5 h-3.5" />
                        Pace Projection
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: TEXT_SEC }}>
                        {(() => {
                          const fr = race.horses.filter((h) => h.runningStyle === "Front Runner").length;
                          const cl = race.horses.filter((h) => h.runningStyle === "Closer").length;
                          const st = race.horses.filter((h) => h.runningStyle === "Stalker").length;
                          if (fr >= 3) return `Hot pace \u2014 ${fr} front runners will battle for the lead. Closers have the edge.`;
                          if (fr === 0) return `Slow pace likely \u2014 no true front runner. Tactical speed wins.`;
                          if (fr === 1 && cl >= 3) return `Lone speed \u2014 1 front runner can dictate pace. ${cl} closers need a fast pace to rally.`;
                          return `Honest pace \u2014 ${fr} speed, ${st} stalkers, ${cl} closers. Balanced race.`;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ──── Right: Stats + Next Race ──── */}
            <div className="lg:col-span-3 space-y-4">
              {/* User Stats */}
              {user && (
                <div className="p-4 rounded-2xl sticky top-20" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                  <UserStats user={user} />

                  {/* Next race countdown */}
                  <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: TEXT_MUTED }} />
                        <span className="text-[10px] font-semibold uppercase" style={{ color: TEXT_MUTED }}>
                          Next Race
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: TEXT }}>
                        {formatTimer(Math.max(0, Math.ceil(CYCLE_DURATION - getTimeInCycle())))}
                      </span>
                    </div>
                    {/* Cycle progress bar */}
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(to right, ${GOLD}, ${phaseBadgeColor})`,
                          width: `${(getTimeInCycle() / CYCLE_DURATION) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px]" style={{ color: TEXT_MUTED }}>
                      <span>Betting</span>
                      <span>Post</span>
                      <span>Race</span>
                      <span>Results</span>
                    </div>
                  </div>

                  {/* Reset bankroll */}
                  {user.bankroll <= 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3"
                    >
                      <button
                        onClick={resetBankroll}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
                        style={{ background: RED }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Busted! Reset to $1,000
                      </button>
                    </motion.div>
                  )}

                  {/* Change name / reset */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setShowNameEntry(true)}
                      className="flex-1 py-2 rounded-lg text-[10px] font-medium"
                      style={{ color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
                    >
                      Change Name
                    </button>
                    <button
                      onClick={resetBankroll}
                      className="flex-1 py-2 rounded-lg text-[10px] font-medium"
                      style={{ color: TEXT_MUTED, border: `1px solid ${BORDER}` }}
                    >
                      Reset Stats
                    </button>
                  </div>
                </div>
              )}

              {/* Shared Leaderboard */}
              <div className="p-4 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                <SharedLeaderboard
                  entries={leaderboard}
                  schoolStandings={schoolStandings}
                  currentUserId={user?.id}
                  connected={lbConnected}
                  loading={lbLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading state when no race */}
        {!race && (
          <div className="py-20 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-8 h-8 mx-auto mb-4"
            >
              <Zap className="w-8 h-8" style={{ color: GOLD }} />
            </motion.div>
            <p className="text-sm" style={{ color: TEXT_SEC }}>Generating race card...</p>
          </div>
        )}
      </div>
    </main>
  );
}
