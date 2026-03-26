"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PixelHorse from "@/components/PixelHorse";

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
  /** 0-1 progress driven externally by the race timer */
  progress: number;
  /** Whether race is actively running */
  isRacing: boolean;
  /** Whether race has finished */
  isFinished: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GOLD = "#b8941f";
const BG = "#f8f6f2";
const BG_WHITE = "#ffffff";
const BG_DARK = "#1a1a2a";
const TEXT = "#1a1a2a";
const TEXT_SEC = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#e5e2db";
const GREEN = "#16a34a";

// Track geometry — larger for better visibility
const CX = 400;
const CY = 230;
const RX_OUTER = 340;
const RY_OUTER = 180;
const RX_INNER = 260;
const RY_INNER = 130;
const RX_MID = (RX_OUTER + RX_INNER) / 2;
const RY_MID = (RY_OUTER + RY_INNER) / 2;
const TRACK_WIDTH = RX_OUTER - RX_INNER;

const TRACK_SURFACE = "#d4c5a0";
const TRACK_OUTER_RAIL = "#e5d9c0";
const INFIELD_GREEN = "#a8c090";
const INFIELD_GREEN_DARK = "#96b080";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function lerpGate(
  gates: GateData[],
  progress: number,
  distance: number
): { furlongs: number; position: number; speed: number } {
  if (gates.length === 0) return { furlongs: 0, position: 99, speed: 0 };
  const currentFurlong = progress * distance;
  let lo = gates[0];
  let hi = gates[gates.length - 1];
  for (let i = 0; i < gates.length - 1; i++) {
    if (gates[i].g <= currentFurlong && gates[i + 1].g >= currentFurlong) {
      lo = gates[i];
      hi = gates[i + 1];
      break;
    }
  }
  if (currentFurlong <= lo.g) return { furlongs: lo.g, position: lo.p, speed: lo.spd };
  if (currentFurlong >= hi.g) return { furlongs: hi.g, position: hi.p, speed: hi.spd };
  const t = (currentFurlong - lo.g) / (hi.g - lo.g || 1);
  return {
    furlongs: currentFurlong,
    position: Math.round(lo.p + (hi.p - lo.p) * t),
    speed: +(lo.spd + (hi.spd - lo.spd) * t).toFixed(1),
  };
}

