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
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

const GOLD = "#f5c842";
const BG = "#0d1117";
const BG_CARD = "#161b22";
const BORDER = "#21262d";
const TEXT_DIM = "#8b949e";

/* ------------------------------------------------------------------ */
/*  Track Geometry                                                     */
/* ------------------------------------------------------------------ */

const SVG_W = 720;
const SVG_H = 440;
const CX = SVG_W / 2;
const CY = SVG_H / 2 + 10;

// Outer rail ellipse
const OUTER_RX = 310;
const OUTER_RY = 175;

// Inner rail ellipse
const INNER_RX = 235;
const INNER_RY = 110;

// Track center (where horses run)
const TRACK_RX = (OUTER_RX + INNER_RX) / 2;
const TRACK_RY = (OUTER_RY + INNER_RY) / 2;

// Lane spread
const LANE_SPREAD = (OUTER_RX - INNER_RX) * 0.55;

/** Get position on the track ellipse at normalized progress (0-1).
 *  Horses start at the top-right, run clockwise. */
function getTrackPosition(
  progress: number,
  laneOffset: number // -0.5 to 0.5 (inner to outer)
): { x: number; y: number; angle: number } {
  // Start near the top (just past finish line), go clockwise
  const angle = -Math.PI / 2 + progress * 2 * Math.PI;
  const rx = TRACK_RX + laneOffset * LANE_SPREAD;
  const ry = TRACK_RY + laneOffset * LANE_SPREAD * (TRACK_RY / TRACK_RX);
  return {
    x: CX + rx * Math.cos(angle),
    y: CY + ry * Math.sin(angle),
    angle: angle,
  };
}

