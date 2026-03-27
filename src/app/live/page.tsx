"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  Ticket,
  Zap,
  AlertCircle,
  Lock,
  KeyRound,
  LogIn,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ALL_PROFILES } from "@/lib/data/horse-profiles";
import type { HorseProfile } from "@/lib/data/horse-profiles";
import { runMonteCarlo, simToReplayData } from "@/lib/simulation/engine";
import type { SimHorse, SimResults, Surface, TrackBias } from "@/lib/simulation/types";
import { profileToSim } from "@/lib/simulation/helpers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PIPELINE_ACTIVE, HORSE_SPEED_FIGURES } from "@/lib/data/pipeline-output";
import {
  TimerRing,
  AnimatedBalance,
  PostParadeOverlay,
  WinCelebration,
  ResultsPanel,
  LiveActivityFeed,
  SharedLeaderboard,
} from "@/components/live";
import {
  GOLD, GOLD_LIGHT, BG_WHITE, BG_CARD, BG_DARK, TEXT, TEXT_SEC, TEXT_MUTED,
  BORDER, GREEN, RED, BLUE, PURPLE, ORANGE, RACE_COLORS,
  TRACK_CONFIGS, RACE_NAMES, CONDITIONS, SCHOOLS,
  BET_TYPE_CONFIG, boxCombinations, formatOddsDisplay, formatMoney, getHorseSlug,
  type Phase, type BetType, type Bet, type UserProfile, type RaceCard, type BetResult,
} from "@/components/live/constants";
import LiveRaceView from "@/components/arena/LiveRaceView";
import { useLeaderboard } from "@/lib/supabase/useLeaderboard";
import type { LeaderboardEntry, SchoolStanding } from "@/lib/supabase/useLeaderboard";
import { hashPin } from "@/lib/auth/pin";
import { registerPlayer, loginPlayer } from "@/lib/supabase/auth";
import { getHorseImageUrl } from "@/lib/data/horse-images";
import { supabase } from "@/lib/supabase/client";

import {
  CYCLE_DURATION,
  BETTING_DURATION,
  POST_PARADE_DURATION,
  RACING_DURATION,
  RESULTS_DURATION,
} from "@/lib/constants/race-timing";

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