function progressToXY(
  progress: number,
  laneOffset: number = 0
): { x: number; y: number; angle: number } {
  const angle = -progress * 2 * Math.PI + Math.PI / 2;
  const rx = RX_MID + laneOffset;
  const ry = RY_MID + laneOffset;
  const x = CX + rx * Math.cos(angle);
  const y = CY + ry * Math.sin(angle);
  const tx = rx * Math.sin(angle);
  const ty = -ry * Math.cos(angle);
  const tangentAngle = Math.atan2(ty, tx);
  return { x, y, angle: tangentAngle };
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx + rx},${cy} A ${rx},${ry} 0 1,0 ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy} Z`;
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

  const interpResults = horses.map((h) => lerpGate(h.gates, progress, distance));

  const horseStates = horses.map((h, i) => {
    const interp = interpResults[i];
    const finished = progress >= 1;
    const currentPosition = finished ? h.finish : interp.position;
    const positionOffset = (currentPosition - 1) * 0.014;
    const horseProgress = Math.max(0, Math.min(1, progress - positionOffset));
    const laneOffset = (currentPosition - 1) * 3.5 - (n * 1.5);
    const { x, y, angle } = progressToXY(horseProgress, laneOffset);

    // Trail dots
    const trail: { x: number; y: number; opacity: number }[] = [];
    for (let ti = 1; ti <= 4; ti++) {
      const tp = Math.max(0, horseProgress - ti * 0.007);
      const trailPt = progressToXY(tp, laneOffset);
      trail.push({ x: trailPt.x, y: trailPt.y, opacity: 0.5 - ti * 0.1 });
    }

    return {
      ...h,
      color: colors[i % colors.length],
      currentPosition,
      currentSpeed: interp.speed,
      x,
      y,
      angle,
      trail,
      horseProgress,
    };
  });

  const sorted = [...horseStates].sort((a, b) => a.currentPosition - b.currentPosition);
  const leadingHorse = sorted[0] ?? null;
  const isGalloping = isRacing && progress > 0 && progress < 1;

  const furlongMarkers = useMemo(() => {
    const markers: { x: number; y: number; label: string }[] = [];
    for (let i = 0; i <= distance; i += 2) {
      const p = i / distance;
      const { x, y } = progressToXY(p, -(TRACK_WIDTH / 2) - 4);
      markers.push({ x, y, label: `${i}f` });
    }
    return markers;
  }, [distance]);

  return (
    <div className="w-full select-none" style={{ background: BG_DARK, borderRadius: 16, overflow: "hidden" }}>
      {/* SVG Track */}
      <div className="relative w-full">
        <svg viewBox="0 0 800 460" className="w-full h-auto" style={{ display: "block" }}>
          <defs>
            <radialGradient id="lr-infieldGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={INFIELD_GREEN} />
              <stop offset="100%" stopColor={INFIELD_GREEN_DARK} />
            </radialGradient>
            <pattern id="lr-checkerboard" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="#1a1a2a" />
              <rect x="3" y="3" width="3" height="3" fill="#1a1a2a" />
              <rect x="3" width="3" height="3" fill="#ffffff" />
              <rect y="3" width="3" height="3" fill="#ffffff" />
            </pattern>
            <filter id="lr-horseShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
            </filter>
            <pattern id="lr-texture" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="transparent" />
              <circle cx="1" cy="1" r="0.3" fill="#00000008" />
            </pattern>
          </defs>

          {/* Dark background */}
          <rect width="800" height="460" fill={BG_DARK} rx="16" />

          {/* Outer track */}
          <path d={ellipsePath(CX, CY, RX_OUTER, RY_OUTER)} fill={TRACK_SURFACE} stroke={TRACK_OUTER_RAIL} strokeWidth="2" />
          <path d={ellipsePath(CX, CY, RX_OUTER, RY_OUTER)} fill="url(#lr-texture)" />

          {/* Infield */}
          <path d={ellipsePath(CX, CY, RX_INNER, RY_INNER)} fill="url(#lr-infieldGrad)" />

          {/* Rails */}
          <ellipse cx={CX} cy={CY} rx={RX_OUTER} ry={RY_OUTER} fill="none" stroke="#ffffff40" strokeWidth="2" />
          <ellipse cx={CX} cy={CY} rx={RX_INNER} ry={RY_INNER} fill="none" stroke="#ffffff40" strokeWidth="2" />

          {/* Lane line */}
          <ellipse cx={CX} cy={CY} rx={RX_MID} ry={RY_MID} fill="none" stroke="#ffffff18" strokeWidth="0.8" strokeDasharray="6 8" />

          {/* Furlong markers */}
          {furlongMarkers.map((m, i) => (
            <text key={i} x={m.x} y={m.y} textAnchor="middle" dominantBaseline="middle" fill={GOLD} fontSize="9" fontWeight="600" fontFamily="monospace" opacity="0.7">
              {m.label}
            </text>
          ))}

          {/* Start gate */}
          {(() => {
            const gTop = progressToXY(0, TRACK_WIDTH / 2 - 5);
            const gBot = progressToXY(0, -(TRACK_WIDTH / 2) + 5);
            return (
              <line x1={gTop.x} y1={gTop.y} x2={gBot.x} y2={gBot.y} stroke={GOLD} strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
            );
          })()}

          {/* Finish line */}
          {(() => {
            const fTop = progressToXY(1, TRACK_WIDTH / 2 - 3);
            const fBot = progressToXY(1, -(TRACK_WIDTH / 2) + 3);
            const dx = fTop.x - fBot.x;
            const dy = fTop.y - fBot.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
            return (
              <rect x={fBot.x - 4} y={fBot.y - 3} width={8} height={len} fill="url(#lr-checkerboard)" transform={`rotate(${ang - 90}, ${fBot.x}, ${fBot.y})`} rx="1" />
            );
          })()}

          {/* Infield info */}
          <text x={CX} y={CY - 35} textAnchor="middle" fill="#ffffff60" fontSize="11" fontWeight="700" fontFamily="sans-serif">
            {isFinished ? "RACE COMPLETE" : isRacing ? "LIVE" : "WAITING"}
          </text>
          <text x={CX} y={CY - 16} textAnchor="middle" fill={GOLD} fontSize="22" fontWeight="800" fontFamily="monospace">
            {(progress * distance).toFixed(1)}f / {distance}f
          </text>
          {leadingHorse && (
            <>
              <text x={CX} y={CY + 6} textAnchor="middle" fill="#ffffff50" fontSize="9" fontFamily="sans-serif">
                LEADER
              </text>
              <text x={CX} y={CY + 22} textAnchor="middle" fill={leadingHorse.color} fontSize="14" fontWeight="700" fontFamily="sans-serif">
                {leadingHorse.name}
              </text>
              <text x={CX} y={CY + 38} textAnchor="middle" fill={GOLD} fontSize="12" fontWeight="600" fontFamily="monospace">
                {leadingHorse.currentSpeed} ft/s
              </text>
            </>
          )}

          {/* Finish results in infield */}
          {isFinished && (
            <>
              {sorted.slice(0, 3).map((h, i) => {
                const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
                const yPos = CY + 56 + i * 18;
                return (
                  <text key={h.name} x={CX} y={yPos} textAnchor="middle" fill={i === 0 ? "#FFD700" : "#ffffff80"} fontSize={i === 0 ? "12" : "10"} fontWeight={i === 0 ? "800" : "600"} fontFamily="sans-serif">
                    {medals[i]} {h.name}
                  </text>
                );
              })}
            </>
          )}

          {/* Horse trails */}
          {horseStates.map((h) =>
            h.trail.map((t, ti) => (
              <circle key={`t-${h.name}-${ti}`} cx={t.x} cy={t.y} r={2.5} fill={h.color} opacity={t.opacity} />
            ))
          )}

          {/* Horses */}
          {horseStates.map((h) => {
            const angleDeg = (h.angle * 180) / Math.PI;
            return (
              <g key={h.name} filter="url(#lr-horseShadow)">
                <foreignObject x={h.x - 14} y={h.y - 12} width="28" height="24" style={{ overflow: "visible" }}>
                  <div style={{ width: 24, height: 18, transform: `rotate(${angleDeg}deg)`, transformOrigin: "center center" }}>
                    <PixelHorse color={h.color} size={24} facing="right" galloping={isGalloping} />
                  </div>
                </foreignObject>
                {/* Position label */}
                <text x={h.x} y={h.y - 12} textAnchor="middle" fill={h.color} fontSize="10" fontWeight="800" fontFamily="sans-serif" stroke={BG_DARK} strokeWidth="2.5" paintOrder="stroke">
                  {h.currentPosition}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live position sidebar overlay */}
        {(isRacing || isFinished) && (
          <div className="absolute top-3 right-3 w-[140px] rounded-xl overflow-hidden" style={{ background: "rgba(26,26,42,0.85)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: GOLD, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {isFinished ? "Final Order" : "Live Positions"}
            </div>
            <div className="px-1.5 py-1">
              {sorted.slice(0, 5).map((h, i) => (
                <div key={h.name} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[9px] font-bold font-mono w-3 text-right" style={{ color: i === 0 ? GOLD : "#ffffff60" }}>
                    {i + 1}
                  </span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: h.color }} />
                  <span className="text-[10px] font-medium truncate" style={{ color: i === 0 ? "#fff" : "#ffffff90" }}>
                    {h.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Race progress bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-200" style={{ background: GOLD, width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