/** Create an SVG ellipse path string */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx + rx},${cy} A ${rx},${ry} 0 1,1 ${cx - rx},${cy} Z`;
}

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

/* ------------------------------------------------------------------ */
/*  Checkered Flag Pattern                                             */
/* ------------------------------------------------------------------ */

function CheckeredFlag({ x, y }: { x: number; y: number }) {
  const size = 3;
  const cols = 4;
  const rows = 6;
  return (
    <g transform={`translate(${x - (cols * size) / 2}, ${y - (rows * size) / 2})`}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * size}
            y={r * size}
            width={size}
            height={size}
            fill={(r + c) % 2 === 0 ? "#fff" : "#1a1a1a"}
            opacity={0.9}
          />
        ))
      )}
    </g>
  );
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
  const isGalloping = isRacing && progress > 0 && progress < 1;

  const horseStates = useMemo(() => {
    return horses.map((h, i) => {
      const interp = lerpGate(h.gates, progress, distance);
      const finished = progress >= 1;
      const currentPosition = finished ? h.finish : interp.position;
      const positionOffset = (currentPosition - 1) * 0.035;
      const horseProgress = Math.max(0, Math.min(1, progress - positionOffset));
      const laneOffset = ((i / Math.max(1, n - 1)) - 0.5) * 0.8; // spread across lanes

      return {
        ...h,
        color: colors[i % colors.length],
        currentPosition,
        currentSpeed: interp.speed,
        horseProgress,
        laneOffset,
        lane: i,
      };
    });
  }, [horses, colors, progress, distance, n]);

  const sorted = [...horseStates].sort((a, b) => a.currentPosition - b.currentPosition);
  const leader = sorted[0];

  // Finish line position
  const finishPos = getTrackPosition(0, 0);

  return (
    <div className="w-full select-none rounded-2xl overflow-hidden" style={{ background: BG }}>
      {/* ─── Header Bar ─── */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-3">
          {/* LIVE badge */}
          {isRacing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse-live" style={{ background: "#ef4444" }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
                Live
              </span>
            </div>
          )}
          {isFinished && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40` }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                Official
              </span>
            </div>
          )}
          {!isRacing && !isFinished && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
              style={{ background: "rgba(139,148,158,0.1)", border: `1px solid ${BORDER}` }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM }}>
                Waiting
              </span>
            </div>
          )}

          {/* Distance progress */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: BORDER }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress * 100}%`,
                  background: isFinished
                    ? `linear-gradient(90deg, ${GOLD}, #f0d060)`
                    : "linear-gradient(90deg, #ef4444, #f97316)",
                }}
              />
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: GOLD }}>
              {(progress * distance).toFixed(1)}f / {distance}f
            </span>
          </div>
        </div>

        {/* Leader callout */}
        {leader && (isRacing || isFinished) && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_DIM }}>
              {isFinished ? "Winner" : "Leader"}
            </span>
            <div className="w-3 h-3 rounded-full" style={{
              background: leader.color,
              boxShadow: `0 0 8px ${leader.color}80`,
            }} />
            <span className="text-xs font-bold text-white">{leader.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${GOLD}15`, color: GOLD }}>
              {leader.currentSpeed} ft/s
            </span>
          </div>
        )}
      </div>

      {/* ─── Track SVG ─── */}
      <div className="relative" style={{ padding: "12px 8px 8px" }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ maxHeight: 420 }}
        >
          <defs>
            {/* Grass infield gradient */}
            <radialGradient id="grassGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a4d2e" />
              <stop offset="60%" stopColor="#15402a" />
              <stop offset="100%" stopColor="#0f3321" />
            </radialGradient>

            {/* Dirt track gradient */}
            <radialGradient id="dirtGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#8b7355" />
              <stop offset="50%" stopColor="#7a6548" />
              <stop offset="100%" stopColor="#6d5a40" />
            </radialGradient>

            {/* Glow filter for horse dots */}
            <filter id="horseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Trail glow filter */}
            <filter id="trailGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>

            {/* Finish line pattern */}
            <pattern id="checkerPattern" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="#fff" />
              <rect x="3" y="3" width="3" height="3" fill="#fff" />
              <rect x="3" width="3" height="3" fill="#111" />
              <rect y="3" width="3" height="3" fill="#111" />
            </pattern>
          </defs>

          {/* ── Background ── */}
          <rect width={SVG_W} height={SVG_H} fill={BG} rx="12" />

          {/* ── Outer track area (dirt) ── */}
          <path d={ellipsePath(CX, CY, OUTER_RX, OUTER_RY)} fill="url(#dirtGrad)" />

          {/* ── Outer rail (white) ── */}
          <ellipse
            cx={CX} cy={CY} rx={OUTER_RX} ry={OUTER_RY}
            fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5"
          />

          {/* ── Inner rail (white) ── */}
          <ellipse
            cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY}
            fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"
          />

          {/* ── Grass infield ── */}
          <path d={ellipsePath(CX, CY, INNER_RX - 3, INNER_RY - 3)} fill="url(#grassGrad)" />

          {/* ── Infield grass detail lines ── */}
          {[0.7, 0.5, 0.3].map((scale, i) => (
            <ellipse
              key={i}
              cx={CX} cy={CY}
              rx={INNER_RX * scale}
              ry={INNER_RY * scale}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          ))}

          {/* ── Furlong markers on track ── */}
          {Array.from({ length: 8 }).map((_, i) => {
            const frac = (i + 1) / 8;
            const outerPt = getTrackPosition(frac, 0.5);
            const innerPt = getTrackPosition(frac, -0.5);
            return (
              <g key={i}>
                <line
                  x1={innerPt.x} y1={innerPt.y}
                  x2={outerPt.x} y2={outerPt.y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />
                <text
                  x={(outerPt.x + innerPt.x) / 2}
                  y={(outerPt.y + innerPt.y) / 2 - 6}
                  fill="rgba(255,255,255,0.2)"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {Math.round(frac * distance)}f
                </text>
              </g>
            );
          })}

          {/* ── Finish line ── */}
          {(() => {
            const outerF = getTrackPosition(0, 0.55);
            const innerF = getTrackPosition(0, -0.55);
            const dx = outerF.x - innerF.x;
            const dy = outerF.y - innerF.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <g>
                <line
                  x1={innerF.x} y1={innerF.y}
                  x2={outerF.x} y2={outerF.y}
                  stroke="url(#checkerPattern)"
                  strokeWidth="8"
                  opacity={0.85}
                />
                {/* Checkered flag icon */}
                <CheckeredFlag x={finishPos.x} y={finishPos.y - 22} />
                <text
                  x={finishPos.x}
                  y={finishPos.y - 34}
                  fill={GOLD}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="monospace"
                  textAnchor="middle"
                  letterSpacing="0.1em"
                >
                  FINISH
                </text>
              </g>
            );
          })()}

          {/* ── Horse trails (glowing) ── */}
          {(isRacing || isFinished) && horseStates.map((h) => {
            if (h.horseProgress <= 0.01) return null;
            // Draw a trail arc behind the horse
            const trailPoints: string[] = [];
            const trailLen = Math.min(h.horseProgress, 0.08);
            const steps = 12;
            for (let s = 0; s <= steps; s++) {
              const t = h.horseProgress - trailLen + (trailLen * s) / steps;
              if (t < 0) continue;
              const pt = getTrackPosition(t, h.laneOffset);
              trailPoints.push(`${pt.x},${pt.y}`);
            }
            if (trailPoints.length < 2) return null;
            return (
              <polyline
                key={`trail-${h.name}`}
                points={trailPoints.join(" ")}
                fill="none"
                stroke={h.color}
                strokeWidth="4"
                strokeLinecap="round"
                opacity={0.5}
                filter="url(#trailGlow)"
              />
            );
          })}

          {/* ── Horse dots ── */}
          {horseStates.map((h, i) => {
            const pos = getTrackPosition(
              isRacing || isFinished ? h.horseProgress : 0,
              h.laneOffset
            );

            return (
              <g key={h.name}>
                {/* Glow ring */}
                {(isRacing || isFinished) && h.currentPosition <= 3 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={10}
                    fill="none"
                    stroke={h.color}
                    strokeWidth="1.5"
                    opacity={0.4}
                  />
                )}

                {/* Horse dot */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={h.currentPosition === 1 && (isRacing || isFinished) ? 7 : 6}
                  fill={h.color}
                  stroke="#fff"
                  strokeWidth="1.5"
                  filter={isRacing || isFinished ? "url(#horseGlow)" : undefined}
                  style={{ transition: "cx 0.3s ease, cy 0.3s ease" }}
                />

                {/* Post number label */}
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  fill="#fff"
                  fontSize="8"
                  fontWeight="800"
                  fontFamily="system-ui"
                  textAnchor="middle"
                  style={{ pointerEvents: "none", transition: "x 0.3s ease, y 0.3s ease" }}
                >
                  {i + 1}
                </text>

                {/* Position callout near horse (during racing) */}
                {(isRacing || isFinished) && h.currentPosition <= 3 && (
                  <g style={{ transition: "transform 0.3s ease" }}>
                    <rect
                      x={pos.x + 10}
                      y={pos.y - 8}
                      width={h.name.length * 5.5 + 28}
                      height={16}
                      rx={4}
                      fill={BG_CARD}
                      stroke={h.color}
                      strokeWidth="1"
                      opacity={0.92}
                      style={{ transition: "x 0.3s ease, y 0.3s ease" }}
                    />
                    <text
                      x={pos.x + 14}
                      y={pos.y + 3}
                      fill={h.currentPosition === 1 ? GOLD : "#fff"}
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="system-ui"
                      style={{ transition: "x 0.3s ease, y 0.3s ease" }}
                    >
                      {h.currentPosition === 1 ? "1st" : h.currentPosition === 2 ? "2nd" : "3rd"}{" "}
                      <tspan fill="#fff" fontWeight="600">{h.name}</tspan>
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── Infield Stats ── */}
          <text
            x={CX}
            y={CY - 20}
            fill="#fff"
            fontSize="13"
            fontWeight="800"
            fontFamily="system-ui"
            textAnchor="middle"
            opacity={0.9}
          >
            {isFinished ? "OFFICIAL RESULTS" : isRacing ? "RACE IN PROGRESS" : "AWAITING START"}
          </text>
          <text
            x={CX}
            y={CY + 2}
            fill={GOLD}
            fontSize="22"
            fontWeight="900"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {(progress * distance).toFixed(1)}f / {distance}f
          </text>
          {leader && (isRacing || isFinished) && (
            <text
              x={CX}
              y={CY + 24}
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
              fontFamily="system-ui"
              textAnchor="middle"
            >
              {isFinished ? "Winner" : "Leading"}: {leader.name} ({leader.currentSpeed} ft/s)
            </text>
          )}
        </svg>
      </div>

      {/* ─── Bottom Bar: Top 3 ─── */}
      {(isRacing || isFinished) && (
        <div
          className="flex items-center justify-center gap-6 px-5 py-2.5"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          {sorted.slice(0, 3).map((h, i) => {
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={h.name} className="flex items-center gap-2">
                <span className="text-sm">{medals[i]}</span>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: h.color, boxShadow: `0 0 6px ${h.color}60` }}
                />
                <span
                  className="text-xs font-bold"
                  style={{ color: i === 0 ? GOLD : i === 1 ? "#c0c0c0" : "#cd7f32" }}
                >
                  {h.name}
                </span>
                {isFinished && (
                  <span className="text-[10px] font-mono" style={{ color: TEXT_DIM }}>
                    {h.currentSpeed} ft/s
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Progress Bar ─── */}
      <div className="h-1" style={{ background: BORDER }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            background: isFinished
              ? `linear-gradient(90deg, ${GOLD}, #f0d060)`
              : "linear-gradient(90deg, #ef4444, #f97316)",
            width: `${progress * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
