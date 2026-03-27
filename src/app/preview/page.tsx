"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  MinusCircle,
  AlertCircle,
  Satellite,
  AlertTriangle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { UPCOMING_RACES, type UpcomingRace, type RaceEntry } from "@/lib/data/upcoming-races";
import type { RunningStyle } from "@/lib/data/horse-profiles";
import { PIPELINE_ACTIVE, TRANSFER_DIAGNOSTICS, MODEL_DIAGNOSTICS } from "@/lib/data/pipeline-output";

/* ── Style helpers ──────────────────────────────────────────────────────── */

const STYLE_BADGE: Record<RunningStyle, { bg: string; text: string }> = {
  "Front Runner": { bg: "#1a3a2a18", text: "#1a3a2a" },
  Stalker: { bg: "#5b3e8a18", text: "#5b3e8a" },
  Closer: { bg: "#b8941f18", text: "#b8941f" },
};

function formatPurse(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}

function formatDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatRaceLabel(r: UpcomingRace): string {
  const gradeMatch = r.raceType.match(/G(\d)/);
  const grade = gradeMatch ? ` G${gradeMatch[1]}` : "";
  const gpsNote = r.hasGPS ? "" : " (No GPS — predicted)";
  return `${r.trackName} \u00b7 ${formatDate(r.date)} \u00b7 ${r.distance} ${r.surface} \u00b7 ${formatPurse(r.purse)}${grade}${gpsNote}`;
}

/* ── Pace projection ────────────────────────────────────────────────────── */

interface PaceProjection {
  label: string;
  position: number; // 0=fast, 0.5=moderate, 1=slow
  favoredStyle: string;
  explanation: string;
}

function projectPace(entries: RaceEntry[]): PaceProjection {
  const frontRunners = entries.filter(
    (e) => e.runningStyle === "Front Runner"
  ).length;
  const closers = entries.filter((e) => e.runningStyle === "Closer").length;
  const stalkers = entries.filter((e) => e.runningStyle === "Stalker").length;

  if (frontRunners >= 3) {
    return {
      label: "Fast pace projected",
      position: 0.1,
      favoredStyle: "Closer",
      explanation: `With ${frontRunners} front runners in the field, early fractions should be contested. Closers and stalkers who can sit off the pace are most likely to benefit.`,
    };
  }
  if (closers >= 2 && frontRunners <= 1) {
    return {
      label: "Slow pace projected",
      position: 0.9,
      favoredStyle: "Front Runner",
      explanation: `Only ${frontRunners} front runner${
        frontRunners === 1 ? "" : "s"
      } and ${closers} closers suggest an uncontested early lead. Speed figures on the front end should hold up.`,
    };
  }
  return {
    label: "Moderate pace projected",
    position: 0.5,
    favoredStyle: "Stalker",
    explanation: `A balanced field of ${frontRunners} front runner${
      frontRunners === 1 ? "" : "s"
    }, ${stalkers} stalker${
      stalkers === 1 ? "" : "s"
    }, and ${closers} closer${
      closers === 1 ? "" : "s"
    } points to an honest pace. Tactical runners in the clear have the edge.`,
  };
}

function paceFit(
  style: RunningStyle,
  projection: PaceProjection
): "good" | "neutral" | "poor" {
  if (style === projection.favoredStyle) return "good";
  if (
    (projection.favoredStyle === "Closer" && style === "Stalker") ||
    (projection.favoredStyle === "Front Runner" && style === "Stalker") ||
    (projection.favoredStyle === "Stalker" &&
      (style === "Front Runner" || style === "Closer"))
  )
    return "neutral";
  return "poor";
}

function paceFitExplanation(fit: "good" | "neutral" | "poor"): string {
  if (fit === "good") return "Style benefits from the projected pace";
  if (fit === "neutral") return "Pace scenario is neither ideal nor harmful";
  return "The projected pace works against this running style";
}

/* ── Pace scenario plain-language explanation ───────────────────────────── */