// Re-export shared timing functions used in this file
import {
  getCurrentEpoch,
  getTimeInCycle,
  getPhaseFromCycleTime,
  getPhaseTimer,
  formatRaceTimer as formatTimer,
} from "@/lib/constants/race-timing";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function generateSeededRace(epoch: number): RaceCard {
  const rand = createSeededRandom(epoch * 7919 + 31337);

  const numHorses = 6 + Math.floor(rand() * 5); // 6-10
  const shuffled = seededShuffle(ALL_PROFILES, rand);
  const selected = shuffled.slice(0, Math.min(numHorses, shuffled.length));
  const horses = selected.map((p, i) => {
    const sim = profileToSim(p, i + 1, RACE_COLORS[(i + 1) % RACE_COLORS.length]);
    // Blend pipeline-computed speed figures into avgSpeed when available.
    // This makes the Monte Carlo reflect real data-backed ability, not just profile curves.
    if (PIPELINE_ACTIVE) {
      const figs = HORSE_SPEED_FIGURES[p.name];
      if (figs && figs.avg_last_5 > 0) {
        // Speed figure 100 = average. Convert figure delta to ft/s delta.
        // 10 figure points ≈ 1 stdev ≈ ~1.4 ft/s (from pipeline stats: stdev=1.4)
        const figDelta = (figs.avg_last_5 - 100) / 10 * 1.4;
        // Blend: 70% profile avgSpeed + 30% figure-adjusted speed
        const fieldAvg = 16.5; // approximate field average ft/s
        const figAdjusted = fieldAvg + figDelta;
        sim.avgSpeed = Math.round((sim.avgSpeed * 0.7 + figAdjusted * 0.3) * 100) / 100;
      }
    }
    return sim;
  });

  const distances = [5, 6, 7, 8, 9, 10];
  const distance = distances[Math.floor(rand() * distances.length)];
  const surface: Surface = rand() > 0.3 ? "Dirt" : "Turf";
  const condition = seededPick(CONDITIONS, rand);
  const purses = [50000, 75000, 100000, 150000, 250000, 500000];
  const purse = purses[Math.floor(rand() * purses.length)];
  const track = seededPick(TRACK_CONFIGS, rand);
  const name = seededPick(RACE_NAMES, rand);

  // Generate odds by running the SAME simulation engine used for race results.
  // This ensures displayed odds actually predict outcomes — one unified model.
  // Use a separate seeded RNG so odds are deterministic per epoch but don't
  // consume the same seed as the race result.
  const oddsRand = createSeededRandom(epoch * 4993 + 17389);
  const oddsSim = runMonteCarlo({
    horses,
    distanceFurlongs: distance,
    surface,
    trackBias: track.bias,
    numSimulations: 200, // enough for stable odds, fast enough for race generation
    random: oddsRand,
  });

  // Convert Monte Carlo win/place/show percentages to decimal odds with 15% vig.
  // Vig is applied to PROFIT only (not total return), matching real track practice.
  // Formula: decimal = 1 + (fairProfit * (1 - vig))
  //        = 1 + ((100/pct - 1) * 0.85)
  const VIG = 0.15;
  const odds: Record<string, { win: number; place: number; show: number }> = {};
  for (const h of oddsSim.horses) {
    const winPct = Math.max(2, h.winPct);   // floor at 2% so no infinite odds
    const placePct = Math.max(5, h.placePct);
    const showPct = Math.max(10, h.showPct);

    const winOdds = Math.max(1.2, Math.min(30, 1 + (100 / winPct - 1) * (1 - VIG)));
    const placeOdds = Math.max(1.1, Math.min(12, 1 + (100 / placePct - 1) * (1 - VIG)));
    const showOdds = Math.max(1.05, Math.min(5, 1 + (100 / showPct - 1) * (1 - VIG)));

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
  const seededRand = createSeededRandom(resultSeed);

  const results = runMonteCarlo({
    horses: race.horses,
    distanceFurlongs: race.distance,
    surface: race.surface,
    trackBias: race.track.bias,
    numSimulations: 1,
    random: seededRand,
  });

  const order = results.allRaces[0]?.finishOrder ?? [];
  const replay = results.allRaces[0]
    ? simToReplayData(results.allRaces[0], race.horses, race.distance)
    : null;

  return { results, order, replay };
}

/** Find profile by horse name to get imageUrl */
function getHorseImage(name: string): string {
  return getHorseImageUrl(name);
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

// ODDS AUDIT FIX [P3]: Document exotic payout multipliers.
// These reduction factors approximate real track exotic pool takeouts:
// - Exacta: 0.6x (real tracks take ~20-25% of exacta pool; 0.6 accounts for pool inefficiency)
// - Trifecta: 0.4x (higher complexity = larger takeout; real tracks take ~25-30%)
// - Trifecta Key: 0.45x (slightly better than box due to key constraint)
// - Superfecta: 0.3x (most complex exotic; real tracks take ~30%+)
// All exotics capped at 500x the wager to prevent unrealistic payouts.
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
        return { won: true, payout: Math.min(Math.round(bet.amount * o1 * o2 * 0.6), bet.amount * 500) };
      }
      return { won: false, payout: 0 };

    case "exacta_box": {
      const top2 = [first, second];
      if (bet.horseNames.every((n) => top2.includes(n))) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        // Box: same per-combo payout as straight (user pays for more combos)
        return { won: true, payout: Math.min(Math.round(bet.amount * o1 * o2 * 0.6), bet.amount * 500) };
      }
      return { won: false, payout: 0 };
    }

    case "trifecta":
      if (!third) return { won: false, payout: 0 }; // ODDS AUDIT FIX [P3]: Guard against <3 finishers
      if (bet.horseNames[0] === first && bet.horseNames[1] === second && bet.horseNames[2] === third) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        return { won: true, payout: Math.min(Math.round(bet.amount * o1 * o2 * o3 * 0.4), bet.amount * 500) };
      }
      return { won: false, payout: 0 };

    case "trifecta_box": {
      if (!third) return { won: false, payout: 0 }; // ODDS AUDIT FIX [P3]
      const top3 = [first, second, third];
      if (bet.horseNames.every((n) => top3.includes(n))) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        return { won: true, payout: Math.min(Math.round(bet.amount * o1 * o2 * o3 * 0.4), bet.amount * 500) };
      }
      return { won: false, payout: 0 };
    }

    case "trifecta_key": {
      if (!third) return { won: false, payout: 0 }; // ODDS AUDIT FIX [P3]
      // First horse is the key (must win), others fill 2nd/3rd in any order
      if (bet.horseNames[0] === first) {
        const others = bet.horseNames.slice(1);
        if (others.every((n) => [second, third].includes(n))) {
          const o1 = odds[first]?.win ?? 2;
          const o2 = odds[second]?.win ?? 2;
          const o3 = odds[third]?.win ?? 2;
          return { won: true, payout: Math.min(Math.round(bet.amount * o1 * o2 * o3 * 0.45), bet.amount * 500) };
        }
      }
      return { won: false, payout: 0 };
    }

    // ODDS AUDIT FIX [P3]: Guard superfecta against fields with <4 finishers
    case "superfecta":
      if (!fourth) return { won: false, payout: 0 }; // Not enough finishers
      if (bet.horseNames[0] === first && bet.horseNames[1] === second &&
          bet.horseNames[2] === third && bet.horseNames[3] === fourth) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        const o4 = odds[fourth]?.win ?? 2;
        return { won: true, payout: Math.min(Math.round(bet.amount * o1 * o2 * o3 * o4 * 0.3), bet.amount * 500) };
      }
      return { won: false, payout: 0 };

    case "superfecta_box": {
      if (!fourth) return { won: false, payout: 0 }; // Not enough finishers
      const top4 = [first, second, third, fourth];
      if (bet.horseNames.every((n) => top4.includes(n))) {
        const o1 = odds[first]?.win ?? 2;
        const o2 = odds[second]?.win ?? 2;
        const o3 = odds[third]?.win ?? 2;
        const o4 = odds[fourth]?.win ?? 2;
        return { won: true, payout: Math.min(Math.round(bet.amount * o1 * o2 * o3 * o4 * 0.3), bet.amount * 500) };
      }
      return { won: false, payout: 0 };
    }

    default:
      return { won: false, payout: 0 };
  }
}

/* ================================================================== */
/*  Auth Modal — New Player / Welcome Back with PIN                    */
/* ================================================================== */

