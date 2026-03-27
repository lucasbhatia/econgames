"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GateData {
  g: number;
  spd: number;
}

interface Horse {
  name: string;
  finish: number;
  gates: GateData[];
}

interface SpeedTelemetryProps {
  horses: Horse[];
  colors: string[];
  selectedHorses: number[];
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

function TelemetryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>;
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload].sort((a, b) => b.value - a.value);
  const fastest = sorted[0]?.value ?? 0;
  const slowest = sorted[sorted.length - 1]?.value ?? 0;
  const delta = fastest - slowest;

  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{
        backgroundColor: "#ffffff",
        borderColor: "#21262d",
        color: "#e6edf3",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <p
        className="mb-2 font-semibold uppercase tracking-widest"
        style={{ fontSize: 13, color: "#9ca3af" }}
      >
        Gate {label} &mdash; {label} furlongs
      </p>
      <div className="space-y-1.5">
        {sorted.map((entry) => {
          const diff = entry.value - fastest;
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-6"
              style={{ fontSize: 14 }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span style={{ color: "#374151" }}>{entry.name}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono font-semibold" style={{ color: "#e6edf3" }}>
                  {entry.value.toFixed(1)} ft/s
                </span>
                {diff < 0 && (
                  <span className="font-mono" style={{ fontSize: 13, color: "#ef4444" }}>
                    {diff.toFixed(1)}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {payload.length >= 2 && (
        <div className="mt-2 pt-2" style={{ borderTop: "1px solid #21262d" }}>
          <div className="flex items-center justify-between" style={{ fontSize: 13 }}>
            <span className="uppercase tracking-wider" style={{ color: "#9ca3af" }}>
              Delta
            </span>
            <span className="font-mono font-bold" style={{ color: "#b45309" }}>
              {delta.toFixed(1)} ft/s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Legend                                                      */
/* ------------------------------------------------------------------ */

function TelemetryLegend({
  horses,
  colors,
  selectedHorses,
}: {
  horses: Horse[];
  colors: string[];
  selectedHorses: number[];
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
      {selectedHorses.map((idx) => {
        const horse = horses[idx];
        if (!horse) return null;
        return (
          <div
            key={idx}
            className="flex items-center gap-2"
            style={{ fontSize: 13, color: "#374151" }}
          >
            <span
              className="inline-block h-2 w-6 rounded-full"
              style={{ backgroundColor: colors[idx % colors.length] }}
            />
            <span className="font-medium">{horse.name}</span>
            <span style={{ color: "#9ca3af" }}>P{horse.finish}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Speed Advantage Bar                                                */
/* ------------------------------------------------------------------ */

function SpeedAdvantageBar({
  chartData,
  horses,
  colors,
  selectedHorses,
}: {
  chartData: Record<string, number | undefined>[];
  horses: Horse[];
  colors: string[];
  selectedHorses: number[];
}) {
  const segments = useMemo(() => {
    return chartData.map((point) => {
      let fastestIdx = -1;
      let fastestSpd = -Infinity;

      selectedHorses.forEach((horseIdx) => {
        const spd = point[`horse_${horseIdx}`];
        if (spd !== undefined && spd > fastestSpd) {
          fastestSpd = spd;
          fastestIdx = horseIdx;
        }
      });

      return {
        gate: point.gate,
        fastestIdx,
        fastestSpd,
      };
    });
  }, [chartData, selectedHorses]);

  if (segments.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p
        className="text-center font-semibold uppercase tracking-[0.2em]"
        style={{ fontSize: 12, color: "#9ca3af" }}
      >
        Speed Advantage by Gate
      </p>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        {segments.map((seg, i) => {
          const color = seg.fastestIdx >= 0 ? colors[seg.fastestIdx % colors.length] : "#d1d5db";
          return (
            <motion.div
              key={i}
              className="relative"
              style={{
                flex: 1,
                backgroundColor: color,
                borderRight: i < segments.length - 1 ? "1px solid #ffffff" : undefined,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              title={`Gate ${seg.gate}: ${seg.fastestIdx >= 0 ? horses[seg.fastestIdx]?.name : "—"}`}
            />
          );
        })}
      </div>
      <div
        className="flex justify-between px-1"
        style={{ fontSize: 12, color: "#9ca3af" }}
      >
        <span>Gate 1</span>
        <span>Gate {segments.length}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function SpeedTelemetry({
  horses,
  colors,
  selectedHorses,
}: SpeedTelemetryProps) {
  /* Build unified chart data: one row per gate */
  const { chartData, keyMomentGate } = useMemo(() => {
    /* Find the winner (finish === 1) among selected horses */
    const winnerIdx = selectedHorses.find((i) => horses[i]?.finish === 1);

    /* Collect all unique gates */
    const gateSet = new Set<number>();
    selectedHorses.forEach((idx) => {
      horses[idx]?.gates.forEach((g) => gateSet.add(g.g));
    });
    const gateNumbers = Array.from(gateSet).sort((a, b) => a - b);

    /* Build speed lookup per horse */
    const speedMaps = selectedHorses.map((idx) => {
      const m = new Map<number, number>();
      horses[idx]?.gates.forEach((g) => m.set(g.g, g.spd));
      return m;
    });

    /* Key moment: first gate where the winner is strictly the fastest */
    let keyMoment: number | null = null;

    const data = gateNumbers.map((gate) => {
      const row: Record<string, number | undefined> = { gate };
      selectedHorses.forEach((horseIdx, selIdx) => {
        row[`horse_${horseIdx}`] = speedMaps[selIdx].get(gate);
      });

      /* Detect key moment */
      if (keyMoment === null && winnerIdx !== undefined) {
        const winnerSpd = row[`horse_${winnerIdx}`];
        if (winnerSpd !== undefined) {
          const othersSlower = selectedHorses
            .filter((i) => i !== winnerIdx)
            .every((i) => {
              const s = row[`horse_${i}`];
              return s === undefined || winnerSpd > s;
            });
          if (othersSlower) keyMoment = gate;
        }
      }

      return row;
    });

    return { chartData: data, keyMomentGate: keyMoment };
  }, [horses, selectedHorses]);

  /* Find global Y bounds for a nice scale */
  const { yMin, yMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    selectedHorses.forEach((idx) => {
      horses[idx]?.gates.forEach((g) => {
        if (g.spd < min) min = g.spd;
        if (g.spd > max) max = g.spd;
      });
    });
    const pad = (max - min) * 0.1 || 2;
    return { yMin: Math.floor(min - pad), yMax: Math.ceil(max + pad) };
  }, [horses, selectedHorses]);

  /* Winner info for the key-moment annotation */
  const winnerIdx = selectedHorses.find((i) => horses[i]?.finish === 1);
  const winnerColor =
    winnerIdx !== undefined ? colors[winnerIdx % colors.length] : "#b45309";
  const keyMomentSpeed =
    keyMomentGate !== null && winnerIdx !== undefined
      ? chartData.find((d) => d.gate === keyMomentGate)?.[`horse_${winnerIdx}`]
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full rounded-xl p-5"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #21262d",
      }}
    >
      {/* ---- Header ---- */}
      <div className="mb-4">
        <h3
          className="font-bold uppercase tracking-[0.2em]"
          style={{ fontSize: 14, color: "#e6edf3" }}
        >
          Speed Telemetry
        </h3>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          GPS sector speed trace &mdash; F1 style overlay
        </p>
      </div>

      {/* ---- Chart container ---- */}
      <div className="relative" style={{ minHeight: 300 }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 16, right: 24, bottom: 24, left: 12 }}
          >
            <defs>
              {selectedHorses.map((horseIdx) => {
                const c = colors[horseIdx % colors.length];
                return (
                  <linearGradient
                    key={horseIdx}
                    id={`glow-${horseIdx}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={c} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>

            <CartesianGrid
              stroke="#21262d"
              strokeDasharray="4 6"
              vertical={false}
            />

            <XAxis
              dataKey="gate"
              tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "monospace" }}
              axisLine={{ stroke: "#21262d" }}
              tickLine={false}
              label={{
                value: "Distance (furlongs)",
                position: "insideBottom",
                offset: -14,
                fill: "#6b7280",
                fontSize: 12,
                fontWeight: 600,
                style: { textTransform: "uppercase", letterSpacing: "0.15em" },
              }}
            />

            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: "#6b7280", fontSize: 12, fontFamily: "monospace" }}
              axisLine={{ stroke: "#21262d" }}
              tickLine={false}
              label={{
                value: "Speed (ft/s)",
                angle: -90,
                position: "insideLeft",
                offset: 4,
                fill: "#6b7280",
                fontSize: 12,
                fontWeight: 600,
                style: { textTransform: "uppercase", letterSpacing: "0.15em" },
              }}
            />

            <Tooltip
              content={<TelemetryTooltip />}
              cursor={{
                stroke: "#d1d5db",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
            />

            {/* Key moment reference line */}
            {keyMomentGate !== null && (
              <ReferenceLine
                x={keyMomentGate}
                stroke={winnerColor}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{
                  value: "KEY MOMENT",
                  position: "top",
                  fill: winnerColor,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}

            {/* Speed lines */}
            {selectedHorses.map((horseIdx) => {
              const horse = horses[horseIdx];
              if (!horse) return null;
              const color = colors[horseIdx % colors.length];
              return (
                <Line
                  key={horseIdx}
                  type="monotone"
                  dataKey={`horse_${horseIdx}`}
                  name={horse.name}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 5,
                    stroke: color,
                    strokeWidth: 2,
                    fill: "#ffffff",
                  }}
                  connectNulls
                />
              );
            })}

            {/* Key moment dot on the winner's line */}
            {keyMomentGate !== null &&
              winnerIdx !== undefined &&
              keyMomentSpeed !== undefined && (
                <ReferenceDot
                  x={keyMomentGate}
                  y={keyMomentSpeed}
                  r={6}
                  fill={winnerColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}

            <Legend content={() => null} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Custom legend ---- */}
      <TelemetryLegend horses={horses} colors={colors} selectedHorses={selectedHorses} />

      {/* ---- Speed advantage bar ---- */}
      <SpeedAdvantageBar
        chartData={chartData}
        horses={horses}
        colors={colors}
        selectedHorses={selectedHorses}
      />

      {/* ---- Key moment callout ---- */}
      {keyMomentGate !== null && winnerIdx !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-4 flex items-center gap-3 rounded-lg px-4 py-2.5"
          style={{
            border: "1px solid #21262d",
            backgroundColor: "#fafaf8",
          }}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-black"
            style={{ fontSize: 12, backgroundColor: winnerColor, color: "#ffffff" }}
          >
            G{keyMomentGate}
          </span>
          <p className="leading-relaxed" style={{ fontSize: 13, color: "#6b7280" }}>
            <span className="font-semibold" style={{ color: "#e6edf3" }}>
              {horses[winnerIdx]?.name}
            </span>{" "}
            first took the speed lead at{" "}
            <span className="font-mono font-semibold" style={{ color: "#b45309" }}>
              gate {keyMomentGate}
            </span>{" "}
            ({keyMomentGate} furlongs) — the decisive acceleration that sealed the finish.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