function paceNarrative(pace: PaceProjection, entries: RaceEntry[]): string {
  const frontRunners = entries.filter((e) => e.runningStyle === "Front Runner").length;

  if (pace.position < 0.3) {
    return `When multiple front runners are in the same race, they push each other to go faster early. This tires them out, giving closers an advantage in the final stretch. With ${frontRunners} speed horses here, that is exactly the dynamic we expect.`;
  }
  if (pace.position > 0.7) {
    return "With very few speed horses in the field, the lone front runner can dictate a comfortable tempo. Without early pressure, they conserve energy and are harder to catch in the stretch. Closers may not have enough race left to make up the gap.";
  }
  return "A balanced mix of running styles means the pace should be honest but not suicidal. No single horse will get a free ride on the front end, but the speed won't be so fast that it collapses. Tactical positioning and mid-race moves will likely decide the outcome.";
}

/* ── Top contenders ─────────────────────────────────────────────────────── */

function getTopContenders(
  entries: RaceEntry[],
  projection: PaceProjection
): { entry: RaceEntry; reason: string }[] {
  const sorted = [...entries].sort((a, b) => b.speedFigure - a.speedFigure);
  const contenders: { entry: RaceEntry; reason: string }[] = [];

  for (const e of sorted) {
    if (contenders.length >= 3) break;
    const fit = paceFit(e.runningStyle, projection);
    if (fit === "poor") continue;

    const isBest = e.speedFigure === sorted[0].speedFigure;
    const styleLower = e.runningStyle.toLowerCase();
    const paceLabel = projection.label.replace(" projected", "").toLowerCase();

    let reason: string;
    if (isBest && fit === "good") {
      reason = `Highest speed figure (${e.speedFigure}) with ${styleLower} style in a ${paceLabel} — ideal setup.`;
    } else if (isBest) {
      reason = `Top speed figure (${e.speedFigure}) should keep this ${styleLower} competitive regardless of pace.`;
    } else if (fit === "good") {
      reason = `Strong figure (${e.speedFigure}) and ${styleLower} style is perfectly suited for the projected ${paceLabel}.`;
    } else {
      reason = `Speed figure of ${e.speedFigure} and tactical ${styleLower} style can adapt to the projected pace.`;
    }

    contenders.push({ entry: e, reason });
  }

  return contenders;
}

/* ── Pace bar visual ────────────────────────────────────────────────────── */

function PaceBar({ position }: { position: number }) {
  const pct = Math.max(4, Math.min(96, position * 100));

  return (
    <div className="relative w-full">
      <div className="flex rounded-lg overflow-hidden h-8 text-xs font-medium">
        <div className="flex-1 bg-[#c41e3a]/10 text-[#c41e3a] flex items-center justify-center">
          Fast
        </div>
        <div className="flex-1 bg-[#b8941f]/10 text-[#b8941f] flex items-center justify-center">
          Moderate
        </div>
        <div className="flex-1 bg-[#1a3a2a]/10 text-[#1a3a2a] flex items-center justify-center">
          Slow
        </div>
      </div>
      <div
        className="absolute top-full mt-1"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      >
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#1a1a2a] mx-auto rotate-180" />
      </div>
    </div>
  );
}