function AuthModal({ onSubmit }: { onSubmit: (user: UserProfile) => void }) {
  const [mode, setMode] = useState<"new" | "returning">("new");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  // Reset error when switching modes or changing fields
  useEffect(() => { setError(""); }, [mode, name, school, pin, confirmPin]);

  // Name validation — letters, numbers, spaces only, max 15 chars
  const cleanName = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  const BLOCKED_WORDS = ["fuc", "sht", "ass", "dic", "bit", "nig", "fag", "cnt", "hor", "slt", "naz", "kil", "sex", "wtf"];
  const nameHasBadWord = BLOCKED_WORDS.some(w => cleanName.toLowerCase().includes(w));
  const nameValid = cleanName.trim().length >= 2 && cleanName.trim().length <= 3 && !nameHasBadWord;

  const pinValid = pin.length === 4 && /^\d{4}$/.test(pin);
  const isLocked = Date.now() < lockedUntil;
  const isNewValid = nameValid && school !== "" && pinValid && pin === confirmPin;
  const isReturnValid = cleanName.trim().length >= 2 && cleanName.trim().length <= 3 && school !== "" && pinValid && !isLocked;
  const isValid = mode === "new" ? isNewValid : isReturnValid;

  const handlePinInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    setter(cleaned);
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "new") {
        const pinHash = await hashPin(pin);
        const id = crypto.randomUUID();

        const { success, error: regError } = await registerPlayer(id, name.trim(), school, pinHash);
        if (!success && regError) {
          setError(regError);
          setLoading(false);
          return;
        }

        const newUser = createUser(name.trim(), school);
        newUser.id = id;
        onSubmit(newUser);
      } else {
        // Rate limiting — lock after 5 failed attempts for 30 seconds
        if (isLocked) {
          setError("Too many attempts. Please wait 30 seconds.");
          setLoading(false);
          return;
        }

        const { player, error: loginError } = await loginPlayer(name.trim(), school, pin);
        if (!player) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= 5) {
            setLockedUntil(Date.now() + 30000);
            setError("Too many failed attempts. Locked for 30 seconds.");
          } else {
            setError(loginError ?? `Login failed. ${5 - newAttempts} attempts remaining.`);
          }
          setLoading(false);
          return;
        }

        // Reconstruct UserProfile from Supabase data
        const restoredUser: UserProfile = {
          id: player.id,
          name: player.name,
          school: player.school,
          bankroll: player.bankroll,
          startingBankroll: 1000,
          totalProfit: player.total_profit,
          racesPlayed: player.races_played,
          biggestWin: player.biggest_win,
          history: [], // history is local-only, start fresh
        };
        onSubmit(restoredUser);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,26,42,0.85)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: `0 0 80px rgba(245,200,66,0.06)` }}
      >
        {/* Mode toggle tabs */}
        <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {(["new", "returning"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setPin(""); setConfirmPin(""); }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all"
              style={{
                background: mode === m ? `${GOLD}08` : "transparent",
                color: mode === m ? GOLD : TEXT_MUTED,
                borderBottom: mode === m ? `2px solid ${GOLD}` : "2px solid transparent",
              }}
            >
              {m === "new" ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {m === "new" ? "New Player" : "Welcome Back"}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25` }}
            >
              {mode === "new" ? (
                <Zap className="w-7 h-7" style={{ color: GOLD }} />
              ) : (
                <KeyRound className="w-7 h-7" style={{ color: GOLD }} />
              )}
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#fff" }}>
              {mode === "new" ? "Join Race Night" : "Welcome Back"}
            </h2>
            <p className="text-[13px]" style={{ color: TEXT_SEC }}>
              {mode === "new"
                ? "$1,000 bankroll. New race every 6 minutes."
                : "Enter your name, school & PIN to restore your account."}
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: TEXT_SEC }}>
                Initials <span className="font-normal normal-case" style={{ color: TEXT_MUTED }}>(2-3 letters)</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="ABC"
                maxLength={3}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                style={{
                  background: BG_DARK,
                  border: `2px solid ${nameHasBadWord ? RED : nameValid ? `${GOLD}60` : BORDER}`,
                  color: "#fff",
                }}
              />
              {nameHasBadWord && (
                <p className="text-[10px] mt-1" style={{ color: RED }}>Please choose an appropriate name</p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: TEXT_SEC }}>
                School
              </label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all appearance-none cursor-pointer"
                style={{
                  background: BG_DARK,
                  border: `2px solid ${school ? `${GOLD}60` : BORDER}`,
                  color: school ? "#fff" : TEXT_MUTED,
                }}
              >
                <option value="">Select your school...</option>
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* PIN input */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: TEXT_SEC }}>
                4-Digit PIN
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[idx] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newPin = pin.split("");
                      newPin[idx] = val;
                      const joined = newPin.join("").slice(0, 4);
                      setPin(joined);
                      // Auto-advance to next input
                      if (val && idx < 3) {
                        const next = e.target.parentElement?.children[idx + 1] as HTMLInputElement;
                        next?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !pin[idx] && idx > 0) {
                        const prev = (e.target as HTMLElement).parentElement?.children[idx - 1] as HTMLInputElement;
                        prev?.focus();
                      }
                    }}
                    className="w-full aspect-square rounded-xl text-center text-xl font-mono font-bold outline-none transition-all"
                    style={{
                      background: BG_DARK,
                      border: `2px solid ${pin[idx] ? `${GOLD}60` : BORDER}`,
                      color: GOLD,
                      maxWidth: 56,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Confirm PIN (new only) */}
            {mode === "new" && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: TEXT_SEC }}>
                  Confirm PIN
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={confirmPin[idx] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const newPin = confirmPin.split("");
                        newPin[idx] = val;
                        const joined = newPin.join("").slice(0, 4);
                        setConfirmPin(joined);
                        if (val && idx < 3) {
                          const next = e.target.parentElement?.children[idx + 1] as HTMLInputElement;
                          next?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !confirmPin[idx] && idx > 0) {
                          const prev = (e.target as HTMLElement).parentElement?.children[idx - 1] as HTMLInputElement;
                          prev?.focus();
                        }
                        if (e.key === "Enter" && idx === 3) handleSubmit();
                      }}
                      className="w-full aspect-square rounded-xl text-center text-xl font-mono font-bold outline-none transition-all"
                      style={{
                        background: BG_DARK,
                        border: `2px solid ${confirmPin[idx] ? (pin[idx] === confirmPin[idx] ? `${GREEN}60` : `${RED}60`) : BORDER}`,
                        color: confirmPin[idx] && pin[idx] === confirmPin[idx] ? GREEN : confirmPin[idx] ? RED : GOLD,
                        maxWidth: 56,
                      }}
                    />
                  ))}
                </div>
                {confirmPin.length === 4 && pin !== confirmPin && (
                  <p className="text-[11px] mt-1.5" style={{ color: RED }}>PINs don{"'"}t match</p>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: `${RED}12`, border: `1px solid ${RED}25` }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: RED }} />
                <span className="text-[12px] font-medium" style={{ color: RED }}>{error}</span>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{
                background: isValid && !loading ? GOLD : BORDER,
                color: isValid && !loading ? "#fff" : TEXT_MUTED,
                opacity: isValid && !loading ? 1 : 0.5,
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
              ) : mode === "new" ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Create Account & Enter
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
              <KeyRound className="w-3 h-3 inline mr-1" style={{ color: TEXT_MUTED }} />
              Your PIN lets you access your account from any device.
            </p>
          </div>
        </div>
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

    // Exotic estimate — multipliers match calculateBetPayout
    const horseOdds = selectedHorses.map((n) => race.odds[n]?.win ?? 2);
    const product = horseOdds.reduce((a, b) => a * b, 1);
    const multiplier = betType.includes("superfecta") ? 0.3
      : betType === "trifecta_key" ? 0.45
      : betType.includes("trifecta") ? 0.4
      : 0.6;
    // Cap exotic payouts at 500x the wager
    return Math.min(Math.round(amount * product * multiplier), amount * 500);
  }, [canPlace, betType, selectedHorses, amount, race.odds]);

  const straightTypes: BetType[] = ["win", "place", "show"];
  // ODDS AUDIT FIX [P3]: Only show exotic bet types when field is large enough
  const fieldSize = race.horses.length;
  const exoticTypes: BetType[] = [
    ...(fieldSize >= 2 ? ["exacta", "exacta_box"] as BetType[] : []),
    ...(fieldSize >= 3 ? ["trifecta", "trifecta_box", "trifecta_key"] as BetType[] : []),
    ...(fieldSize >= 4 ? ["superfecta", "superfecta_box"] as BetType[] : []),
  ];

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
      <div className="px-3 py-2 rounded-lg text-[11px]" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}25`, color: TEXT_SEC }}>
        <span className="font-semibold" style={{ color: GOLD }}>{config.label}:</span> {config.description}
        {combos > 1 && (
          <span className="ml-1 font-mono" style={{ color: PURPLE }}>({combos} combos = ${amount} {"×"} {combos} = ${totalCost})</span>
        )}
      </div>

      {/* Horse Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[400px] overflow-y-auto pr-1">
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
                background: isSelected ? `${GOLD}10` : BG_CARD,
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-[10px] font-bold">
                    {isKey && orderIdx === 0 ? "K" : orderIdx + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: TEXT }}>
                  #{i + 1} {horse.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: TEXT_SEC }}>
                  <span className="px-1.5 py-0.5 rounded" style={{ background: `${horse.color}18`, color: horse.color, fontWeight: 600 }}>
                    {horse.runningStyle}
                  </span>
                  <span>{(horse.topSpeed * 0.6818).toFixed(0)} mph</span>
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
/*  Main Page Component                                                */
/* ================================================================== */

export default function LiveRacingPage() {
  /* ---- User state ---- */
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* ---- Supabase leaderboard ---- */
  const { leaderboard, schoolStandings, loading: lbLoading, connected: lbConnected, syncPlayer, logBets, processRaceResult, refetchWins, recentWins } = useLeaderboard();

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

  /* ---- Refs ---- */
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEpochRef = useRef(0);
  const resultsProcessedRef = useRef(false);
  const clockOffsetRef = useRef(0); // server time offset in ms

  /* ---- Initialize — load user, sync clock, validate against server ---- */
  useEffect(() => {
    setMounted(true);

    // Sync clock with server to prevent phase drift across clients
    (async () => {
      try {
        const { data } = await supabase.rpc("get_server_time");
        if (data) {
          const serverMs = new Date(data).getTime();
          clockOffsetRef.current = serverMs - Date.now();
        }
      } catch {
        // Fail silently — 0 offset is fine as fallback
      }
    })();

    const saved = loadUser();
    if (saved) {
      // Validate bankroll: cap at reasonable max to prevent localStorage tampering
      // Exotic bets can pay up to 500x, so max = starting + races * 5000 (generous)
      const maxBankroll = Math.max(10000, saved.startingBankroll + (saved.racesPlayed * 5000));
      if (saved.bankroll > maxBankroll) {
        saved.bankroll = 1000;
        saved.totalProfit = 0;
        saved.biggestWin = 0;
        saveUser(saved);
      }
      setUser(saved);
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

  /* ---- Auth complete (new or returning user) ---- */
  const handleAuthComplete = useCallback((authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    saveUser(authenticatedUser);
    setShowNameEntry(false);
    syncPlayer({
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      school: authenticatedUser.school,
      bankroll: authenticatedUser.bankroll,
      total_profit: authenticatedUser.totalProfit,
      races_played: authenticatedUser.racesPlayed,
      biggest_win: authenticatedUser.biggestWin,
    });
  }, [syncPlayer]);

  /* ---- Master clock — ticks every 200ms ---- */
  useEffect(() => {
    if (!mounted) return;

    const tick = () => {
      // Use server-corrected time to keep all clients in sync
      const now = Date.now() + clockOffsetRef.current;
      const currentEpoch = Math.floor(now / (CYCLE_DURATION * 1000));
      const cycleTime = (now / 1000) % CYCLE_DURATION;
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

    const results: BetResult[] = bets.map((bet) => {
      const { won, payout } = calculateBetPayout(bet, finishOrder, race.odds);
      return { bet, payout, won };
    });

    setBetResults(results);

    const wagered = bets.reduce((s, b) => s + b.totalCost, 0);
    const winnings = results.reduce((s, r) => s + (r.won ? r.payout : 0), 0);
    setTotalWagered(wagered);
    setTotalWinnings(winnings);

    // Update user and sync to server via atomic RPC
    if (user && bets.length > 0) {
      const netProfit = winnings - wagered;
      const newBankroll = Math.max(0, user.bankroll + netProfit);
      const wonBets = results.filter(r => r.won).map(r => r.payout - r.bet.totalCost);
      const newBiggestWin = wonBets.length > 0 ? Math.max(user.biggestWin, ...wonBets) : user.biggestWin;

      // Update local state optimistically
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

      // Atomic server-side payout via RPC (idempotent — safe to retry or call from multiple tabs)
      processRaceResult(
        updatedUser.id,
        epoch,
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
        })),
        netProfit,
        newBiggestWin,
      ).then((result) => {
        // If server returned a different bankroll (e.g., already processed), correct local state
        if (result?.new_bankroll !== undefined && result.new_bankroll !== newBankroll) {
          setUser((prev) => prev ? { ...prev, bankroll: result.new_bankroll! } : prev);
          saveUser({ ...updatedUser, bankroll: result.new_bankroll! });
        }
        setTimeout(refetchWins, 500);
      });

      // Show celebration if any bet won
      if (winnings > 0) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }
    } else if (user && bets.length === 0) {
      // No bets — still count as race played via RPC (empty bets array)
      const updatedUser: UserProfile = {
        ...user,
        racesPlayed: user.racesPlayed + 1,
        history: [...user.history, { raceEpoch: epoch, profit: 0, bankroll: user.bankroll }],
      };
      setUser(updatedUser);
      saveUser(updatedUser);

      processRaceResult(updatedUser.id, epoch, [], 0, 0);
    }
  }, [phase, race, finishOrder, bets, user, epoch, processRaceResult]);

  /* ---- Bet management ---- */
  const placeBet = useCallback((bet: Omit<Bet, "id">) => {
    if (phase !== "betting" || !user) return;
    // 2-second buffer before close to prevent bets submitted during phase transition
    const now = Date.now() + clockOffsetRef.current;
    const cycleTime = (now / 1000) % CYCLE_DURATION;
    if (cycleTime >= BETTING_DURATION - 2) return;

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

  /* ---- No reset — you lose your $1,000, that's on you ---- */

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
        {showNameEntry && <AuthModal onSubmit={handleAuthComplete} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ──────────── Top Bar ──────────── */}
        <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              {/* Badge row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md"
                  style={{ background: `${phaseBadgeColor}15`, color: phaseBadgeColor, border: `1px solid ${phaseBadgeColor}30` }}
                >
                  {phaseLabel}
                </span>
                {race && (
                  <span
                    className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md"
                    style={{ background: BG_CARD, color: TEXT_SEC, border: `1px solid ${BORDER}` }}
                  >
                    Race #{race.raceNumber}
                  </span>
                )}
                {/* Pulsing LIVE indicator with red dot */}
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse-live" style={{ background: "#ef4444" }} />
                  LIVE
                </span>
              </div>
              {race && (
                <>
                  <h2 className="text-xl font-bold mt-1.5" style={{ color: TEXT }}>
                    {race.name}
                  </h2>
                  {/* Race metadata badges */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {[
                      race.track.name,
                      `${race.distance}F ${race.surface}`,
                      race.condition,
                      `$${(race.purse / 1000).toFixed(0)}K Purse`,
                    ].map((badge, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md"
                        style={{ background: BG_CARD, color: TEXT_SEC, border: `1px solid ${BORDER}` }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TimerRing seconds={timer} total={timerTotal} phase={phase} label={phaseLabel} />
          </div>
        </div>

        {/* ──────────── Main Layout ──────────── */}
        {race && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-8">
            {/* ──── Left Panel ──── */}
            {/* Betting: takes 9 cols (no center track). Other phases: takes 4 cols */}
            <div className={`space-y-4 ${phase === "betting" ? "lg:col-span-9" : "lg:col-span-4"}`}>
              {/* BETTING PHASE: One unified light panel — odds table + bet controls */}
              {phase === "betting" && user && (
                <div className="p-4 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" style={{ color: GOLD }} />
                      <h3 className="text-sm font-bold" style={{ color: TEXT }}>Race Card</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: BG_CARD, color: TEXT_SEC, border: `1px solid ${BORDER}` }}>
                      {race.horses.length} runners
                    </span>
                  </div>

                  {/* Odds table */}
                  <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${BORDER}` }}>
                    {/* Column headers */}
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: BG_CARD, borderBottom: `1px solid ${BORDER}` }}>
                      <span className="w-7 text-[9px] font-bold text-center" style={{ color: TEXT_MUTED }}>#</span>
                      <span className="flex-1 text-[9px] font-bold uppercase" style={{ color: TEXT_MUTED }}>Horse</span>
                      <span className="w-14 text-[9px] font-bold text-center uppercase" style={{ color: TEXT_MUTED }}>Win</span>
                      <span className="w-14 text-[9px] font-bold text-center uppercase" style={{ color: TEXT_MUTED }}>Place</span>
                      <span className="w-14 text-[9px] font-bold text-center uppercase" style={{ color: TEXT_MUTED }}>Show</span>
                    </div>

                    {/* Horse rows */}
                    {race.horses.map((horse, i) => {
                      const odds = race.odds[horse.name];
                      const imgUrl = getHorseImage(horse.name);
                      const slug = getHorseSlug(horse.name);
                      return (
                        <div
                          key={horse.name}
                          className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[#f3f1ec]"
                          style={{ background: i % 2 === 0 ? BG_WHITE : BG_CARD, borderBottom: i < race.horses.length - 1 ? `1px solid ${BORDER}` : "none" }}
                        >
                          <div className="w-7 shrink-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full overflow-hidden" style={{ border: `2px solid ${horse.color}` }}>
                              {imgUrl ? (
                                <Image src={imgUrl} alt={horse.name} width={24} height={24} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: horse.color }}>
                                  {i + 1}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profiles/${slug}`} className="text-[12px] font-bold truncate block hover:underline" style={{ color: TEXT }}>
                              {horse.name}
                            </Link>
                            <div className="text-[10px]" style={{ color: horse.color }}>{horse.runningStyle}</div>
                          </div>
                          <div className="w-14 text-center">
                            <span className="text-[12px] font-bold font-mono" style={{ color: GOLD }}>{formatOddsDisplay(odds?.win ?? 2)}</span>
                          </div>
                          <div className="w-14 text-center">
                            <span className="text-[12px] font-bold font-mono" style={{ color: TEXT_SEC }}>{formatOddsDisplay(odds?.place ?? 1.5)}</span>
                          </div>
                          <div className="w-14 text-center">
                            <span className="text-[12px] font-bold font-mono" style={{ color: TEXT_SEC }}>{formatOddsDisplay(odds?.show ?? 1.2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pace projection */}
                  <div className="mb-4 p-2.5 rounded-lg" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
                    <div className="text-[10px]" style={{ color: TEXT_SEC }}>
                      {(() => {
                        const fr = race.horses.filter((h) => h.runningStyle === "Front Runner").length;
                        const cl = race.horses.filter((h) => h.runningStyle === "Closer").length;
                        const st = race.horses.filter((h) => h.runningStyle === "Stalker").length;
                        if (fr >= 3) return `Hot pace — ${fr} front runners will battle. Edge: closers.`;
                        if (fr === 0) return "Slow pace likely — no front runner. Tactical speed wins.";
                        if (fr === 1 && cl >= 3) return `Lone speed — 1 front runner dictates. ${cl} closers need fast pace.`;
                        return `Honest pace — ${fr} speed, ${st} stalkers, ${cl} closers.`;
                      })()}
                    </div>
                  </div>

                  {/* Bet controls — seamlessly integrated */}
                  <div className="pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <ErrorBoundary section="Bet Slip">
                      <BetSlipBuilder
                        race={race}
                        bets={bets}
                        bankroll={user.bankroll}
                        onPlaceBet={placeBet}
                        onRemoveBet={removeBet}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              )}

              {/* POST PARADE: locked bets + your slip */}
              {phase === "post_parade" && (
                <div className="p-5 rounded-2xl text-center space-y-3" style={{ background: BG_CARD, border: `1.5px solid ${BORDER}` }}>
                  <Lock className="w-6 h-6 mx-auto" style={{ color: ORANGE }} />
                  <p className="text-sm font-bold" style={{ color: TEXT }}>Bets Locked — Horses Loading</p>
                  <p className="text-xs" style={{ color: TEXT_SEC }}>
                    {bets.length > 0 ? `${bets.length} bet${bets.length > 1 ? "s" : ""} on your slip` : "No bets placed this race"}
                  </p>
                  {bets.length > 0 && (
                    <div className="space-y-1 text-left">
                      {bets.map((bet) => (
                        <div key={bet.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                          style={{ background: BG_WHITE, border: `1px solid ${BORDER}` }}>
                          <span className="font-semibold px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${GOLD}10`, color: GOLD }}>{BET_TYPE_CONFIG[bet.type].label}</span>
                          <span className="flex-1 truncate px-2" style={{ color: TEXT }}>{bet.horseNames.join(" → ")}</span>
                          <span className="font-mono font-bold" style={{ color: TEXT }}>${bet.totalCost}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RACING: live running order — reorders as positions change */}
              {phase === "racing" && (
                <div className="p-4 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                      <Zap className="w-4 h-4" style={{ color: GOLD }} />
                    </motion.div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT }}>Running Order</span>
                    <span className="ml-auto text-[10px] font-mono font-bold" style={{ color: GOLD }}>
                      {replayData ? `${(Math.min(1, (RACING_DURATION - timer) / RACING_DURATION) * race.distance).toFixed(1)}f / ${race.distance}f` : ""}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {replayData && (() => {
                      const prog = Math.min(1, (RACING_DURATION - timer) / RACING_DURATION);
                      const nHorses = race.horses.length;
                      const horsesWithPos = replayData.horses.map((h: { name: string; finish: number; gates: { g: number; p: number; spd: number }[] }, i: number) => {
                        const cur = prog * race.distance;
                        let pos = h.finish;
                        for (let gi = 0; gi < h.gates.length - 1; gi++) {
                          if (h.gates[gi].g <= cur && h.gates[gi + 1].g >= cur) {
                            const t = (cur - h.gates[gi].g) / (h.gates[gi + 1].g - h.gates[gi].g || 1);
                            pos = Math.round(h.gates[gi].p + (h.gates[gi + 1].p - h.gates[gi].p) * t);
                            break;
                          }
                        }
                        return { name: h.name, color: replayData.colors[i] || race.horses[i]?.color || "#888", pos };
                      }).sort((a: { pos: number }, b: { pos: number }) => a.pos - b.pos);

                      return horsesWithPos.map((h, rank) => (
                        <motion.div
                          key={h.name}
                          layout
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="flex items-center gap-2 px-2 py-1 rounded"
                          style={{ background: rank === 0 ? `${GOLD}08` : "transparent" }}
                        >
                          <span className="text-[10px] font-bold w-4 text-right font-mono" style={{ color: rank < 3 ? GOLD : TEXT_MUTED }}>
                            {rank + 1}
                          </span>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: h.color }} />
                          <span className="text-[11px] font-semibold truncate" style={{ color: rank === 0 ? GOLD : rank < 3 ? TEXT : TEXT_SEC }}>
                            {h.name}
                          </span>
                        </motion.div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* RESULTS: finish order + bet outcomes */}
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

              {/* YOUR BETS — persistent across post_parade, racing, results */}
              {phase !== "betting" && (
                <div className="p-4 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="w-4 h-4" style={{ color: GOLD }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_SEC }}>
                      Your Bets This Race
                    </span>
                    <span className="ml-auto text-[10px] font-mono font-bold" style={{ color: TEXT_MUTED }}>
                      ${bets.reduce((s, b) => s + b.totalCost, 0)} wagered
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {bets.length === 0 && (
                      <div className="text-center py-3 rounded-lg" style={{ background: BG_CARD }}>
                        <p className="text-xs" style={{ color: TEXT_MUTED }}>No bets placed this race</p>
                        {user && user.history.length > 0 && (
                          <p className="text-[10px] mt-1" style={{ color: user.history[user.history.length - 1].profit >= 0 ? GREEN : RED }}>
                            Last race: {user.history[user.history.length - 1].profit >= 0 ? "+" : ""}
                            ${user.history[user.history.length - 1].profit}
                          </p>
                        )}
                      </div>
                    )}
                    {bets.map((bet) => {
                      const result = betResults.find((r) => r.bet.id === bet.id);
                      return (
                        <div
                          key={bet.id}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                          style={{
                            background: result ? (result.won ? `${GREEN}06` : `${RED}04`) : BG_CARD,
                            border: `1.5px solid ${result ? (result.won ? GREEN : `${RED}40`) : BORDER}`,
                          }}
                        >
                          {result && (
                            <div className="shrink-0">
                              {result.won ? (
                                <Check className="w-4 h-4" style={{ color: GREEN }} />
                              ) : (
                                <X className="w-4 h-4" style={{ color: RED }} />
                              )}
                            </div>
                          )}
                          <span
                            className="font-semibold px-1.5 py-0.5 rounded text-[10px] shrink-0"
                            style={{ background: `${GOLD}10`, color: GOLD }}
                          >
                            {BET_TYPE_CONFIG[bet.type].label}
                          </span>
                          <span className="flex-1 truncate font-medium" style={{ color: TEXT }}>
                            {bet.horseNames.join(" → ")}
                          </span>
                          {result ? (
                            <span className="font-mono font-bold shrink-0" style={{ color: result.won ? GREEN : RED }}>
                              {result.won ? `+$${(result.payout - bet.totalCost).toLocaleString()}` : `-$${bet.totalCost}`}
                            </span>
                          ) : (
                            <span className="font-mono font-bold shrink-0" style={{ color: TEXT }}>${bet.totalCost}</span>
                          )}
                        </div>
                      );
                    })}
                    {/* Net P&L during results */}
                    {phase === "results" && betResults.length > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg mt-1"
                        style={{
                          background: (totalWinnings - totalWagered) >= 0 ? `${GREEN}08` : `${RED}06`,
                          border: `1.5px solid ${(totalWinnings - totalWagered) >= 0 ? GREEN : RED}`,
                        }}>
                        <span className="text-xs font-semibold" style={{ color: TEXT }}>Race P&L</span>
                        <span className="font-mono font-bold text-sm" style={{ color: (totalWinnings - totalWagered) >= 0 ? GREEN : RED }}>
                          {(totalWinnings - totalWagered) >= 0 ? "+" : ""}{(totalWinnings - totalWagered).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ──── Center: Race Track (hidden during betting, 5 cols otherwise) ──── */}
            <div className={`${phase === "betting" ? "hidden" : "lg:col-span-5"}`}>
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

                {/* Live race view during racing + results */}
                {(phase === "racing" || phase === "results") && replayData && (
                  <ErrorBoundary section="Race Visualization">
                    <LiveRaceView
                      horses={replayData.horses}
                      colors={replayData.colors}
                      distance={race.distance}
                      progress={phase === "results" ? 1 : Math.min(1, (RACING_DURATION - timer) / RACING_DURATION)}
                      isRacing={phase === "racing"}
                      isFinished={phase === "results"}
                    />
                  </ErrorBoundary>
                )}

                {/* No content during betting — center column is hidden */}
              </div>
            </div>

            {/* ──── Right: Sticky sidebar with all competition info ──── */}
            <div className="lg:col-span-3">
              <div className="sticky top-20 space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {/* Compact player card + bankroll */}
                {user && (
                  <div className="p-3 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: `${GOLD}20`, color: GOLD, border: `2px solid ${GOLD}40` }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: TEXT }}>{user.name}</div>
                        <div className="text-[10px]" style={{ color: TEXT_MUTED }}>
                          {user.school && <>{user.school}</>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold font-mono" style={{ color: GOLD }}>
                          <AnimatedBalance value={
                            phase === "betting" || phase === "post_parade" || phase === "racing"
                              ? user.bankroll - bets.reduce((s, b) => s + b.totalCost, 0)
                              : user.bankroll
                          } />
                        </div>
                        {phase === "results" && betResults.length > 0 ? (
                          <div className="text-[9px] font-mono font-bold" style={{ color: (totalWinnings - totalWagered) >= 0 ? GREEN : RED }}>
                            {(totalWinnings - totalWagered) >= 0 ? "+" : ""}{totalWinnings - totalWagered} this race
                          </div>
                        ) : bets.length > 0 && phase !== "results" ? (
                          <div className="text-[9px] font-mono" style={{ color: ORANGE }}>
                            ${bets.reduce((s, b) => s + b.totalCost, 0)} wagered
                          </div>
                        ) : (
                          <div className="text-[9px] font-mono" style={{ color: user.totalProfit >= 0 ? GREEN : RED }}>
                            {user.totalProfit >= 0 ? "+" : ""}{user.totalProfit} profit
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compact stats row */}
                    <div className="flex gap-1.5 mb-2">
                      <div className="flex-1 py-1.5 rounded-lg text-center" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                        <div className="text-[9px] uppercase" style={{ color: TEXT_MUTED }}>Races</div>
                        <div className="text-xs font-bold font-mono" style={{ color: TEXT }}>{user.racesPlayed}</div>
                      </div>
                      <div className="flex-1 py-1.5 rounded-lg text-center" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                        <div className="text-[9px] uppercase" style={{ color: TEXT_MUTED }}>Best Win</div>
                        <div className="text-xs font-bold font-mono" style={{ color: GOLD }}>${user.biggestWin}</div>
                      </div>
                      <div className="flex-1 py-1.5 rounded-lg text-center" style={{
                        background: bets.length > 0 && phase !== "results" ? `${GOLD}08` : BG_CARD,
                        border: `1px solid ${bets.length > 0 && phase !== "results" ? `${GOLD}30` : BORDER}`,
                      }}>
                        <div className="text-[9px] uppercase" style={{ color: TEXT_MUTED }}>
                          {bets.length > 0 && phase !== "results" ? "Bets" : "Next Race"}
                        </div>
                        <div className="text-xs font-bold font-mono" style={{
                          color: bets.length > 0 && phase !== "results" ? GOLD : BLUE,
                        }}>
                          {bets.length > 0 && phase !== "results"
                            ? `${bets.length} slip${bets.length > 1 ? "s" : ""}`
                            : formatTimer(Math.max(0, Math.ceil(CYCLE_DURATION - getTimeInCycle())))
                          }
                        </div>
                      </div>
                    </div>

                    {/* Phase stepper */}
                    <div className="flex items-center gap-0.5">
                      {(["betting", "post_parade", "racing", "results"] as Phase[]).map((p, idx) => {
                        const labels = ["Bet", "Post", "Race", "Results"];
                        const isActive = p === phase;
                        const isPast = ["betting", "post_parade", "racing", "results"].indexOf(phase) > idx;
                        const stepColor = isActive ? phaseBadgeColor : isPast ? GOLD : TEXT_MUTED;
                        return (
                          <div key={p} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className={`w-full h-1 rounded-full ${isActive ? "animate-stepper-pulse" : ""}`}
                              style={{ background: isActive ? stepColor : isPast ? `${GOLD}40` : BORDER }}
                            />
                            <span className="text-[7px] font-semibold uppercase" style={{ color: isActive ? stepColor : TEXT_MUTED }}>
                              {labels[idx]}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Busted message — no reset */}
                    {user.bankroll <= 0 && (
                      <div className="mt-2 py-2 rounded-lg text-center text-xs font-bold" style={{ background: `${RED}10`, color: RED, border: `1px solid ${RED}25` }}>
                        Bankroll depleted — game over
                      </div>
                    )}
                  </div>
                )}

                {/* Your race history — compact P&L per race */}
                {user && user.history.length > 0 && (
                  <div className="p-3 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TEXT_SEC }}>
                        Your Race History
                      </span>
                      <span className="ml-auto text-[9px] font-mono" style={{ color: TEXT_MUTED }}>
                        {user.history.filter(h => h.profit > 0).length}W-{user.history.filter(h => h.profit < 0).length}L
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {user.history.slice(-12).map((h, i) => (
                        <div
                          key={i}
                          className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold"
                          style={{
                            background: h.profit > 0 ? `${GREEN}12` : h.profit < 0 ? `${RED}10` : `${TEXT_MUTED}10`,
                            color: h.profit > 0 ? GREEN : h.profit < 0 ? RED : TEXT_MUTED,
                          }}
                        >
                          {h.profit > 0 ? `+${h.profit}` : h.profit < 0 ? `${h.profit}` : "0"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leaderboard — always visible, most important */}
                <div className="p-3 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                  <ErrorBoundary section="Leaderboard">
                    <SharedLeaderboard
                      entries={leaderboard}
                      schoolStandings={schoolStandings}
                      currentUserId={user?.id}
                      connected={lbConnected}
                      loading={lbLoading}
                    />
                  </ErrorBoundary>
                </div>

                {/* Recent Wins — live social proof */}
                {recentWins.length > 0 && (
                  <div className="p-3 rounded-2xl" style={{ background: BG_WHITE, border: `1.5px solid ${BORDER}` }}>
                    <LiveActivityFeed wins={recentWins} />
                  </div>
                )}

                {/* Switch account */}
                {user && (
                  <button
                    onClick={() => setShowNameEntry(true)}
                    className="w-full py-2 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1"
                    style={{ color: TEXT_MUTED, background: BG_WHITE, border: `1px solid ${BORDER}` }}
                  >
                    <LogIn className="w-3 h-3" />
                    Switch Account
                  </button>
                )}
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
            <p className="text-sm" style={{ color: TEXT_MUTED }}>Generating race card...</p>
          </div>
        )}
      </div>
    </main>
  );
}
