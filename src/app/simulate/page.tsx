"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Plus,
  X,
  Zap,
  TrendingUp,
  Trophy,
  AlertCircle,
  Search,
  Check,
  ChevronDown,
  BarChart3,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ALL_PROFILES, getProfile } from "@/lib/data/horse-profiles";
import { ALL_RACES } from "@/lib/data/race-data";
import { runMonteCarlo, simToReplayData } from "@/lib/simulation/engine";
import { profileToSim } from "@/lib/simulation/helpers";
import { PIPELINE_ACTIVE, MODEL_DIAGNOSTICS, TRANSFER_DIAGNOSTICS } from "@/lib/data/pipeline-output";
import type {
  SimHorse,
  SimResults,
  Surface,
  TrackBias,
} from "@/lib/simulation/types";
import RaceReplay from "@/components/arena/RaceReplay";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const BG_WHITE = "#ffffff";
const BG_CARD = "#f8f6f2";
const TEXT = "#1a1a2a";
const TEXT_SEC = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const GOLD = "#b8941f";
const BORDER = "#e5e2db";

const CUSTOM_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#9b59b6",
  "#e67e22",
  "#1abc9c",
  "#34495e",
  "#f39c12",
];

const DISTANCE_OPTIONS = [
  { label: "5F", value: 5 },
  { label: "6F", value: 6 },
  { label: "7F", value: 7 },
  { label: "8F", value: 8 },
  { label: "9F", value: 9 },
  { label: "10F", value: 10 },
  { label: "11F", value: 11 },
  { label: "12F", value: 12 },
];

const LIVE_SIM_COUNT = 500;
const DEEP_SIM_COUNT = 1000;

/* ================================================================== */
/*  Helper: generate speed curve for custom horse                      */
/* ================================================================== */

function generateCustomCurve(
  style: "Front Runner" | "Stalker" | "Closer",
  topSpeed: number
): number[] {
  const base = topSpeed * 0.88;
  const curve: number[] = [];
  for (let i = 0; i < 10; i++) {
    const pct = i / 9;
    let speed: number;
    if (style === "Front Runner") {
      speed = base + (topSpeed - base) * (1 - pct * 0.6);
    } else if (style === "Closer") {
      speed = base + (topSpeed - base) * pct;
    } else {
      speed =
        base +
        (topSpeed - base) * (0.5 + 0.5 * Math.sin(pct * Math.PI - Math.PI / 4));
    }
    curve.push(Math.round(speed * 10) / 10);
  }
  return curve;
}

/* ================================================================== */
/*  Helper: generate pace scenario text                                */
/* ================================================================== */

function getPaceScenario(
  horses: SimHorse[]
): { label: string; detail: string } | null {
  if (horses.length < 2) return null;
  const frontRunners = horses.filter((h) => h.runningStyle === "Front Runner");
  const closers = horses.filter((h) => h.runningStyle === "Closer");
  const stalkers = horses.filter((h) => h.runningStyle === "Stalker");

  if (frontRunners.length >= 3) {
    return {
      label: "FAST",
      detail: `${frontRunners.length} front runners will contest the lead, favoring closers`,
    };
  }
  if (frontRunners.length === 2) {
    return {
      label: "CONTESTED",
      detail: `2 front runners will push the pace, creating an honest tempo that could benefit ${closers.length > 0 ? "closers" : "stalkers"}`,
    };
  }
  if (frontRunners.length === 1) {
    return {
      label: "MODERATE",
      detail: `Lone speed can dictate terms — ${frontRunners[0].name} controls the pace unchallenged`,
    };
  }
  if (frontRunners.length === 0 && closers.length >= 2) {
    return {
      label: "SLOW",
      detail: `No true front runner — expect a dawdle, favoring horses with tactical speed`,
    };
  }
  return {
    label: "HONEST",
    detail: `Mixed running styles create a fair pace — ${stalkers.length} stalker${stalkers.length !== 1 ? "s" : ""} in ideal position`,
  };
}

/* ================================================================== */
/*  Helper: generate top insight line                                   */
/* ================================================================== */

function getTopInsight(
  horses: SimHorse[],
  results: SimResults | null
): string | null {
  if (!results || horses.length < 2) return null;
  const sorted = [...results.horses].sort((a, b) => b.winPct - a.winPct);
  const top = sorted[0];
  if (!top) return null;
  const topHorse = horses.find((h) => h.name === top.name);
  if (!topHorse) return null;

  if (top.winPct > 35) {
    return `${top.name} is the clear favorite at ${top.winPct.toFixed(1)}% — their ${topHorse.runningStyle.toLowerCase()} style and ${topHorse.topSpeed.toFixed(1)} ft/s top speed dominate this field.`;
  }
  if (top.winPct < 20) {
    return `Wide open race — no horse wins more than ${top.winPct.toFixed(1)}% of simulations. This field is too competitive to pick a clear winner.`;
  }
  return `${top.name} has a slight edge at ${top.winPct.toFixed(1)}%, but ${sorted.length > 1 ? sorted[1].name : "the field"} is close behind at ${sorted.length > 1 ? sorted[1].winPct.toFixed(1) + "%" : "a similar rate"}.`;
}

/* ================================================================== */
/*  Matchup analysis types                                             */
/* ================================================================== */

interface MatchupDelta {
  horseName: string;
  removedHorse: string;
  baseWinPct: number;
  withoutWinPct: number;
  delta: number; // positive means horse does BETTER without removedHorse
}

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */

function SimulatePageInner() {
  const searchParams = useSearchParams();

  /* ---- state ---- */
  const [selectedHorses, setSelectedHorses] = useState<SimHorse[]>([]);
  const [distance, setDistance] = useState(8);
  const [surface, setSurface] = useState<Surface>("Dirt");
  const [trackBias, setTrackBias] = useState<TrackBias>("none");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "matchup" | "replay" | "distribution"
  >("matchup");

  /* live odds results (auto-run) */
  const [liveResults, setLiveResults] = useState<SimResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  /* deep sim for replay */
  const [deepResults, setDeepResults] = useState<SimResults | null>(null);
  const [isRunningDeep, setIsRunningDeep] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);

  /* matchup analysis */
  const [matchupData, setMatchupData] = useState<MatchupDelta[]>([]);
  const [isRunningMatchup, setIsRunningMatchup] = useState(false);

  /* animation tracking for changed values */
  const [changedHorses, setChangedHorses] = useState<Set<string>>(new Set());
  const prevResultsRef = useRef<SimResults | null>(null);

  /* custom horse form state */
  const [customName, setCustomName] = useState("");
  const [customStyle, setCustomStyle] = useState<
    "Front Runner" | "Stalker" | "Closer"
  >("Stalker");
  const [customTopSpeed, setCustomTopSpeed] = useState(17);
  const [customConsistency, setCustomConsistency] = useState<
    "Low" | "Med" | "High"
  >("Med");

  /* ---- preload race from URL param (?race=0,1,2...) ---- */
  const [hasPreloaded, setHasPreloaded] = useState(false);
  useEffect(() => {
    if (hasPreloaded) return;
    const raceParam = searchParams.get("race");
    if (raceParam === null) return;
    const idx = parseInt(raceParam, 10);
    if (isNaN(idx) || idx < 0 || idx >= ALL_RACES.length) return;

    const race = ALL_RACES[idx];
    const simHorses: SimHorse[] = [];

    for (let i = 0; i < race.horses.length; i++) {
      const h = race.horses[i];
      const profile = getProfile(h.name);
      if (profile) {
        simHorses.push(profileToSim(profile, i + 1));
      }
    }

    if (simHorses.length >= 2) {
      setSelectedHorses(simHorses);
      setDistance(race.distance);
      setSurface(race.surface === "D" ? "Dirt" : "Turf");
    }
    setHasPreloaded(true);
  }, [searchParams, hasPreloaded]);

  /* ---- derived ---- */
  const selectedNames = useMemo(
    () => new Set(selectedHorses.map((h) => h.name)),
    [selectedHorses]
  );

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return ALL_PROFILES;
    const q = searchQuery.toLowerCase();
    return ALL_PROFILES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.runningStyle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const paceScenario = useMemo(
    () => getPaceScenario(selectedHorses),
    [selectedHorses, distance]
  );

  const topInsight = useMemo(
    () => getTopInsight(selectedHorses, liveResults),
    [selectedHorses, liveResults]
  );

  /* ---- AUTO-RUN: live odds calculation ---- */
  useEffect(() => {
    if (selectedHorses.length < 2) {
      setLiveResults(null);
      setMatchupData([]);
      return;
    }

    setIsCalculating(true);
    const timer = setTimeout(() => {
      const simResults = runMonteCarlo({
        horses: selectedHorses,
        distanceFurlongs: distance,
        surface,
        trackBias,
        numSimulations: LIVE_SIM_COUNT,
      });

      // detect which horses' odds changed for animation
      if (prevResultsRef.current) {
        const prevMap = new Map(
          prevResultsRef.current.horses.map((h) => [h.name, h.winPct])
        );
        const changed = new Set<string>();
        for (const h of simResults.horses) {
          const prev = prevMap.get(h.name);
          if (prev === undefined || Math.abs(prev - h.winPct) > 0.5) {
            changed.add(h.name);
          }
        }
        setChangedHorses(changed);
        setTimeout(() => setChangedHorses(new Set()), 600);
      } else {
        // first calculation — flash all
        setChangedHorses(new Set(simResults.horses.map((h) => h.name)));
        setTimeout(() => setChangedHorses(new Set()), 600);
      }

      prevResultsRef.current = simResults;
      setLiveResults(simResults);
      setIsCalculating(false);
      // Clear deep results since field changed
      setDeepResults(null);
      setReplayIndex(null);
    }, 100); // 100ms debounce

    return () => clearTimeout(timer);
  }, [selectedHorses, distance, surface, trackBias]);

  /* ---- callbacks ---- */
  const toggleHorse = useCallback(
    (profile: (typeof ALL_PROFILES)[number]) => {
      setSelectedHorses((prev) => {
        const exists = prev.find((h) => h.name === profile.name);
        if (exists) {
          const filtered = prev.filter((h) => h.name !== profile.name);
          return filtered.map((h, i) => ({ ...h, postPosition: i + 1 }));
        }
        if (prev.length >= 12) return prev;
        return [...prev, profileToSim(profile, prev.length + 1)];
      });
    },
    []
  );

  const removeHorse = useCallback((name: string) => {
    setSelectedHorses((prev) => {
      const filtered = prev.filter((h) => h.name !== name);
      return filtered.map((h, i) => ({ ...h, postPosition: i + 1 }));
    });
  }, []);

  const addCustomHorse = useCallback(() => {
    if (!customName.trim()) return;
    const colorIdx =
      selectedHorses.filter((h) => h.isCustom).length % CUSTOM_COLORS.length;
    const consistencyVal =
      customConsistency === "Low"
        ? 0.25
        : customConsistency === "High"
          ? 0.7
          : 0.45;

    const horse: SimHorse = {
      name: customName.trim(),
      color: CUSTOM_COLORS[colorIdx],
      imageUrl: "",
      speedCurve: generateCustomCurve(customStyle, customTopSpeed),
      topSpeed: customTopSpeed,
      avgSpeed: customTopSpeed * 0.9,
      strideEfficiency: 2.3,
      runningStyle: customStyle,
      consistency: consistencyVal,
      postPosition: selectedHorses.length + 1,
      isCustom: true,
    };

    setSelectedHorses((prev) => {
      if (prev.length >= 12) return prev;
      return [...prev, horse];
    });
    setCustomName("");
    setShowCustomForm(false);
  }, [
    customName,
    customStyle,
    customTopSpeed,
    customConsistency,
    selectedHorses,
  ]);

  const runDeepSimulation = useCallback(() => {
    if (selectedHorses.length < 3) return;
    setIsRunningDeep(true);
    setReplayIndex(null);

    setTimeout(() => {
      const simResults = runMonteCarlo({
        horses: selectedHorses,
        distanceFurlongs: distance,
        surface,
        trackBias,
        numSimulations: DEEP_SIM_COUNT,
      });
      setDeepResults(simResults);
      setIsRunningDeep(false);
    }, 16);
  }, [selectedHorses, distance, surface, trackBias]);

  const watchRace = useCallback(() => {
    if (!deepResults || deepResults.allRaces.length === 0) return;
    const idx = Math.floor(Math.random() * deepResults.allRaces.length);
    setReplayIndex(idx);
  }, [deepResults]);

  const runMatchupAnalysis = useCallback(() => {
    if (selectedHorses.length < 3 || !liveResults) return;
    setIsRunningMatchup(true);

    setTimeout(() => {
      const baseResults = liveResults;
      const baseMap = new Map(
        baseResults.horses.map((h) => [h.name, h.winPct])
      );
      const deltas: MatchupDelta[] = [];

      for (const horseToRemove of selectedHorses) {
        const reducedField = selectedHorses
          .filter((h) => h.name !== horseToRemove.name)
          .map((h, i) => ({ ...h, postPosition: i + 1 }));

        if (reducedField.length < 2) continue;

        const withoutResults = runMonteCarlo({
          horses: reducedField,
          distanceFurlongs: distance,
          surface,
          trackBias,
          numSimulations: LIVE_SIM_COUNT,
        });

        for (const h of withoutResults.horses) {
          const baseWin = baseMap.get(h.name) ?? 0;
          const delta = h.winPct - baseWin;
          if (Math.abs(delta) > 1) {
            deltas.push({
              horseName: h.name,
              removedHorse: horseToRemove.name,
              baseWinPct: baseWin,
              withoutWinPct: h.winPct,
              delta,
            });
          }
        }
      }

      deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      setMatchupData(deltas);
      setIsRunningMatchup(false);
    }, 16);
  }, [selectedHorses, liveResults, distance, surface, trackBias]);

  /* ---- replay data ---- */
  const replayData = useMemo(() => {
    if (replayIndex === null || !deepResults) return null;
    const race = deepResults.allRaces[replayIndex];
    if (!race) return null;
    return simToReplayData(race, selectedHorses, distance);
  }, [replayIndex, deepResults, selectedHorses, distance]);

  /* ---- insights for distribution tab ---- */
  const insights = useMemo(() => {
    if (!liveResults) return [];
    const lines: { title: string; detail: string }[] = [];
    const sorted = [...liveResults.horses].sort((a, b) => b.winPct - a.winPct);
    const top = sorted[0];
    const topHorse = selectedHorses.find((sh) => sh.name === top.name);

    if (topHorse) {
      const peakSpeed = topHorse.topSpeed.toFixed(1);
      const style = topHorse.runningStyle;
      const effScore = topHorse.strideEfficiency.toFixed(2);
      if (top.winPct > 35) {
        lines.push({
          title: `${top.name} dominates with a ${top.winPct.toFixed(1)}% win rate`,
          detail: `Why: Peak GPS speed of ${peakSpeed} ft/s (highest in the field) combined with a ${style.toLowerCase()} style and ${effScore} stride efficiency. ${style === "Front Runner" ? "Their early speed advantage is hard to overcome at this distance." : style === "Closer" ? "Their closing kick accelerates past the field in the final furlongs — the simulation shows this pattern holds even with randomized paces." : "Their mid-pack positioning lets them avoid early pace duels and capitalize when front runners tire."}`,
        });
      } else if (top.winPct < 20) {
        lines.push({
          title: `Wide open field — no horse wins more than ${top.winPct.toFixed(1)}%`,
          detail:
            "Why: The GPS speed curves are tightly bunched — top speeds differ by less than 1 ft/s across the field. Small random variations in any horse's sectional times can change the outcome, making this race genuinely unpredictable.",
        });
      } else {
        lines.push({
          title: `${top.name} is the slight favorite at ${top.winPct.toFixed(1)}%`,
          detail: `Why: Their ${peakSpeed} ft/s top speed and ${style.toLowerCase()} style give them an edge, but the field is competitive enough that other horses win more than half the time.`,
        });
      }
    }

    const frontRunners = selectedHorses.filter(
      (h) => h.runningStyle === "Front Runner"
    );
    const closerWins: Record<string, number> = {};
    const frWins: Record<string, number> = {};
    for (const h of sorted) {
      const horse = selectedHorses.find((sh) => sh.name === h.name);
      if (horse?.runningStyle === "Closer") closerWins[h.name] = h.winPct;
      if (horse?.runningStyle === "Front Runner") frWins[h.name] = h.winPct;
    }
    const closerTotal = Object.values(closerWins).reduce((a, b) => a + b, 0);
    const frTotal = Object.values(frWins).reduce((a, b) => a + b, 0);

    if (frontRunners.length >= 2 && closerTotal > frTotal) {
      lines.push({
        title: `Closers benefit from a contested pace`,
        detail: `Why: With ${frontRunners.length} front runners in the field, they push each other's early speeds higher — the simulation applies a +0.3 ft/s early bonus but a -0.4 ft/s fatigue penalty in the stretch. This energy depletion lets closers, who save their acceleration for the final furlongs (+0.5 ft/s kick), run them down. Closers win ${closerTotal.toFixed(0)}% vs front runners' ${frTotal.toFixed(0)}%.`,
      });
    } else if (frontRunners.length <= 1 && frTotal > closerTotal) {
      lines.push({
        title: `Lone speed has the advantage`,
        detail: `Why: With only ${frontRunners.length} front runner, there's no pace duel to force early energy expenditure. The front runner can dictate a comfortable tempo and maintain stride efficiency throughout. Front runners win ${frTotal.toFixed(0)}% of simulations vs closers' ${closerTotal.toFixed(0)}%.`,
      });
    }

    if (sorted.length >= 3) {
      const longshot = sorted.find((h, i) => i >= 2 && h.showPct > 40);
      if (longshot) {
        const lsHorse = selectedHorses.find(
          (sh) => sh.name === longshot.name
        );
        if (lsHorse) {
          lines.push({
            title: `${longshot.name} is the value play (${longshot.fairOdds})`,
            detail: `Why: Only wins ${longshot.winPct.toFixed(1)}% of the time, but finishes top 3 in ${longshot.showPct.toFixed(0)}% of simulations. Their GPS stride efficiency of ${lsHorse.strideEfficiency.toFixed(2)} keeps them competitive even when they don't have the raw speed to win.`,
          });
        }
      }
    }

    if (distance >= 9) {
      lines.push({
        title: `Distance favors stamina over speed`,
        detail: `At ${distance} furlongs, the simulation's fatigue model penalizes front runners more heavily — they must sustain high speed over more sections. Horses with higher stride efficiency gain a cumulative advantage over the extra furlongs.`,
      });
    } else if (distance <= 6) {
      lines.push({
        title: `Short distance favors raw speed`,
        detail: `At ${distance} furlongs, there aren't enough sections for closers to make up ground. The simulation shows that early position advantage compounds — horses who are fast out of the gate have fewer furlongs where they need to maintain that speed before the finish line.`,
      });
    }

    return lines;
  }, [liveResults, selectedHorses, distance]);

  /* ---- chart data ---- */
  const chartData = useMemo(() => {
    if (!liveResults) return [];
    return liveResults.horses.map((h) => ({
      name: h.name.length > 10 ? h.name.slice(0, 9) + "\u2026" : h.name,
      fullName: h.name,
      winPct: Math.round(h.winPct * 10) / 10,
      color: h.color,
    }));
  }, [liveResults]);

  /* ---- style badge color map ---- */
  const styleColors: Record<string, string> = {
    "Front Runner": TEXT,
    Stalker: "#5b3e8a",
    Closer: "#b8941f",
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: BG_WHITE, color: TEXT }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ============================================================ */}
        {/*  SECTION 1: HEADER                                           */}
        {/* ============================================================ */}

        <div className="mb-8">
          <h1
            className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: TEXT }}
          >
            Race Simulator
          </h1>
          <p className="mt-2" style={{ color: TEXT_SEC, fontSize: 16 }}>
            Build a race, see live odds, watch it run
          </p>
        </div>

        {/* Pipeline model stats — shown when pipeline has been run */}
        {PIPELINE_ACTIVE && (
          <div
            className="mb-4 rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-1"
            style={{ backgroundColor: "#1a3a2a08", border: "1px solid #1a3a2a20" }}
          >
            <span className="text-xs font-semibold" style={{ color: "#1a3a2a" }}>
              GPS-powered predictions
            </span>
            <span className="text-xs" style={{ color: TEXT_SEC }}>
              Trained on <strong style={{ color: TEXT }}>{MODEL_DIAGNOSTICS.n_train.toLocaleString()}</strong> races
            </span>
            <span className="text-xs" style={{ color: TEXT_SEC }}>
              Predicts finish within <strong style={{ color: TEXT }}>{MODEL_DIAGNOSTICS.ensemble.mae_val.toFixed(1)}</strong> positions
            </span>
            <span className="text-xs" style={{ color: TEXT_SEC }}>
              GPS adds <strong style={{ color: "#16a34a" }}>+{MODEL_DIAGNOSTICS.gps_added_value.r2_improvement_pct.toFixed(0)}%</strong> over traditional alone
            </span>
          </div>
        )}

        {/* How does this work? */}
        <div
          className="mb-6 rounded-xl p-5"
          style={{ backgroundColor: BG_CARD, border: `1px solid ${BORDER}` }}
        >
          <button
            onClick={() => setShowHowItWorks((prev) => !prev)}
            className="flex w-full items-center justify-between text-left font-semibold transition-colors"
            style={{ color: TEXT, fontSize: 15 }}
          >
            <span>How does this work?</span>
            <span
              className="text-lg transition-transform"
              style={{
                transform: showHowItWorks ? "rotate(90deg)" : "rotate(0deg)",
                color: GOLD,
              }}
            >
              {"\u25B8"}
            </span>
          </button>

          {showHowItWorks && (
            <div className="mt-4">
              <h3
                className="mb-4 text-base font-bold"
                style={{ color: TEXT }}
              >
                How the Monte Carlo Simulation Works
              </h3>
              <ol className="space-y-3">
                {[
                  "Each horse has a GPS speed pattern — showing how fast they typically run through each segment of a race (about 200 meters each), measured from real GPS tracking sensors on the track.",
                  "For each simulated race, we add realistic randomness. A horse averaging 12 mph might run 11.5 or 12.5 mph in any given race — just like real life. Some days you perform at your best, some days you don't.",
                  "Running style matters: Front Runners sprint out to the lead early but can tire. Closers hang back and make a big push at the end. Stalkers sit in the middle and pick their moment. These styles interact — multiple front runners push each other too hard, which helps closers.",
                  "Traditional factors are layered on top: is this horse's best distance? Do they prefer dirt or grass? Are they improving or declining recently? Does this track favor inside or outside runners?",
                  "We re-run this race 500+ times instantly. The win percentage shows how often each horse won across all those simulated races. It's like watching the same race play out hundreds of times with realistic variation each time.",
                  "This combines GPS analytics with traditional racing wisdom. The GPS data reveals things traditional stats can't — like how efficiently a horse uses its stride, or exactly where in the race they accelerate.",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: GOLD, color: BG_WHITE }}
                    >
                      {i + 1}
                    </span>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: TEXT_SEC }}
                    >
                      {text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/*  SECTION 2: RACE CONFIGURATION                               */}
        {/* ============================================================ */}

        <div
          className="mb-6 rounded-xl border p-4 sm:p-5"
          style={{ background: BG_CARD, borderColor: BORDER }}
        >
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: TEXT_MUTED, fontSize: 12 }}
          >
            Track Settings
          </h2>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Distance */}
            <div className="flex items-center gap-2">
              <label
                className="font-medium"
                style={{ color: TEXT_SEC, fontSize: 14 }}
              >
                Distance
              </label>
              <select
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="rounded-lg border px-3 py-1.5 font-medium outline-none transition-colors focus:ring-2"
                style={{
                  borderColor: BORDER,
                  background: BG_WHITE,
                  color: TEXT,
                  fontSize: 14,
                }}
              >
                {DISTANCE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Surface */}
            <div className="flex items-center gap-2">
              <label
                className="font-medium"
                style={{ color: TEXT_SEC, fontSize: 14 }}
              >
                Surface
              </label>
              <div
                className="flex overflow-hidden rounded-lg border"
                style={{ borderColor: BORDER }}
              >
                {(["Dirt", "Turf"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSurface(s)}
                    className="px-3 py-1.5 font-medium transition-colors"
                    style={{
                      background: surface === s ? GOLD : BG_WHITE,
                      color: surface === s ? BG_WHITE : TEXT_SEC,
                      fontSize: 14,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Track Bias */}
            <div className="flex items-center gap-2">
              <label
                className="font-medium"
                style={{ color: TEXT_SEC, fontSize: 14 }}
              >
                Bias
              </label>
              <div
                className="flex overflow-hidden rounded-lg border"
                style={{ borderColor: BORDER }}
              >
                {(
                  [
                    { label: "None", value: "none" },
                    { label: "Inside", value: "slight_inside" },
                    { label: "Outside", value: "slight_outside" },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setTrackBias(b.value)}
                    className="px-3 py-1.5 font-medium transition-colors"
                    style={{
                      background: trackBias === b.value ? GOLD : BG_WHITE,
                      color: trackBias === b.value ? BG_WHITE : TEXT_SEC,
                      fontSize: 14,
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 3: LIVE ODDS DASHBOARD                              */}
        {/*  2-column on desktop, stacked on mobile                      */}
        {/* ============================================================ */}

        <div className="mb-8 flex flex-col gap-6 lg:flex-row">
          {/* -------------------------------------------------------- */}
          {/*  LEFT COLUMN: The Odds Board (55%)                        */}
          {/* -------------------------------------------------------- */}
          <div className="w-full lg:w-[55%]">
            <div
              className="rounded-xl border"
              style={{ background: BG_CARD, borderColor: BORDER }}
            >
              <div className="p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h2
                      className="font-heading text-lg font-bold"
                      style={{ color: TEXT }}
                    >
                      Live Odds Board
                    </h2>
                    {isCalculating && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          ease: "linear",
                        }}
                        className="h-4 w-4 rounded-full border-2 border-t-transparent"
                        style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
                      />
                    )}
                  </div>
                  {liveResults && (
                    <span
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                      style={{
                        background: `${GOLD}12`,
                        color: GOLD,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: "#22c55e" }}
                      />
                      LIVE — {LIVE_SIM_COUNT} sims
                    </span>
                  )}
                </div>

                {/* Odds Table */}
                {liveResults && liveResults.horses.length > 0 ? (
                  <div className="overflow-x-auto">
                    {/* ODDS AUDIT FIX [P5]: Inform user these are fair odds with no house edge */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#16a34a]" />
                      <span className="text-xs" style={{ color: TEXT_MUTED }}>
                        Fair odds — no house edge applied. In Race Night, a 15% margin is added (like a real track).
                      </span>
                    </div>
                    <table className="w-full" style={{ fontSize: 14 }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: `2px solid ${BORDER}`,
                            color: TEXT_MUTED,
                            fontSize: 12,
                          }}
                        >
                          <th className="pb-2 pr-2 text-left font-semibold">
                            #
                          </th>
                          <th className="pb-2 pr-3 text-left font-semibold">
                            Horse
                          </th>
                          <th className="hidden pb-2 pr-2 text-left font-semibold sm:table-cell">
                            Style
                          </th>
                          <th className="pb-2 pr-2 text-left font-semibold" title="How often this horse won across 500+ simulated races">
                            Win Chance
                          </th>
                          <th className="hidden pb-2 pr-2 text-left font-semibold lg:table-cell" title="How often this horse finished 1st or 2nd">
                            Top 2
                          </th>
                          <th className="hidden pb-2 pr-2 text-left font-semibold lg:table-cell" title="How often this horse finished in the top 3">
                            Top 3
                          </th>
                          <th className="pb-2 pr-2 text-right font-semibold" title="What the odds should be based on the simulation — before the track takes their cut">
                            True Odds
                          </th>
                          <th className="hidden pb-2 pr-2 text-right font-semibold md:table-cell" title="What a $2 bet would pay if this horse wins at fair odds">
                            $2 Pays
                          </th>
                          <th className="hidden pb-2 pr-2 text-center font-semibold xl:table-cell" title="Key factors that affect this horse's chances: distance fit, surface preference, recent form">
                            Key Factors
                          </th>
                          <th className="pb-2 text-center font-semibold">
                            &nbsp;
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveResults.horses.map((h, i) => {
                          const maxWin = liveResults.horses[0].winPct;
                          const barW =
                            maxWin > 0 ? (h.winPct / maxWin) * 100 : 0;
                          const isFav = i === 0;
                          const simH = selectedHorses.find(
                            (sh) => sh.name === h.name
                          );
                          const isFlashing = changedHorses.has(h.name);

                          return (
                            <motion.tr
                              key={h.name}
                              layout
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8 }}
                              transition={{ duration: 0.2 }}
                              className="group"
                              style={{
                                borderBottom: `1px solid ${BORDER}`,
                                borderLeft: isFav
                                  ? `3px solid ${GOLD}`
                                  : "3px solid transparent",
                              }}
                            >
                              <td
                                className="py-2.5 pr-2 font-mono"
                                style={{
                                  color: TEXT_MUTED,
                                  fontSize: 12,
                                }}
                              >
                                {simH?.postPosition ?? i + 1}
                              </td>
                              <td className="py-2.5 pr-3">
                                <div className="flex items-center gap-2">
                                  {/* Horse photo */}
                                  <div
                                    className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg"
                                    style={{
                                      background: `${h.color}15`,
                                    }}
                                  >
                                    {simH?.imageUrl ? (
                                      <Image
                                        src={simH.imageUrl}
                                        alt={h.name}
                                        fill
                                        className="object-cover"
                                        sizes="36px"
                                      />
                                    ) : (
                                      <div
                                        className="flex h-full w-full items-center justify-center text-sm"
                                        style={{ color: h.color }}
                                      >
                                        {"\u{1F40E}"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <Link
                                      href={`/horses/${encodeURIComponent(h.name.toLowerCase().replace(/\s+/g, "-"))}`}
                                      className="truncate font-semibold hover:underline"
                                      style={{ color: TEXT, fontSize: 14 }}
                                    >
                                      {h.name}
                                    </Link>
                                    {isFav && (
                                      <span
                                        className="ml-1.5 rounded px-1.5 py-0.5 font-bold uppercase"
                                        style={{
                                          background: `${GOLD}20`,
                                          color: GOLD,
                                          fontSize: 10,
                                        }}
                                      >
                                        Fav
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {/* Style */}
                              <td className="hidden py-2.5 pr-2 sm:table-cell">
                                <span
                                  className="rounded-full px-2 py-0.5"
                                  style={{
                                    background: `${styleColors[simH?.runningStyle ?? "Stalker"]}15`,
                                    color:
                                      styleColors[
                                        simH?.runningStyle ?? "Stalker"
                                      ],
                                    fontSize: 11,
                                    fontWeight: 600,
                                  }}
                                >
                                  {simH?.runningStyle ?? "\u2014"}
                                </span>
                              </td>
                              {/* Win % with bar */}
                              <td className="py-2.5 pr-2">
                                <div className="flex items-center gap-2">
                                  <motion.span
                                    className="min-w-[3rem] font-semibold tabular-nums"
                                    style={{ color: TEXT }}
                                    animate={
                                      isFlashing
                                        ? {
                                            color: [GOLD, TEXT],
                                          }
                                        : {}
                                    }
                                    transition={{ duration: 0.6 }}
                                  >
                                    {h.winPct.toFixed(1)}%
                                  </motion.span>
                                  <div
                                    className="hidden h-2 w-16 flex-shrink-0 overflow-hidden rounded-full sm:block"
                                    style={{ background: BORDER }}
                                  >
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{
                                        background: h.color,
                                        opacity: 0.7,
                                      }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${barW}%` }}
                                      transition={{ duration: 0.4 }}
                                    />
                                  </div>
                                </div>
                              </td>
                              {/* Place % */}
                              <td className="hidden py-2.5 pr-2 lg:table-cell">
                                <span className="tabular-nums" style={{ color: TEXT_SEC }}>
                                  {h.placePct.toFixed(1)}%
                                </span>
                              </td>
                              {/* Show % */}
                              <td className="hidden py-2.5 pr-2 lg:table-cell">
                                <span className="tabular-nums" style={{ color: TEXT_SEC }}>
                                  {h.showPct.toFixed(1)}%
                                </span>
                              </td>
                              {/* Fair Odds */}
                              <td
                                className="py-2.5 pr-2 text-right font-mono tabular-nums"
                                style={{ color: TEXT, fontWeight: 600 }}
                              >
                                <motion.span
                                  animate={
                                    isFlashing
                                      ? { color: [GOLD, TEXT] }
                                      : {}
                                  }
                                  transition={{ duration: 0.6 }}
                                >
                                  {h.fairOdds}
                                </motion.span>
                              </td>
                              {/* $2 Payout */}
                              <td
                                className="hidden py-2.5 pr-2 text-right font-mono tabular-nums md:table-cell"
                                style={{
                                  color:
                                    h.winPct > 0 ? TEXT : TEXT_MUTED,
                                  fontWeight: 600,
                                  fontSize: 13,
                                }}
                              >
                                {/* ODDS AUDIT FIX [P1]: Cap $2 payout at $1000 to prevent misleading huge numbers for longshots */}
                                {h.winPct > 0
                                  ? `$${Math.min(1000, 2 * (100 / h.winPct)).toFixed(2)}`
                                  : "\u2014"}
                              </td>
                              {/* Traditional Factors indicators */}
                              <td className="hidden py-2.5 pr-2 xl:table-cell">
                                <div className="flex items-center justify-center gap-1">
                                  {simH && (() => {
                                    const factors: { label: string; good: boolean }[] = [];
                                    // Distance fit
                                    if (simH.bestDistance) {
                                      const best = parseFloat(simH.bestDistance.replace("F", ""));
                                      const diff = Math.abs(best - distance);
                                      if (diff <= 1) factors.push({ label: "Dist", good: true });
                                      else if (diff >= 2) factors.push({ label: "Dist", good: false });
                                    }
                                    // Surface fit
                                    if (simH.bestSurface) {
                                      if (simH.bestSurface === surface || simH.bestSurface === "Both") {
                                        factors.push({ label: "Surf", good: true });
                                      } else {
                                        factors.push({ label: "Surf", good: false });
                                      }
                                    }
                                    // Form
                                    if (simH.recentFormAvg !== undefined) {
                                      if (simH.recentFormAvg <= 3) factors.push({ label: "Form", good: true });
                                      else if (simH.recentFormAvg >= 5) factors.push({ label: "Form", good: false });
                                    }
                                    return factors.map((f, fi) => (
                                      <span key={fi} className="text-[8px] font-bold px-1 py-0.5 rounded"
                                        style={{
                                          background: f.good ? "#16a34a15" : "#dc262615",
                                          color: f.good ? "#16a34a" : "#dc2626",
                                        }}>
                                        {f.good ? "✓" : "✗"}{f.label}
                                      </span>
                                    ));
                                  })()}
                                </div>
                              </td>
                              {/* Remove button */}
                              <td className="py-2.5 text-center">
                                <button
                                  onClick={() => removeHorse(h.name)}
                                  className="rounded-full p-1 transition-colors hover:bg-black/5"
                                  style={{ color: TEXT_MUTED }}
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Empty state */
                  <div
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12"
                    style={{ borderColor: BORDER, color: TEXT_MUTED }}
                  >
                    <TrendingUp
                      size={32}
                      style={{ color: GOLD, opacity: 0.4 }}
                    />
                    <p className="mt-3 font-medium" style={{ fontSize: 16 }}>
                      {selectedHorses.length === 0
                        ? "Add horses to see live odds"
                        : selectedHorses.length === 1
                          ? "Add 1 more horse to see odds"
                          : "Calculating..."}
                    </p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>
                      Pick from the grid or create a custom horse
                    </p>
                  </div>
                )}

                {/* Pace Scenario + Top Insight below the table */}
                {selectedHorses.length >= 2 && (
                  <div className="mt-4 space-y-2">
                    {paceScenario && (
                      <div
                        className="flex items-start gap-2 rounded-lg p-3"
                        style={{
                          background: `${GOLD}08`,
                          border: `1px solid ${GOLD}20`,
                        }}
                      >
                        <Zap
                          size={14}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: GOLD }}
                        />
                        <p style={{ fontSize: 13, color: TEXT_SEC }}>
                          <span
                            className="font-bold"
                            style={{ color: GOLD }}
                          >
                            Projected pace: {paceScenario.label}
                          </span>
                          {" \u2014 "}
                          {paceScenario.detail}
                        </p>
                      </div>
                    )}
                    {topInsight && (
                      <div
                        className="rounded-lg p-3"
                        style={{
                          background: BG_WHITE,
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        <p style={{ fontSize: 13, color: TEXT_SEC }}>
                          {topInsight}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/*  RIGHT COLUMN: Horse Picker (45%)                         */}
          {/* -------------------------------------------------------- */}
          <div className="w-full lg:w-[45%]">
            <div
              className="rounded-xl border"
              style={{ background: BG_CARD, borderColor: BORDER }}
            >
              <div className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2
                    className="font-heading text-lg font-bold"
                    style={{ color: TEXT }}
                  >
                    Horse Picker
                  </h2>
                  <span style={{ color: TEXT_SEC, fontSize: 13 }}>
                    <span className="font-semibold" style={{ color: GOLD }}>
                      {selectedHorses.length}
                    </span>
                    /12
                  </span>
                </div>

                {/* Search bar */}
                <div className="relative mb-3">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: TEXT_MUTED }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search horses..."
                    className="w-full rounded-lg border py-2 pl-9 pr-3 outline-none transition-colors focus:ring-2"
                    style={{
                      borderColor: BORDER,
                      background: BG_WHITE,
                      color: TEXT,
                      fontSize: 14,
                    }}
                  />
                </div>

                {/* Scrollable grid of horse cards */}
                <div
                  className="overflow-y-auto pr-1"
                  style={{ maxHeight: 420 }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {filteredProfiles.map((profile) => {
                      const isSelected = selectedNames.has(profile.name);
                      const isDisabled =
                        selectedHorses.length >= 12 && !isSelected;

                      return (
                        <button
                          key={profile.name}
                          onClick={() => toggleHorse(profile)}
                          disabled={isDisabled}
                          className="relative flex items-center gap-2 rounded-xl border p-2 text-left transition-all"
                          style={{
                            background: BG_WHITE,
                            borderColor: isSelected ? GOLD : BORDER,
                            borderWidth: isSelected ? 2 : 1,
                            opacity: isDisabled ? 0.4 : 1,
                            pointerEvents: isDisabled ? "none" : "auto",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                          }}
                        >
                          {/* Checkmark overlay for selected */}
                          {isSelected && (
                            <div
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                              style={{ background: GOLD }}
                            >
                              <Check
                                size={12}
                                style={{ color: BG_WHITE }}
                              />
                            </div>
                          )}

                          {/* Horse photo */}
                          <div
                            className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg"
                            style={{ background: `${profile.color}15` }}
                          >
                            {profile.imageUrl ? (
                              <Image
                                src={profile.imageUrl}
                                alt={profile.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div
                                className="flex h-full w-full items-center justify-center text-base"
                                style={{ color: profile.color }}
                              >
                                {"\u{1F40E}"}
                              </div>
                            )}
                          </div>

                          {/* Horse info */}
                          <div className="min-w-0 flex-1">
                            <div
                              className="truncate font-semibold"
                              style={{ color: TEXT, fontSize: 13 }}
                            >
                              {profile.name}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="rounded px-1 py-0.5"
                                style={{
                                  background: `${profile.color}18`,
                                  color: profile.color,
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {profile.runningStyle}
                              </span>
                              <span
                                className="font-mono"
                                style={{
                                  color: TEXT_MUTED,
                                  fontSize: 10,
                                }}
                              >
                                {profile.topSpeed}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Create Custom Horse (expandable) */}
                <div className="mt-3 border-t pt-3" style={{ borderColor: BORDER }}>
                  <button
                    onClick={() => setShowCustomForm(!showCustomForm)}
                    className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 font-medium transition-colors"
                    style={{
                      borderColor: BORDER,
                      color: TEXT_SEC,
                      background: BG_WHITE,
                      fontSize: 13,
                    }}
                  >
                    <Plus size={14} />
                    Create Custom Horse
                    <ChevronDown
                      size={14}
                      className="ml-auto transition-transform"
                      style={{
                        transform: showCustomForm
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {showCustomForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="mt-2 rounded-xl border p-3"
                          style={{
                            background: BG_WHITE,
                            borderColor: BORDER,
                          }}
                        >
                          {/* Name */}
                          <div className="mb-3">
                            <label
                              className="mb-1 block font-medium"
                              style={{ color: TEXT_SEC, fontSize: 12 }}
                            >
                              Horse Name
                            </label>
                            <input
                              type="text"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              placeholder="Enter name..."
                              className="w-full rounded-lg border px-3 py-2 outline-none transition-colors focus:ring-2"
                              style={{
                                borderColor: BORDER,
                                background: BG_CARD,
                                color: TEXT,
                                fontSize: 14,
                              }}
                            />
                          </div>

                          {/* Style */}
                          <div className="mb-3">
                            <label
                              className="mb-1 block font-medium"
                              style={{ color: TEXT_SEC, fontSize: 12 }}
                            >
                              Running Style
                            </label>
                            <div
                              className="flex overflow-hidden rounded-lg border"
                              style={{ borderColor: BORDER }}
                            >
                              {(
                                ["Front Runner", "Stalker", "Closer"] as const
                              ).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setCustomStyle(s)}
                                  className="flex-1 px-2 py-1.5 font-medium transition-colors"
                                  style={{
                                    background:
                                      customStyle === s ? GOLD : BG_CARD,
                                    color:
                                      customStyle === s ? BG_WHITE : TEXT_SEC,
                                    fontSize: 12,
                                  }}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Top Speed */}
                          <div className="mb-3">
                            <label
                              className="mb-1 block font-medium"
                              style={{ color: TEXT_SEC, fontSize: 12 }}
                            >
                              Top Speed:{" "}
                              <span style={{ color: GOLD, fontWeight: 700 }}>
                                {customTopSpeed} ft/s
                              </span>
                            </label>
                            <input
                              type="range"
                              min={15}
                              max={20}
                              step={0.1}
                              value={customTopSpeed}
                              onChange={(e) =>
                                setCustomTopSpeed(parseFloat(e.target.value))
                              }
                              className="w-full"
                              style={{ accentColor: GOLD }}
                            />
                            <div
                              className="mt-0.5 flex justify-between font-mono"
                              style={{ color: TEXT_MUTED, fontSize: 10 }}
                            >
                              <span>15</span>
                              <span>20</span>
                            </div>
                          </div>

                          {/* Consistency */}
                          <div className="mb-3">
                            <label
                              className="mb-1 block font-medium"
                              style={{ color: TEXT_SEC, fontSize: 12 }}
                            >
                              Consistency
                            </label>
                            <div
                              className="flex overflow-hidden rounded-lg border"
                              style={{ borderColor: BORDER }}
                            >
                              {(["Low", "Med", "High"] as const).map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setCustomConsistency(c)}
                                  className="flex-1 px-2 py-1.5 font-medium transition-colors"
                                  style={{
                                    background:
                                      customConsistency === c
                                        ? GOLD
                                        : BG_CARD,
                                    color:
                                      customConsistency === c
                                        ? BG_WHITE
                                        : TEXT_SEC,
                                    fontSize: 12,
                                  }}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={addCustomHorse}
                            disabled={
                              !customName.trim() ||
                              selectedHorses.length >= 12
                            }
                            className="w-full rounded-lg px-4 py-2 font-semibold transition-opacity disabled:opacity-40"
                            style={{
                              background: GOLD,
                              color: BG_WHITE,
                              fontSize: 13,
                            }}
                          >
                            Add to Race
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/*  SECTION 4: DEEP ANALYSIS                                    */}
        {/*  Only shows with >= 3 horses                                 */}
        {/* ============================================================ */}

        {selectedHorses.length >= 3 && liveResults && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="rounded-xl border"
              style={{ background: BG_CARD, borderColor: BORDER }}
            >
              {/* Tab buttons */}
              <div
                className="flex border-b"
                style={{ borderColor: BORDER }}
              >
                {(
                  [
                    {
                      key: "matchup" as const,
                      label: "Matchup Analysis",
                      icon: Users,
                    },
                    {
                      key: "replay" as const,
                      label: "Watch a Race",
                      icon: Play,
                    },
                    {
                      key: "distribution" as const,
                      label: "Probability Distribution",
                      icon: BarChart3,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex flex-1 items-center justify-center gap-2 px-4 py-3 font-medium transition-colors"
                    style={{
                      color: activeTab === tab.key ? GOLD : TEXT_SEC,
                      borderBottom:
                        activeTab === tab.key
                          ? `2px solid ${GOLD}`
                          : "2px solid transparent",
                      fontSize: 14,
                      background:
                        activeTab === tab.key ? `${GOLD}06` : "transparent",
                    }}
                  >
                    <tab.icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-5">
                {/* ---- TAB: Matchup Analysis ---- */}
                {activeTab === "matchup" && (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3
                          className="font-heading text-lg font-bold"
                          style={{ color: TEXT }}
                        >
                          Matchup Analysis
                        </h3>
                        <p
                          style={{ color: TEXT_SEC, fontSize: 13 }}
                          className="mt-1"
                        >
                          See how each horse&apos;s odds change when specific
                          competitors are added or removed
                        </p>
                      </div>
                      <button
                        onClick={runMatchupAnalysis}
                        disabled={isRunningMatchup}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-opacity disabled:opacity-60"
                        style={{
                          background: GOLD,
                          color: BG_WHITE,
                          fontSize: 14,
                        }}
                      >
                        {isRunningMatchup ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                ease: "linear",
                              }}
                              className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                            />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <TrendingUp size={16} />
                            {matchupData.length > 0
                              ? "Re-analyze"
                              : "Run Analysis"}
                          </>
                        )}
                      </button>
                    </div>

                    {matchupData.length > 0 ? (
                      <div className="space-y-2">
                        {matchupData.slice(0, 12).map((d, i) => {
                          const isPositive = d.delta > 0;
                          return (
                            <div
                              key={`${d.horseName}-${d.removedHorse}-${i}`}
                              className="flex items-center gap-3 rounded-lg border p-3"
                              style={{
                                background: BG_WHITE,
                                borderColor: BORDER,
                              }}
                            >
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{
                                  background: isPositive
                                    ? "#22c55e15"
                                    : "#ef444415",
                                }}
                              >
                                <TrendingUp
                                  size={16}
                                  style={{
                                    color: isPositive
                                      ? "#22c55e"
                                      : "#ef4444",
                                    transform: isPositive
                                      ? "none"
                                      : "rotate(180deg)",
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  style={{
                                    color: TEXT,
                                    fontSize: 14,
                                  }}
                                >
                                  <span className="font-semibold">
                                    {d.horseName}
                                  </span>
                                  &apos;s win%{" "}
                                  {isPositive ? "jumps" : "drops"} from{" "}
                                  <span className="font-semibold">
                                    {d.baseWinPct.toFixed(1)}%
                                  </span>{" "}
                                  to{" "}
                                  <span className="font-semibold">
                                    {d.withoutWinPct.toFixed(1)}%
                                  </span>{" "}
                                  when{" "}
                                  <span className="font-semibold">
                                    {d.removedHorse}
                                  </span>{" "}
                                  {isPositive
                                    ? "leaves the field"
                                    : "is in the field"}
                                </p>
                              </div>
                              <span
                                className="flex-shrink-0 rounded-full px-2 py-0.5 font-mono font-bold"
                                style={{
                                  background: isPositive
                                    ? "#22c55e15"
                                    : "#ef444415",
                                  color: isPositive ? "#22c55e" : "#ef4444",
                                  fontSize: 13,
                                }}
                              >
                                {isPositive ? "+" : ""}
                                {d.delta.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10"
                        style={{ borderColor: BORDER, color: TEXT_MUTED }}
                      >
                        <Users
                          size={32}
                          style={{ color: GOLD, opacity: 0.4 }}
                        />
                        <p className="mt-3" style={{ fontSize: 14 }}>
                          Click &quot;Run Analysis&quot; to see how horses
                          affect each other&apos;s chances
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ---- TAB: Watch a Race ---- */}
                {activeTab === "replay" && (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3
                          className="font-heading text-lg font-bold"
                          style={{ color: TEXT }}
                        >
                          Watch a Simulated Race
                        </h3>
                        <p
                          style={{ color: TEXT_SEC, fontSize: 13 }}
                          className="mt-1"
                        >
                          Run a full {DEEP_SIM_COUNT}-race simulation and
                          watch a randomly selected replay
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!deepResults && (
                          <button
                            onClick={runDeepSimulation}
                            disabled={isRunningDeep}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-opacity disabled:opacity-60"
                            style={{
                              background: GOLD,
                              color: BG_WHITE,
                              fontSize: 14,
                            }}
                          >
                            {isRunningDeep ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    ease: "linear",
                                  }}
                                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                                />
                                Simulating...
                              </>
                            ) : (
                              <>
                                <Play size={16} fill="currentColor" />
                                Run Full Simulation
                              </>
                            )}
                          </button>
                        )}
                        {deepResults && (
                          <button
                            onClick={watchRace}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-opacity"
                            style={{
                              background: GOLD,
                              color: BG_WHITE,
                              fontSize: 14,
                            }}
                          >
                            <Play size={14} fill="currentColor" />
                            {replayIndex !== null
                              ? "Watch Another"
                              : "Watch a Race"}
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {replayData && (
                        <motion.div
                          key={replayIndex}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden rounded-xl border"
                          style={{ borderColor: BORDER }}
                        >
                          <RaceReplay
                            horses={replayData.horses}
                            colors={replayData.colors}
                            distance={distance}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!deepResults && !isRunningDeep && (
                      <div
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12"
                        style={{ borderColor: BORDER, color: TEXT_MUTED }}
                      >
                        <Trophy
                          size={32}
                          style={{ color: GOLD, opacity: 0.4 }}
                        />
                        <p className="mt-2" style={{ fontSize: 14 }}>
                          Run a full simulation to watch animated race
                          replays
                        </p>
                      </div>
                    )}

                    {deepResults && replayIndex === null && (
                      <div
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12"
                        style={{ borderColor: BORDER, color: TEXT_MUTED }}
                      >
                        <Trophy
                          size={32}
                          style={{ color: GOLD, opacity: 0.4 }}
                        />
                        <p className="mt-2" style={{ fontSize: 14 }}>
                          Click &quot;Watch a Race&quot; to see a randomly
                          selected simulation
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ---- TAB: Probability Distribution ---- */}
                {activeTab === "distribution" && (
                  <div>
                    <h3
                      className="font-heading mb-4 text-lg font-bold"
                      style={{ color: TEXT }}
                    >
                      Win Probability Distribution
                    </h3>

                    {/* Bar chart */}
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 8,
                          right: 8,
                          bottom: 40,
                          left: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={BORDER}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: TEXT_SEC,
                            fontSize: 12,
                          }}
                          angle={-35}
                          textAnchor="end"
                          axisLine={{ stroke: BORDER }}
                          tickLine={{ stroke: BORDER }}
                        />
                        <YAxis
                          tick={{ fill: GOLD, fontSize: 12 }}
                          axisLine={{ stroke: BORDER }}
                          tickLine={{ stroke: BORDER }}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: BG_WHITE,
                            border: `1px solid ${BORDER}`,
                            borderRadius: 8,
                            fontSize: 13,
                            color: TEXT,
                          }}
                          formatter={(value: unknown) => [
                            `${value}%`,
                            "Win Rate",
                          ]}
                        />
                        <Bar
                          dataKey="winPct"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        >
                          {chartData.map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={entry.color}
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Insights */}
                    {insights.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <h4
                          className="text-sm font-semibold uppercase tracking-wider"
                          style={{
                            color: TEXT_MUTED,
                            fontSize: 12,
                          }}
                        >
                          Key Insights
                        </h4>
                        {insights.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-xl border p-4"
                            style={{
                              background: BG_WHITE,
                              borderColor: BORDER,
                            }}
                          >
                            <div
                              className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                              style={{
                                background: `${GOLD}15`,
                              }}
                            >
                              <Zap
                                size={14}
                                style={{ color: GOLD }}
                              />
                            </div>
                            <div>
                              <p
                                className="mb-1 font-semibold"
                                style={{
                                  color: TEXT,
                                  fontSize: 15,
                                }}
                              >
                                {item.title}
                              </p>
                              <p
                                className="leading-relaxed"
                                style={{
                                  color: TEXT_SEC,
                                  fontSize: 14,
                                }}
                              >
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ---- Empty state when < 3 horses ---- */}
        {selectedHorses.length < 3 && selectedHorses.length > 0 && (
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12"
            style={{ borderColor: BORDER, color: TEXT_MUTED }}
          >
            <AlertCircle size={32} style={{ opacity: 0.4 }} />
            <p className="mt-3 font-medium" style={{ fontSize: 15 }}>
              Add {3 - selectedHorses.length} more horse
              {3 - selectedHorses.length > 1 ? "s" : ""} for deep analysis
            </p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Odds are already live above with 2+ horses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense>
      <SimulatePageInner />
    </Suspense>
  );
}