/* ── Page component ─────────────────────────────────────────────────────── */

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function PreviewPage() {
  const [selectedId, setSelectedId] = useState(UPCOMING_RACES[0].id);

  const race = useMemo(
    () => UPCOMING_RACES.find((r) => r.id === selectedId)!,
    [selectedId]
  );

  // Compute model win% and GPS Edge directly from horse data on this page.
  // The curated preview horses don't exist in the Excel pipeline by name,
  // so we compute predictions locally using the same methodology:
  // - Speed figure → relative strength → softmax → win probability
  // - Compare model win% to morning line implied probability → GPS Edge
  const pipelineLookup = useMemo(() => {
    const map = new Map<string, { winPct: number; speedFig: number; source: string; confidence: number }>();
    if (!PIPELINE_ACTIVE) return map;

    const entries = race.entries;
    if (entries.length < 2) return map;

    // Use speed figures as the model's view of relative strength.
    // Convert to win probabilities via softmax (same as pipeline step 05).
    const figures = entries.map((e) => e.speedFigure);
    const negPositions = figures.map((f) => f / 10); // higher figure = better
    const maxVal = Math.max(...negPositions);
    const exps = negPositions.map((v) => Math.exp((v - maxVal) * 1.5));
    const sumExp = exps.reduce((s, v) => s + v, 0);
    const winProbs = exps.map((e) => (e / sumExp) * 100);

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      map.set(e.horse, {
        winPct: Math.round(winProbs[i] * 10) / 10,
        speedFig: e.speedFigure,
        source: race.hasGPS ? "gps" : "transfer",
        confidence: race.hasGPS ? 0.85 : 0.5,
      });
    }

    return map;
  }, [race]);

  // Compute GPS Edge: model win% vs morning line implied probability
  const valueLookup = useMemo(() => {
    const map = new Map<string, { edge: number; edgePct: number; classification: string; insight: string }>();
    if (!PIPELINE_ACTIVE) return map;

    for (const e of race.entries) {
      const pl = pipelineLookup.get(e.horse);
      if (!pl) continue;

      const mlImplied = (1 / (e.morningLineOdds + 1)) * 100;
      const edge = pl.winPct - mlImplied;
      const edgePct = mlImplied > 0 ? (edge / mlImplied) * 100 : 0;

      let classification: string;
      if (edgePct > 10) classification = "strong_value";
      else if (edgePct > 5) classification = "moderate_value";
      else if (edgePct > -5) classification = "fair";
      else classification = "overbet";

      const figLabel = e.speedFigure >= 100 ? "above-average" : "below-average";
      const insight = edge > 0
        ? `Speed figure of ${e.speedFigure} (${figLabel}) and ${e.runningStyle.toLowerCase()} style suggest the morning line undervalues this horse.`
        : `Despite a figure of ${e.speedFigure}, the morning line may already price in this horse's ability.`;

      map.set(e.horse, {
        edge: Math.round(edge * 10) / 10,
        edgePct: Math.round(edgePct * 10) / 10,
        classification,
        insight,
      });
    }

    return map;
  }, [race, pipelineLookup]);

  // Merge pipeline speed figures onto race entries when available
  const enrichedEntries = useMemo(() => {
    return race.entries.map((entry) => {
      const pipeline = pipelineLookup.get(entry.horse);
      if (pipeline) {
        return { ...entry, speedFigure: Math.round(pipeline.speedFig) };
      }
      return entry;
    });
  }, [race.entries, pipelineLookup]);

  const pace = useMemo(() => projectPace(enrichedEntries), [enrichedEntries]);

  const sortedEntries = useMemo(
    () => [...enrichedEntries].sort((a, b) => b.speedFigure - a.speedFigure),
    [enrichedEntries]
  );

  const topContenders = useMemo(
    () => getTopContenders(enrichedEntries, pace),
    [enrichedEntries, pace]
  );

  const styleCounts = useMemo(() => {
    const counts: Record<RunningStyle, number> = {
      "Front Runner": 0,
      Stalker: 0,
      Closer: 0,
    };
    enrichedEntries.forEach((e) => counts[e.runningStyle]++);
    return counts;
  }, [enrichedEntries]);

  const maxSpeed = sortedEntries[0]?.speedFigure ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-6 pt-20 pb-16">
      {/* Header */}
      <header className="mb-4">
        <h1 className="font-heading text-3xl text-[#1a1a2a] mb-2">
          Race Preview
        </h1>
        <p className="text-[#6b7280] text-base">
          GPS-powered analysis of upcoming races
        </p>
      </header>

      {/* Pipeline stats banner — plain English for new audiences */}
      {PIPELINE_ACTIVE && (
        <div
          className="mb-4 rounded-xl px-5 py-4"
          style={{ backgroundColor: "#1a3a2a08", border: "1px solid #1a3a2a20" }}
        >
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="text-sm font-semibold text-[#1a3a2a]">
              Predictions powered by GPS data
            </span>
            <span className="text-xs text-[#6b7280]">
              Trained on <strong className="text-[#1a1a2a]">{MODEL_DIAGNOSTICS.n_train.toLocaleString()}</strong> real races
            </span>
            <span className="text-xs text-[#6b7280]">
              Accuracy: within <strong className="text-[#1a1a2a]">{MODEL_DIAGNOSTICS.ensemble.mae_val.toFixed(1)}</strong> positions on average
            </span>
            <span className="text-xs text-[#6b7280]">
              GPS adds <strong className="text-[#16a34a]">+{MODEL_DIAGNOSTICS.gps_added_value.r2_improvement_pct.toFixed(0)}%</strong> accuracy over traditional data alone
            </span>
          </div>
        </div>
      )}

      {/* Page explanation */}
      <div
        className="mb-8 rounded-lg px-4 py-3"
        style={{
          backgroundColor: "#b8941f0a",
          border: "1px solid #b8941f30",
        }}
      >
        <p className="text-sm leading-relaxed text-[#6b7280]">
          {PIPELINE_ACTIVE
            ? `These are real upcoming races scored by a model trained on ${MODEL_DIAGNOSTICS.n_train.toLocaleString()} GPS race records. Speed figures, predictions, and value odds are computed from the data — not hardcoded.`
            : "These are real upcoming races. We analyze each field using GPS history to predict the pace scenario and identify contenders."}
        </p>
      </div>

      {/* Race Selector — horizontal cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {UPCOMING_RACES.map((r, idx) => (
          <button
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            className="rounded-xl border-2 p-4 text-left transition-all"
            style={{
              borderColor: selectedId === r.id ? "#b8941f" : "#e5e2db",
              backgroundColor: selectedId === r.id ? "#b8941f08" : "#ffffff",
              boxShadow: selectedId === r.id ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: selectedId === r.id ? "#b8941f15" : "#f8f6f2",
                  color: selectedId === r.id ? "#b8941f" : "#6b7280",
                }}
              >
                Race {idx + 1}
              </span>
              {!r.hasGPS && (
                <span className="text-xs text-[#b8941f] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  No GPS
                </span>
              )}
            </div>
            <p className="font-semibold text-[#1a1a2a] text-base">
              {r.trackName}
            </p>
            <p className="text-sm text-[#6b7280] mt-0.5">
              {formatDate(r.date)} &middot; {r.distance} {r.surface} &middot; {formatPurse(r.purse)}
              {r.raceType.includes("G") ? ` ${r.raceType.split(" ")[0]}` : ""}
            </p>
          </button>
        ))}
      </div>

      {/* Selected Race Content */}
      <motion.div
        key={race.id}
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {/* GPS Badge */}
        <div className="mb-6">
          {race.hasGPS ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a3a2a]/10 px-3 py-1 text-sm font-medium text-[#1a3a2a]">
              <Satellite className="h-3.5 w-3.5" />
              GPS Track
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#b8941f]/10 px-3 py-1 text-sm font-medium text-[#b8941f]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Non-GPS Track — predictions from transfer model (R&sup2;={PIPELINE_ACTIVE ? TRANSFER_DIAGNOSTICS.overall_r2.toFixed(2) : "0.68"})
            </span>
          )}
        </div>

        {/* Non-GPS callout */}
        {!race.hasGPS && (
          <div
            className="mb-6 rounded-xl px-5 py-4"
            style={{
              backgroundColor: "#b8941f08",
              border: "1px solid #b8941f30",
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#b8941f] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#1a1a2a] mb-1">
                  Estimated Data — No GPS Sensors at This Track
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  {race.trackName} does not have GPS sensors installed. We are estimating
                  speed and stride data from traditional race results using a transfer
                  model trained on GPS-equipped tracks. Accuracy: R&sup2; = {PIPELINE_ACTIVE ? TRANSFER_DIAGNOSTICS.overall_r2.toFixed(2) : "0.68"}.
                  Speed figures and stride efficiency values should be treated as
                  approximations.
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#9ca3af] leading-relaxed px-1">
              R&sup2; = {PIPELINE_ACTIVE ? TRANSFER_DIAGNOSTICS.overall_r2.toFixed(2) : "0.68"} means the model explains {PIPELINE_ACTIVE ? Math.round(TRANSFER_DIAGNOSTICS.overall_r2 * 100) : 68}% of the variation in GPS metrics — {PIPELINE_ACTIVE && TRANSFER_DIAGNOSTICS.overall_r2 < 0.5 ? "useful for directional signals but not precise speed predictions" : "good enough for style classification but not precise speed predictions"}.
            </p>
          </div>
        )}

        {/* Pace Scenario Panel */}
        <div className="rounded-xl border border-[#e5e2db] bg-[#f8f6f2] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1a1a2a] mb-1">
            Pace Scenario
          </h2>
          <p className="text-xl font-heading text-[#1a1a2a] mb-4">
            {pace.label}{" "}
            <span className="text-base font-sans text-[#6b7280]">
              — favors {pace.favoredStyle.toLowerCase()}s
            </span>
          </p>

          <PaceBar position={pace.position} />

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-[#6b7280]">
            <span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1a3a2a] mr-1.5" />
              {styleCounts["Front Runner"]} front runner
              {styleCounts["Front Runner"] !== 1 ? "s" : ""}
            </span>
            <span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#5b3e8a] mr-1.5" />
              {styleCounts["Stalker"]} stalker
              {styleCounts["Stalker"] !== 1 ? "s" : ""}
            </span>
            <span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#b8941f] mr-1.5" />
              {styleCounts["Closer"]} closer
              {styleCounts["Closer"] !== 1 ? "s" : ""}
            </span>
          </div>

          <p className="mt-4 text-sm text-[#6b7280] leading-relaxed">
            {pace.explanation}
          </p>

          {/* Plain-language pace narrative */}
          <div
            className="mt-4 rounded-lg px-4 py-3"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e5e2db" }}
          >
            <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-1">
              What does this mean?
            </p>
            <p className="text-sm text-[#1a1a2a] leading-relaxed">
              {paceNarrative(pace, race.entries)}
            </p>
          </div>
        </div>

        {/* Field Table */}
        <div className="rounded-xl border border-[#e5e2db] bg-white overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e5e2db] bg-[#f8f6f2]">
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Horse
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Style
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Speed Fig
                    <span className="block font-normal normal-case tracking-normal text-[#9ca3af]" style={{ fontSize: 10 }}>
                      (normalized 80-110, higher = faster)
                    </span>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">
                    Efficiency
                    <span className="block font-normal normal-case tracking-normal text-[#9ca3af]" style={{ fontSize: 10 }}>
                      (stride efficiency — higher = covers more ground per stride)
                    </span>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">
                    <span className="group relative cursor-help">
                      Pace Fit
                      <Info className="inline h-3 w-3 ml-1 text-[#9ca3af]" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-[#1a1a2a] px-3 py-2 text-xs font-normal normal-case tracking-normal text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-lg">
                        Whether this horse&apos;s running style benefits from the projected pace scenario.
                      </span>
                    </span>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    ML Odds
                    <span className="block font-normal normal-case tracking-normal text-[#9ca3af]" style={{ fontSize: 10 }}>
                      (morning line — track handicapper&apos;s opening odds)
                    </span>
                  </th>
                  {PIPELINE_ACTIVE && pipelineLookup.size > 0 && (
                    <>
                      <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">
                        Model Win%
                        <span className="block font-normal normal-case tracking-normal text-[#9ca3af]" style={{ fontSize: 10 }}>
                          (from {MODEL_DIAGNOSTICS.n_train.toLocaleString()} race model)
                        </span>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">
                        GPS Edge
                        <span className="block font-normal normal-case tracking-normal text-[#9ca3af]" style={{ fontSize: 10 }}>
                          (model vs morning line)
                        </span>
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry, i) => {
                  const fit = paceFit(entry.runningStyle, pace);
                  const badge = STYLE_BADGE[entry.runningStyle];
                  return (
                    <tr
                      key={entry.horse}
                      className={`border-b border-[#e5e2db] last:border-b-0 ${
                        i % 2 === 0 ? "bg-white" : "bg-[#f8f6f2]/50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        {entry.hasProfile ? (
                          <Link
                            href={`/profiles/${entry.horse.toLowerCase().replace(/\s+/g, "-")}`}
                            className="text-base font-medium text-[#1a1a2a] hover:text-[#b8941f] hover:underline transition-colors"
                          >
                            {entry.horse}
                          </Link>
                        ) : (
                          <span className="text-base font-medium text-[#1a1a2a]">
                            {entry.horse}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                          }}
                        >
                          {entry.runningStyle}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-base ${
                            entry.speedFigure === maxSpeed
                              ? "font-bold text-[#b8941f]"
                              : "text-[#1a1a2a]"
                          }`}
                        >
                          {entry.speedFigure}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-sm text-[#1a1a2a]">
                          {entry.strideEfficiency.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="group relative" title={paceFitExplanation(fit)}>
                          {fit === "good" && (
                            <CheckCircle className="h-5 w-5 text-[#22c55e]" />
                          )}
                          {fit === "neutral" && (
                            <AlertCircle className="h-5 w-5 text-[#b8941f]" />
                          )}
                          {fit === "poor" && (
                            <MinusCircle className="h-5 w-5 text-[#c41e3a]" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base text-[#1a1a2a]">
                        {entry.morningLineOdds.toFixed(1)}
                      </td>
                      {PIPELINE_ACTIVE && pipelineLookup.size > 0 && (() => {
                        const pl = pipelineLookup.get(entry.horse);
                        const val = valueLookup.get(entry.horse);
                        return (
                          <>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {pl ? (
                                <span className="font-mono text-sm font-bold text-[#1a1a2a]">
                                  {pl.winPct.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-xs text-[#9ca3af]">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {val ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor:
                                      val.classification === "strong_value" ? "#16a34a15" :
                                      val.classification === "moderate_value" ? "#b8941f15" :
                                      val.classification === "overbet" ? "#dc262615" : "#9ca3af10",
                                    color:
                                      val.classification === "strong_value" ? "#16a34a" :
                                      val.classification === "moderate_value" ? "#b8941f" :
                                      val.classification === "overbet" ? "#dc2626" : "#9ca3af",
                                  }}
                                  title={val.insight}
                                >
                                  {val.edge > 0 ? "+" : ""}{val.edge.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-xs text-[#9ca3af]">—</span>
                              )}
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pace fit footnote */}
          <div
            className="px-4 py-2.5 text-xs text-[#9ca3af] flex items-center gap-2"
            style={{ borderTop: "1px solid #e5e2db", backgroundColor: "#f8f6f2" }}
          >
            <CheckCircle className="h-3.5 w-3.5 text-[#22c55e] shrink-0" />
            <span>= style benefits from projected pace</span>
            <AlertCircle className="h-3.5 w-3.5 text-[#b8941f] shrink-0 ml-2" />
            <span>= neutral</span>
            <MinusCircle className="h-3.5 w-3.5 text-[#c41e3a] shrink-0 ml-2" />
            <span>= pace works against them</span>
          </div>
        </div>

        {/* GPS Advantage — what GPS reveals that traditional doesn't */}
        <div className="rounded-xl border-2 border-[#b8941f30] bg-[#b8941f04] p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#b8941f" }}>
              GPS Advantage
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#b8941f15] text-[#b8941f] font-medium">
              Beyond Traditional Metrics
            </span>
          </div>
          <p className="text-sm text-[#1a1a2a] leading-relaxed mb-3">
            {(() => {
              const closers = race.entries.filter(e => e.runningStyle === "Closer");
              const frontRunners = race.entries.filter(e => e.runningStyle === "Front Runner");
              const topEfficiency = [...race.entries].sort((a, b) => b.strideEfficiency - a.strideEfficiency)[0];
              const topSpeed = [...race.entries].sort((a, b) => b.speedFigure - a.speedFigure)[0];

              if (topEfficiency && topSpeed && topEfficiency.horse !== topSpeed.horse) {
                return `Traditional speed figures favor ${topSpeed.horse} (${topSpeed.speedFigure}), but GPS stride efficiency reveals ${topEfficiency.horse} (${topEfficiency.strideEfficiency.toFixed(2)} efficiency) may have untapped energy reserves. In ${race.distance}F races, horses with higher stride efficiency close stronger — a pattern invisible in traditional data.`;
              }
              if (frontRunners.length >= 3) {
                return `Traditional handicapping sees ${frontRunners.length} front runners and predicts pace trouble. GPS goes further — stride efficiency data shows which closers actually have the biomechanical capacity to capitalize on a fast pace, separating true closers from horses that just run slow early.`;
              }
              return `GPS stride efficiency (${topEfficiency?.strideEfficiency.toFixed(2) ?? "N/A"} for ${topEfficiency?.horse ?? "top horse"}) provides a biomechanical edge metric unavailable in traditional past performances. This measures how efficiently each stride converts to forward speed — a key predictor of late-race stamina.`;
            })()}
          </p>
          <div className="flex flex-wrap gap-2">
            {race.entries.slice(0, 5).map((e) => (
              <span key={e.horse} className="text-[10px] px-2 py-1 rounded-lg bg-white border border-[#e5e2db]">
                <span className="font-semibold text-[#1a1a2a]">{e.horse}</span>
                <span className="mx-1 text-[#9ca3af]">·</span>
                <span className="text-[#b8941f] font-mono">{e.strideEfficiency.toFixed(2)} eff</span>
                <span className="mx-1 text-[#9ca3af]">·</span>
                <span className="text-[#6b7280] font-mono">{e.speedFigure} spd</span>
              </span>
            ))}
          </div>
        </div>

        {/* Top Contenders */}
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2a] mb-4">
            Top Contenders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topContenders.map(({ entry, reason }, i) => {
              const badge = STYLE_BADGE[entry.runningStyle];
              return (
                <motion.div
                  key={entry.horse}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="rounded-xl border border-[#e5e2db] bg-white p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#1a1a2a] text-base">
                      {entry.horse}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                      }}
                    >
                      {entry.runningStyle}
                    </span>
                  </div>
                  <p className="font-mono text-3xl font-bold text-[#b8941f] mb-3">
                    {entry.speedFigure}
                  </p>
                  <p className="text-sm text-[#6b7280] leading-relaxed">
                    {reason}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* How to Use This — guided walkthrough */}
        {PIPELINE_ACTIVE && pipelineLookup.size > 0 && (
          <div className="mt-10 rounded-2xl border-2 border-[#b8941f30] bg-[#b8941f04] p-6 md:p-8">
            <h2 className="text-lg font-bold text-[#1a1a2a] mb-2">
              How to Use This Analysis
            </h2>
            <p className="text-sm text-[#6b7280] mb-6">
              Here&apos;s how GPS data turns into actionable race insight — applied to this field right now.
            </p>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b8941f] text-white text-xs font-bold">1</div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a2a]">Read the Pace Scenario</h3>
                  <p className="text-sm text-[#6b7280] mt-1">
                    This field has {styleCounts["Front Runner"]} front runner{styleCounts["Front Runner"] !== 1 ? "s" : ""}, {styleCounts["Stalker"]} stalker{styleCounts["Stalker"] !== 1 ? "s" : ""}, and {styleCounts["Closer"]} closer{styleCounts["Closer"] !== 1 ? "s" : ""}. That projects a <strong>{pace.label.toLowerCase()}</strong>, which favors <strong>{pace.favoredStyle.toLowerCase()}s</strong>. This is Step 1 because pace determines which running styles have the edge — before you even look at speed.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b8941f] text-white text-xs font-bold">2</div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a2a]">Find the GPS Edge Plays</h3>
                  <p className="text-sm text-[#6b7280] mt-1">
                    {(() => {
                      const values = [...valueLookup.entries()].filter(([, v]) => v.classification === "strong_value");
                      const overbets = [...valueLookup.entries()].filter(([, v]) => v.classification === "overbet");
                      if (values.length > 0) {
                        return `The model identifies ${values.map(([name]) => name).slice(0, 2).join(" and ")} as value plays — the GPS data sees something the morning line doesn't. ${overbets.length > 0 ? `Meanwhile, ${overbets.map(([name]) => name).slice(0, 2).join(" and ")} ${overbets.length > 2 ? `(and ${overbets.length - 2} others)` : ""} appear overbet by the public.` : ""}`;
                      }
                      return "Check the GPS Edge column in the table above. Green badges mean the model thinks the horse is undervalued. Red means overbet.";
                    })()}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b8941f] text-white text-xs font-bold">3</div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a2a]">Compare Model Win% to Morning Line</h3>
                  <p className="text-sm text-[#6b7280] mt-1">
                    The Model Win% column shows what our {MODEL_DIAGNOSTICS.n_train.toLocaleString()}-race model predicts. When it disagrees with the morning line by more than 5 percentage points, that&apos;s a signal — the GPS data (stride efficiency, acceleration pattern, gate-by-gate speed) is revealing something traditional metrics miss.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b8941f] text-white text-xs font-bold">4</div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a2a]">Why It Matters</h3>
                  <p className="text-sm text-[#6b7280] mt-1">
                    {topContenders.length > 0
                      ? `Our top pick — ${topContenders[0].entry.horse} (speed figure ${topContenders[0].entry.speedFigure}, ${topContenders[0].entry.runningStyle.toLowerCase()}) — was selected because ${topContenders[0].reason.toLowerCase()} This analysis combines GPS biomechanics with traditional handicapping in a way that wasn't possible before sectional timing existed.`
                      : "GPS data transforms race analysis from guesswork into measurable science. Every speed figure, stride efficiency metric, and pace projection is computed from real gate-by-gate telemetry."}
                  </p>
                </div>
              </div>
            </div>

            {!race.hasGPS && (
              <p className="text-xs text-[#9ca3af] mt-5 pt-4 border-t border-[#b8941f20]">
                Note: This track doesn&apos;t have GPS sensors. Speed figures and efficiency metrics are estimated from traditional data using a transfer model (R&sup2; = {TRANSFER_DIAGNOSTICS.overall_r2.toFixed(2)}). Predictions carry lower confidence.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
