"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Play } from "lucide-react";
import RaceReplay from "@/components/arena/RaceReplay";
import SpeedTelemetry from "@/components/arena/SpeedTelemetry";
import StrideAnalysis from "@/components/arena/StrideAnalysis";
import { FEATURED_RACE, HORSE_COLORS, ALL_RACES, type RaceData } from "@/lib/data/race-data";
import { getProfile } from "@/lib/data/horse-profiles";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS = ["Replay", "Speed", "Stride"] as const;
type Tab = (typeof TABS)[number];

const MAX_SELECTED = 4;

const COLOR = {
  bg: "#ffffff",
  card: "#f8f6f2",
  text: "#1a1a2a",
  secondary: "#6b7280",
  muted: "#9ca3af",
  gold: "#b8941f",
  border: "#e5e2db",
} as const;

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  Replay:
    "Watch the race unfold in real time — every horse's position reconstructed from GPS gate data.",
  Speed:
    "Compare horses' speed at every half-furlong. Select up to 4 horses to overlay their speed traces.",
  Stride:
    "Stride length vs speed reveals mechanical efficiency. Longer strides at the same speed = more energy reserves.",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Map a horse's running style from its gate data pattern */
function inferRunningStyle(gates: { p: number }[]): string | null {
  if (!gates || gates.length < 4) return null;
  const earlyAvg = (gates[0].p + gates[1].p + gates[2].p) / 3;
  if (earlyAvg <= 2) return "Front Runner";
  if (earlyAvg <= 5) return "Stalker";
  if (earlyAvg >= 6) return "Closer";
  return null;
}

