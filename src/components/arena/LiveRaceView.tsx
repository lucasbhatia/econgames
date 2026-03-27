"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GateData {
  g: number;
  p: number;
  spd: number;
}

interface HorseEntry {
  name: string;
  finish: number;
  odds: number | null;
  gates: GateData[];
}

interface LiveRaceViewProps {
  horses: HorseEntry[];
  colors: string[];
  distance: number;
  progress: number; // 0-1
  isRacing: boolean;
  isFinished: boolean;
}

/* ------------------------------------------------------------------ */
/*  Theme — broadcast tote board style                                 */
/* ------------------------------------------------------------------ */

const GOLD = "#b8941f";
const BG = "#0f1923";
const BG_LANE = "#162230";
const BG_LANE_ALT = "#1a2940";
const RAIL_COLOR = "#ffffff";
const DIRT_COLOR = "#3d2e1f";
const TEXT_WHITE = "#e8edf2";
const TEXT_DIM = "#6b7d8d";
const FINISH_RED = "#dc2626";
const GREEN = "#16a34a";

/* ------------------------------------------------------------------ */
/*  Interpolation                                                      */
/* ------------------------------------------------------------------ */

function lerpGate(
  gates: GateData[],
  progress: number,
  distance: number
): { position: number; speed: number } {
  if (gates.length === 0) return { position: 99, speed: 0 };
  const cur = progress * distance;
  let lo = gates[0];
  let hi = gates[gates.length - 1];
  for (let i = 0; i < gates.length - 1; i++) {
    if (gates[i].g <= cur && gates[i + 1].g >= cur) {
      lo = gates[i];
      hi = gates[i + 1];
      break;
    }
  }
  if (cur <= lo.g) return { position: lo.p, speed: lo.spd };
  if (cur >= hi.g) return { position: hi.p, speed: hi.spd };
  const t = (cur - lo.g) / (hi.g - lo.g || 1);
  return {
    position: Math.round(lo.p + (hi.p - lo.p) * t),
    speed: +(lo.spd + (hi.spd - lo.spd) * t).toFixed(1),
  };
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LiveRaceView({
  horses,
  colors,
  distance,
  progress,
  isRacing,
  isFinished,
}: LiveRaceViewProps) {
  const n = horses.length;
  const LANE_H = Math.max(28, Math.min(38, 320 / n));

  const horseStates = useMemo(() => {
    return horses.map((h, i) => {
      const interp = lerpGate(h.gates, progress, distance);
      const finished = progress >= 1;
      const currentPosition = finished ? h.finish : interp.position;
      const positionOffset = (currentPosition - 1) * 0.035;
      const horseX = Math.max(0, Math.min(1, progress - positionOffset));

      return {
        ...h,
        color: colors[i % colors.length],
        currentPosition,
        currentSpeed: interp.speed,
        horseX,
        lane: i,
      };
    });
  }, [horses, colors, progress, distance, n]);

  const sorted = [...horseStates].sort((a, b) => a.currentPosition - b.currentPosition);
  const leader = sorted[0];

  // Furlong markers
  const furlongMarks = [];
  for (let f = 1; f < distance; f++) {
    furlongMarks.push({ furlong: f, pct: f / distance });
  }

  return (
    <div className="w-full select-none overflow-hidden" style={{ background: BG, borderRadius: 12 }}>
      {/* ─── Header Bar — broadcast info strip ─── */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          {isRacing && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded"
              style={{ background: "rgba(239,68,68,0.15)" }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#ef4444" }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#ef4444" }}>Live</span>
            </div>
          )}
          {isFinished && (
            <div className="px-2 py-0.5 rounded" style={{ background: `${GOLD}20` }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>Official</span>
            </div>
          )}
          <span className="text-xs font-mono font-bold" style={{ color: GOLD }}>
            {(progress * distance).toFixed(1)}f / {distance}f
          </span>
        </div>

        {leader && (isRacing || isFinished) && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase" style={{ color: TEXT_DIM }}>
              {isFinished ? "Winner" : "Leader"}
            </span>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: leader.color }} />
            <span className="text-xs font-bold" style={{ color: TEXT_WHITE }}>{leader.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${GOLD}15`, color: GOLD }}>
              {leader.currentSpeed} ft/s
            </span>
          </div>
        )}
      </div>

      {/* ─── Track View — horizontal lanes ─── */}
      <div className="relative" style={{ padding: "0" }}>
        {/* Furlong markers along top */}
        <div className="relative h-5 mx-16" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="absolute left-0 top-0 h-full flex items-center">
            <span className="text-[8px] font-mono" style={{ color: TEXT_DIM }}>Start</span>
          </div>
          {furlongMarks.map((m) => (
            <div
              key={m.furlong}
              className="absolute top-0 h-full flex items-center"
              style={{ left: `${m.pct * 100}%`, transform: "translateX(-50%)" }}
            >
              <span className="text-[8px] font-mono" style={{ color: TEXT_DIM }}>{m.furlong}f</span>
            </div>
          ))}
          <div className="absolute right-0 top-0 h-full flex items-center">
            <span className="text-[8px] font-bold font-mono" style={{ color: FINISH_RED }}>FIN</span>
          </div>
        </div>

        {/* Lanes */}
        <div className="relative mx-0">
          {/* Finish line */}
          <div
            className="absolute top-0 bottom-0 z-10"
            style={{
              right: 16,
              width: 4,
              background: `repeating-linear-gradient(180deg, #fff 0px, #fff 4px, #333 4px, #333 8px)`,
              opacity: 0.5,
            }}
          />

          {/* Horse lanes — sorted by current position for broadcast feel */}
          {sorted.map((h, displayIdx) => {
            const trackWidth = "calc(100% - 32px)";
            const xPct = h.horseX * 100;
            const isLeader = displayIdx === 0;
            const isPodium = displayIdx < 3;

            return (
              <div
                key={h.name}
                className="flex items-center relative"
                style={{
                  height: LANE_H,
                  background: displayIdx % 2 === 0 ? BG_LANE : BG_LANE_ALT,
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                }}
              >
                {/* Position badge + silk color */}
                <div className="shrink-0 flex items-center gap-1.5 pl-2 pr-1" style={{ width: 52 }}>
                  <span
                    className="text-[10px] font-bold font-mono w-4 text-center"
                    style={{ color: isLeader ? GOLD : isPodium ? TEXT_WHITE : TEXT_DIM }}
                  >
                    {h.currentPosition}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ background: h.color, border: isLeader ? `1px solid ${GOLD}` : "none" }}
                  />
                </div>

                {/* Horse name */}
                <div className="shrink-0 w-28 pr-2">
                  <span
                    className="text-[10px] font-semibold truncate block"
                    style={{ color: isLeader ? GOLD : isPodium ? TEXT_WHITE : TEXT_DIM }}
                  >
                    {h.name}
                  </span>
                </div>

                {/* Track lane with horse dot */}
                <div className="flex-1 relative h-full" style={{ marginRight: 20 }}>
                  {/* Dirt track background */}
                  <div className="absolute inset-0" style={{
                    background: `linear-gradient(180deg, rgba(61,46,31,0.15) 0%, rgba(61,46,31,0.05) 100%)`,
                  }} />

                  {/* Rail lines */}
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />

                  {/* Trail behind horse */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full"
                    style={{
                      left: 0,
                      width: `${xPct}%`,
                      background: `linear-gradient(to right, transparent 0%, ${h.color}30 50%, ${h.color}60 100%)`,
                      transition: "width 0.25s ease-out",
                    }}
                  />

                  {/* Horse dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                    style={{
                      left: `${xPct}%`,
                      transform: "translate(-50%, -50%)",
                      transition: "left 0.25s ease-out",
                    }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: isLeader ? 12 : 10,
                        height: isLeader ? 12 : 10,
                        background: h.color,
                        border: `2px solid ${isLeader ? GOLD : "#fff"}`,
                        boxShadow: isLeader ? `0 0 8px ${GOLD}60` : `0 0 4px ${h.color}40`,
                      }}
                    />
                  </div>
                </div>

                {/* Speed readout */}
                <div className="shrink-0 w-12 text-right pr-2">
                  <span className="text-[9px] font-mono" style={{ color: TEXT_DIM }}>
                    {(isRacing || isFinished) ? `${h.currentSpeed}` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Running Order Strip — broadcast-style bottom bar ─── */}
      {(isRacing || isFinished) && (
        <div
          className="flex items-center gap-1 px-3 py-2 overflow-x-auto"
          style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {sorted.slice(0, Math.min(5, n)).map((h, i) => (
            <div key={h.name} className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded"
              style={{
                background: i === 0 ? `${GOLD}15` : "transparent",
                border: i === 0 ? `1px solid ${GOLD}30` : "1px solid transparent",
              }}>
              <span className="text-[10px] font-bold" style={{ color: i === 0 ? GOLD : TEXT_DIM }}>
                {ordinal(i + 1)}
              </span>
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: h.color }} />
              <span className="text-[10px] font-semibold" style={{ color: i === 0 ? TEXT_WHITE : TEXT_DIM }}>
                {h.name}
              </span>
              {i > 0 && (
                <span className="text-[9px] font-mono" style={{ color: TEXT_DIM }}>
                  {((sorted[0].horseX - h.horseX) * distance).toFixed(1)}L
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Progress bar ─── */}
      <div className="h-1" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            background: isFinished ? GOLD : `linear-gradient(90deg, ${FINISH_RED}, #f97316)`,
            width: `${progress * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