function formatOdds(odds: number | null) {
  if (odds === null) return "SCR";
  return `${odds}-1`;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** Compute finishing order with time gaps from actual race data */
function getFinishingOrder(race: RaceData) {
  const sorted = [...race.horses].sort((a, b) => a.finish - b.finish);
  // Compute total time for each horse from gate sectional times
  const totalTimes = new Map<string, number>();
  for (const h of sorted) {
    const total = h.gates.reduce((sum, g) => sum + g.t, 0);
    totalTimes.set(h.name, total);
  }
  const winnerTime = totalTimes.get(sorted[0]?.name) ?? 0;
  return sorted.map((h) => {
    const diff = (totalTimes.get(h.name) ?? 0) - winnerTime;
    return {
      name: h.name,
      gap: diff < 0.01 ? null : `+${diff.toFixed(1)}s`,
    };
  });
}

/** Compute dynamic race summary from actual gate data */
function getRaceSummary(race: RaceData) {
  const sorted = [...race.horses].sort((a, b) => a.finish - b.finish);
  const winner = sorted[0];
  if (!winner) return { winner: "", pace: "", keyMove: "", topSpeed: "" };

  // Find who led at halfway
  const midGateIdx = Math.floor(race.distance);
  const leader = race.horses.reduce((best, h) => {
    const midGate = h.gates.find((g) => g.g === midGateIdx * 0.5) ?? h.gates[Math.floor(h.gates.length / 2)];
    const bestMid = best.gates.find((g) => g.g === midGateIdx * 0.5) ?? best.gates[Math.floor(best.gates.length / 2)];
    return (midGate?.p ?? 99) < (bestMid?.p ?? 99) ? h : best;
  });

  // Top speed across all horses
  let topSpeedVal = 0;
  let topSpeedHorse = "";
  let topSpeedGate = 0;
  for (const h of race.horses) {
    for (const g of h.gates) {
      if (g.spd > topSpeedVal) {
        topSpeedVal = g.spd;
        topSpeedHorse = h.name;
        topSpeedGate = g.g;
      }
    }
  }

  return {
    winner: `${winner.name} (${winner.odds !== null ? winner.odds + "-1" : "SCR"})`,
    pace: `${leader.name} set the pace through the middle stages`,
    keyMove: `${winner.name} finished ${winner.finish === 1 ? "1st" : ordinal(winner.finish)} from post ${winner.postPos}`,
    topSpeed: `${topSpeedVal.toFixed(1)} ft/s (${topSpeedHorse}, gate ${topSpeedGate})`,
  };
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RaceXRayPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Replay");
  const [selectedHorses, setSelectedHorses] = useState<number[]>([0, 1, 4]);
  const [showResults, setShowResults] = useState(false);
  const [raceIndex, setRaceIndex] = useState(0);

  const race = ALL_RACES[raceIndex];

  function changeRace(idx: number) {
    setRaceIndex(idx);
    setSelectedHorses([0, 1, Math.min(4, ALL_RACES[idx].horses.length - 1)]);
    setShowResults(false);
    setActiveTab("Replay");
  }

  /* Toggle a horse on/off in the selection -------------------------  */
  function toggleHorse(index: number) {
    setSelectedHorses((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, index];
    });
  }

  /* Filtered data for stride analysis (no selectedHorses prop) -----  */
  const filteredHorses = useMemo(
    () => selectedHorses.map((i) => race.horses[i]),
    [selectedHorses, race.horses],
  );

  const filteredColors = useMemo(
    () => selectedHorses.map((i) => HORSE_COLORS[i]),
    [selectedHorses],
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor: COLOR.bg }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ------ Header ------------------------------------------- */}
        <header className="mb-4">
          <h1
            className="font-heading text-3xl font-bold tracking-tight"
            style={{ color: COLOR.text }}
          >
            Race X-Ray
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLOR.secondary }}>
            See any race through GPS eyes
          </p>
        </header>

        {/* ------ Race selector — clean pill buttons ------------------------------------ */}
        <div className="mb-6">
          <p className="text-xs font-medium mb-2" style={{ color: COLOR.muted }}>
            {ALL_RACES.length} GPS-tracked races available
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_RACES.map((r, idx) => (
              <button
                key={`${r.track}-${r.raceNum}-${r.date}`}
                onClick={() => changeRace(idx)}
                className="rounded-lg px-3 py-2 text-left transition-all text-xs"
                style={{
                  backgroundColor: raceIndex === idx ? `${COLOR.gold}12` : COLOR.card,
                  border: `1.5px solid ${raceIndex === idx ? COLOR.gold : COLOR.border}`,
                  color: raceIndex === idx ? COLOR.text : COLOR.secondary,
                }}
              >
                <span className="font-bold">{r.track.trim()} R{r.raceNum}</span>
                <span className="ml-1.5 text-[10px]" style={{ color: COLOR.muted }}>
                  {r.distance}F {r.surface === "D" ? "Dirt" : "Turf"}
                </span>
                <span className="ml-1.5 text-[10px] font-semibold" style={{ color: COLOR.gold }}>
                  ${r.purse >= 1000000 ? `${(r.purse/1000000).toFixed(0)}M` : `${(r.purse/1000).toFixed(0)}K`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ------ Selected race info bar ------------------------------ */}
        <div
          className="mb-6 flex flex-wrap items-center gap-2 rounded-xl px-4 py-3"
          style={{ backgroundColor: COLOR.card, border: `1px solid ${COLOR.border}` }}
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: COLOR.gold }} />
          <span className="text-sm font-semibold" style={{ color: COLOR.text }}>
            {race.track.trim()} Race {race.raceNum}
          </span>
          {[
            race.date,
            `${race.distance}F ${race.surface === "D" ? "Dirt" : race.surface === "T" ? "Turf" : race.surface}`,
            `$${race.purse >= 1000000 ? `${(race.purse/1000000).toFixed(0)}M` : `${(race.purse/1000).toFixed(0)}K`} ${race.raceType === "STK" ? "Stakes" : race.raceType}`,
            `${race.horses.length} runners`,
          ].map((info, idx) => (
            <span key={idx} className="text-[11px] px-2 py-0.5 rounded" style={{ background: COLOR.bg, color: COLOR.secondary, border: `1px solid ${COLOR.border}` }}>
              {info}
            </span>
          ))}
          <Link
            href={`/simulate?race=${raceIndex}`}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]"
            style={{ backgroundColor: COLOR.gold, color: "#fff" }}
          >
            <Play size={12} fill="#fff" />
            Simulate
          </Link>
        </div>

        {/* ------ Mobile horse pills (below lg) — simplified -------------------- */}
        <div className="mb-4 lg:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase" style={{ color: COLOR.muted }}>
              Select horses to compare ({selectedHorses.length}/{MAX_SELECTED})
            </span>
            {selectedHorses.length >= MAX_SELECTED && (
              <span className="text-[10px] font-medium" style={{ color: COLOR.gold }}>Max selected</span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {race.horses.map((h, i) => {
              const active = selectedHorses.includes(i);
              const disabled = !active && selectedHorses.length >= MAX_SELECTED;
              return (
                <button
                  key={h.name}
                  onClick={() => toggleHorse(i)}
                  disabled={disabled}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: active ? `${COLOR.gold}12` : COLOR.card,
                    border: `1px solid ${active ? COLOR.gold : COLOR.border}`,
                    color: active ? COLOR.text : COLOR.muted,
                    opacity: disabled ? 0.35 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HORSE_COLORS[i] }} />
                  {h.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ------ Main 2-column layout ----------------------------- */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* --- Left column: tabs + viz --------------------------- */}
          <div className="min-w-0 lg:w-3/5">
            {/* Tab bar */}
            <div
              className="mb-2 flex gap-1 rounded-lg p-1"
              style={{ backgroundColor: COLOR.card, border: `1px solid ${COLOR.border}` }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative rounded-md px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: activeTab === tab ? COLOR.text : COLOR.muted,
                  }}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="xray-tab"
                      className="absolute inset-0 rounded-md"
                      style={{
                        backgroundColor: COLOR.bg,
                        border: `1px solid ${COLOR.border}`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              ))}
            </div>

            {/* Tab description */}
            <p
              className="mb-4 text-xs leading-relaxed px-1"
              style={{ color: COLOR.muted }}
            >
              {TAB_DESCRIPTIONS[activeTab]}
            </p>

            {/* Tab content */}
            <div
              className="overflow-hidden rounded-xl"
              style={{
                backgroundColor: COLOR.card,
                border: `1px solid ${COLOR.border}`,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  {activeTab === "Replay" && (
                    <RaceReplay
                      horses={race.horses}
                      colors={HORSE_COLORS}
                      distance={race.distance}
                    />
                  )}
                  {activeTab === "Speed" && (
                    <SpeedTelemetry
                      horses={race.horses}
                      colors={HORSE_COLORS}
                      selectedHorses={selectedHorses}
                    />
                  )}
                  {activeTab === "Stride" && (
                    <StrideAnalysis
                      horses={filteredHorses}
                      colors={filteredColors}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* --- Right column: horse selector + summary ------------ */}
          <div className="space-y-6 lg:w-2/5">
            {/* Horse selector panel */}
            <div
              className="hidden rounded-xl p-5 lg:block"
              style={{
                backgroundColor: COLOR.card,
                border: `1px solid ${COLOR.border}`,
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="text-sm font-semibold uppercase tracking-widest"
                  style={{ color: COLOR.muted }}
                >
                  Field
                </h2>
                <span className="text-xs" style={{ color: selectedHorses.length >= MAX_SELECTED ? COLOR.gold : COLOR.muted }}>
                  {selectedHorses.length}/{MAX_SELECTED}{selectedHorses.length >= MAX_SELECTED ? " (max)" : ""}
                </span>
              </div>

              <div className="space-y-1">
                {race.horses.map((horse, i) => {
                  const isSelected = selectedHorses.includes(i);
                  const isDisabled = !isSelected && selectedHorses.length >= MAX_SELECTED;
                  const style = inferRunningStyle(horse.gates);
                  return (
                    <button
                      key={horse.name}
                      onClick={() => toggleHorse(i)}
                      disabled={isDisabled}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
                      style={{
                        backgroundColor: isSelected ? `${COLOR.gold}0a` : "transparent",
                        opacity: isDisabled ? 0.4 : 1,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      {/* Checkbox */}
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                        style={{
                          borderColor: isSelected ? COLOR.gold : COLOR.border,
                          backgroundColor: isSelected ? COLOR.gold : "transparent",
                        }}
                      >
                        {isSelected && (
                          <svg
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                            className="text-white"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>

                      {/* Color dot */}
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: HORSE_COLORS[i] }}
                      />

                      {/* Horse name */}
                      <Link
                        href={`/profiles/${toSlug(horse.name)}`}
                        className="flex-1 truncate text-sm font-medium hover:underline"
                        style={{ color: COLOR.text }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {horse.name}
                      </Link>

                      {/* PP */}
                      <span
                        className="shrink-0 text-xs tabular-nums"
                        style={{ color: COLOR.muted }}
                      >
                        PP{horse.postPos}
                      </span>

                      {/* Odds */}
                      <span
                        className="w-10 shrink-0 text-right text-xs tabular-nums"
                        style={{ color: COLOR.secondary }}
                      >
                        {formatOdds(horse.odds)}
                      </span>

                      {/* Running style label instead of finish position */}
                      {style && (
                        <span
                          className="w-20 shrink-0 text-right text-xs"
                          style={{ color: COLOR.muted }}
                        >
                          {style}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Race summary panel with spoiler toggle */}
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: COLOR.card,
                border: `1px solid ${COLOR.border}`,
              }}
            >
              <h2
                className="mb-4 text-sm font-semibold uppercase tracking-widest"
                style={{ color: COLOR.muted }}
              >
                Race Summary
              </h2>

              {!showResults ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <p
                    className="mb-3 text-sm leading-relaxed"
                    style={{ color: COLOR.secondary }}
                  >
                    Watch the replay first to see how the race unfolds.
                    Results are hidden to preserve the experience.
                  </p>
                  <button
                    onClick={() => setShowResults(true)}
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: `${COLOR.gold}15`,
                      color: COLOR.gold,
                      border: `1px solid ${COLOR.gold}40`,
                    }}
                  >
                    Show Results
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <dl className="space-y-4">
                      <SummaryRow
                        label="Winner"
                        value={getRaceSummary(race).winner}
                        highlight
                      />
                      <SummaryRow
                        label="Pace"
                        value={getRaceSummary(race).pace}
                      />
                      <SummaryRow
                        label="Key Move"
                        value={getRaceSummary(race).keyMove}
                      />
                      <SummaryRow
                        label="Top Speed"
                        value={getRaceSummary(race).topSpeed}
                      />
                    </dl>

                    {/* Full finishing order */}
                    <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${COLOR.border}` }}>
                      <h3
                        className="mb-3 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: COLOR.muted }}
                      >
                        Full Finishing Order
                      </h3>
                      <div className="space-y-1.5">
                        {getFinishingOrder(race).map((finisher, idx) => (
                          <div
                            key={finisher.name}
                            className="flex items-center gap-3 rounded-lg px-3 py-1.5"
                            style={{
                              backgroundColor: idx === 0 ? `${COLOR.gold}0a` : "transparent",
                            }}
                          >
                            <span
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: idx === 0 ? COLOR.gold : `${COLOR.muted}20`,
                                color: idx === 0 ? "#fff" : COLOR.muted,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <Link
                              href={`/profiles/${toSlug(finisher.name)}`}
                              className="flex-1 text-sm font-medium hover:underline"
                              style={{ color: idx === 0 ? COLOR.gold : COLOR.text }}
                            >
                              {finisher.name}
                            </Link>
                            <span
                              className="text-xs tabular-nums"
                              style={{ color: COLOR.muted }}
                            >
                              {finisher.gap ?? "Winner"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary row component                                              */
/* ------------------------------------------------------------------ */

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: COLOR.muted }}
      >
        {label}
      </dt>
      <dd
        className="mt-1 text-sm leading-relaxed"
        style={{ color: highlight ? COLOR.gold : COLOR.text }}
      >
        {value}
      </dd>
    </div>
  );
}
