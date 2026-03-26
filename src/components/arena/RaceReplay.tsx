"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PixelHorse from "@/components/PixelHorse";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GateData {
  g: number; // gate/furlong marker
  p: number; // position at that gate (1 = first)
  spd: number; // speed at that gate
}

interface HorseEntry {
  name: string;
  finish: number;
  odds: number | null;
  gates: GateData[];
}

interface RaceReplayProps {
  horses: HorseEntry[];
  colors: string[];
  distance: number; // total race distance in furlongs
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GOLD = "#b8941f";
const BG = "#f8f6f2";
const BG_WHITE = "#ffffff";
const TEXT_PRIMARY = "#1a1a2a";
const TEXT_SECONDARY = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#e5e2db";

const BASE_DURATION = 8; // seconds at 1x

// Track geometry
const CX = 350;
const CY = 210;
const RX_OUTER = 290;
const RY_OUTER = 155;
const RX_INNER = 220;
const RY_INNER = 110;
const RX_MID = (RX_OUTER + RX_INNER) / 2;
const RY_MID = (RY_OUTER + RY_INNER) / 2;
const TRACK_WIDTH = RX_OUTER - RX_INNER;

// Track colors
const TRACK_SURFACE = "#d4c5a0";
const TRACK_INNER_RAIL = "#c4b590";
const TRACK_OUTER_RAIL = "#e5d9c0";
const INFIELD_GREEN = "#a8c090";
const INFIELD_GREEN_DARK = "#96b080";

// Trail history length
const TRAIL_LENGTH = 4;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Linearly interpolate a value between two gate data-points. */
function lerpGate(
  gates: GateData[],
  progress: number, // 0-1 over the race
  distance: number
): { furlongs: number; position: number; speed: number } {
  if (gates.length === 0)
    return { furlongs: 0, position: 99, speed: 0 };

  const currentFurlong = progress * distance;

  // Find the two surrounding gate entries
  let lo = gates[0];
  let hi = gates[gates.length - 1];

  for (let i = 0; i < gates.length - 1; i++) {
    if (gates[i].g <= currentFurlong && gates[i + 1].g >= currentFurlong) {
      lo = gates[i];
      hi = gates[i + 1];
      break;
    }
  }

  if (currentFurlong <= lo.g)
    return { furlongs: lo.g, position: lo.p, speed: lo.spd };
  if (currentFurlong >= hi.g)
    return { furlongs: hi.g, position: hi.p, speed: hi.spd };

  const t = (currentFurlong - lo.g) / (hi.g - lo.g || 1);
  return {
    furlongs: currentFurlong,
    position: Math.round(lo.p + (hi.p - lo.p) * t),
    speed: +(lo.spd + (hi.spd - lo.spd) * t).toFixed(1),
  };
}

/** Convert progress (0-1) to (x, y) on the oval track.
 *  Counterclockwise from right side (starting gate). */
function progressToXY(
  progress: number,
  laneOffset: number = 0 // 0 = mid track, positive = outward
): { x: number; y: number; angle: number } {
  // Start at right side, go counterclockwise
  const angle = -progress * 2 * Math.PI + Math.PI / 2;
  const rx = RX_MID + laneOffset;
  const ry = RY_MID + laneOffset;
  const x = CX + rx * Math.cos(angle);
  const y = CY + ry * Math.sin(angle);

  // Tangent angle (direction of travel — counterclockwise)
  // Derivative of position w.r.t progress:
  //   dx/dprogress = rx * sin(angle) * 2pi
  //   dy/dprogress = -ry * cos(angle) * 2pi
  // The tangent direction (counterclockwise travel):
  const tx = rx * Math.sin(angle);
  const ty = -ry * Math.cos(angle);
  const tangentAngle = Math.atan2(ty, tx);

  return { x, y, angle: tangentAngle };
}

/** Generate SVG ellipse path string */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx + rx},${cy} A ${rx},${ry} 0 1,0 ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy} Z`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RaceReplay({
  horses,
  colors,
  distance,
}: RaceReplayProps) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0); // 0-1
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  // Trail history: store last N progress values for each horse
  const trailRef = useRef<number[][]>(horses.map(() => []));

  // Keep ref in sync so the rAF closure always sees the latest value.
  progressRef.current = progress;

  /* ---- animation loop ---- */
  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = (timestamp - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = timestamp;

      const increment = (dt * speed) / BASE_DURATION;
      const next = Math.min(progressRef.current + increment, 1);
      setProgress(next);
      progressRef.current = next;

      // Update trail history
      trailRef.current = trailRef.current.map((trail) => {
        const updated = [...trail, next];
        if (updated.length > TRAIL_LENGTH + 1) updated.shift();
        return updated;
      });

      if (next < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    },
    [speed]
  );

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, tick]);

  /* ---- derived state for every horse ---- */
  // First pass: get all positions so we can spread horses out
  const interpResults = horses.map((h) => lerpGate(h.gates, progress, distance));
  const n = horses.length;

  const horseStates = horses.map((h, i) => {
    const interp = interpResults[i];
    const finished = progress >= 1;
    const currentPosition = finished ? h.finish : interp.position;

    // SPREAD horses along the track based on position.
    // Leader gets the base progress, each position behind gets offset backward.
    // This creates visible gaps between horses on the oval.
    const positionOffset = (currentPosition - 1) * 0.012; // ~1.2% of track per position
    const horseProgress = Math.max(0, Math.min(1, progress - positionOffset));

    // Lane offset: leaders hug inside rail, trailers pushed outward
    const laneOffset = (currentPosition - 1) * 3 - (n * 1.5);

    const { x, y, angle } = progressToXY(horseProgress, laneOffset);

    // Trail: just use colored circles behind, no complex interpolation
    const trail: { x: number; y: number; opacity: number }[] = [];
    for (let ti = 1; ti <= 3; ti++) {
      const tp = Math.max(0, horseProgress - ti * 0.008);
      const trailPt = progressToXY(tp, laneOffset);
      trail.push({ x: trailPt.x, y: trailPt.y, opacity: 0.4 - ti * 0.1 });
    }

    return {
      ...h,
      color: colors[i % colors.length],
      currentFurlong: interp.furlongs,
      currentPosition,
      currentSpeed: interp.speed,
      x,
      y,
      angle,
      trail,
      finished,
    };
  });

  // Sort by current position (leader first) for the info panel
  const sorted = [...horseStates].sort(
    (a, b) => a.currentPosition - b.currentPosition
  );

  const currentFurlongMarker = Math.min(
    Math.floor(progress * distance),
    distance
  );

  const leadingHorse = sorted.length > 0 ? sorted[0] : null;

  const isGalloping = playing && progress > 0 && progress < 1;
  const isFinished = progress >= 1;

  /* ---- furlong markers on the track ---- */
  const furlongMarkers = useMemo(() => {
    const markers: { x: number; y: number; label: string; show: boolean }[] = [];
    for (let i = 0; i <= distance; i++) {
      const p = i / distance;
      const { x, y } = progressToXY(p, -(TRACK_WIDTH / 2) - 2);
      markers.push({
        x,
        y,
        label: `${i}f`,
        show: i % 2 === 0 || i === distance, // show every 2 furlongs
      });
    }
    return markers;
  }, [distance]);

  /* ---- controls ---- */
  const togglePlay = () => {
    if (progress >= 1) {
      setProgress(0);
      progressRef.current = 0;
      trailRef.current = horses.map(() => []);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    progressRef.current = val;
    lastTimeRef.current = null;
    trailRef.current = horses.map(() => []);
  };

  /* ---- checkerboard pattern for finish line ---- */
  const finishLinePos = progressToXY(1, 0);
  const finishAngle = finishLinePos.angle;

  return (
    <div
      className="w-full select-none rounded-xl border"
      style={{ color: TEXT_PRIMARY, background: BG, borderColor: BORDER, padding: 16 }}
    >
      {/* ---- Oval Track SVG ---- */}
      <div
        className="relative w-full overflow-hidden rounded-xl border"
        style={{
          background: BG_WHITE,
          borderColor: BORDER,
        }}
      >
        <svg
          viewBox="0 0 700 420"
          className="w-full h-auto"
          style={{ display: "block" }}
        >
          <defs>
            {/* Track gradient */}
            <radialGradient id="trackGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={TRACK_INNER_RAIL} />
              <stop offset="50%" stopColor={TRACK_SURFACE} />
              <stop offset="100%" stopColor={TRACK_OUTER_RAIL} />
            </radialGradient>

            {/* Infield gradient */}
            <radialGradient id="infieldGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={INFIELD_GREEN} />
              <stop offset="100%" stopColor={INFIELD_GREEN_DARK} />
            </radialGradient>

            {/* Checkerboard pattern for finish line */}
            <pattern id="checkerboard" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="3" height="3" fill="#1a1a2a" />
              <rect x="3" y="3" width="3" height="3" fill="#1a1a2a" />
              <rect x="3" width="3" height="3" fill="#ffffff" />
              <rect y="3" width="3" height="3" fill="#ffffff" />
            </pattern>

            {/* Shadow filter for horses */}
            <filter id="horseShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.2" />
            </filter>

            {/* Subtle texture overlay */}
            <pattern id="trackTexture" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="transparent" />
              <circle cx="1" cy="1" r="0.3" fill="#00000008" />
              <circle cx="3" cy="3" r="0.3" fill="#00000005" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="700" height="420" fill={BG_WHITE} rx="12" />

          {/* Outer track body (full ellipse) */}
          <path
            d={ellipsePath(CX, CY, RX_OUTER, RY_OUTER)}
            fill={TRACK_SURFACE}
            stroke={TRACK_OUTER_RAIL}
            strokeWidth="2"
          />

          {/* Track surface texture */}
          <path
            d={ellipsePath(CX, CY, RX_OUTER, RY_OUTER)}
            fill="url(#trackTexture)"
          />

          {/* Inner rail shadow */}
          <path
            d={ellipsePath(CX, CY + 2, RX_INNER + 3, RY_INNER + 3)}
            fill="none"
            stroke="#00000015"
            strokeWidth="4"
          />

          {/* Infield (green inner area) */}
          <path
            d={ellipsePath(CX, CY, RX_INNER, RY_INNER)}
            fill="url(#infieldGrad)"
          />

          {/* Infield decoration — subtle diamond pattern */}
          <path
            d={ellipsePath(CX, CY, RX_INNER - 20, RY_INNER - 15)}
            fill="none"
            stroke="#ffffff18"
            strokeWidth="1"
            strokeDasharray="8 4"
          />

          {/* Outer rail line (white) */}
          <ellipse
            cx={CX}
            cy={CY}
            rx={RX_OUTER}
            ry={RY_OUTER}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Inner rail line (white) */}
          <ellipse
            cx={CX}
            cy={CY}
            rx={RX_INNER}
            ry={RY_INNER}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Lane line (middle of track) */}
          <ellipse
            cx={CX}
            cy={CY}
            rx={RX_MID}
            ry={RY_MID}
            fill="none"
            stroke="#ffffff30"
            strokeWidth="0.8"
            strokeDasharray="6 8"
          />

          {/* Furlong markers on inner rail */}
          {furlongMarkers.map((m, i) => {
            const innerPoint = progressToXY(i / distance, -(TRACK_WIDTH / 2) + 5);
            const outerPoint = progressToXY(i / distance, -(TRACK_WIDTH / 2) - 5);
            return (
              <g key={`furlong-${i}`}>
                {/* Tick mark */}
                <line
                  x1={innerPoint.x}
                  y1={innerPoint.y}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="#ffffff90"
                  strokeWidth="1.5"
                />
                {/* Label (every 2 furlongs) */}
                {m.show && (
                  <text
                    x={m.x}
                    y={m.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={GOLD}
                    fontSize="8"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {m.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Starting gate marker */}
          {(() => {
            const gateTop = progressToXY(0, TRACK_WIDTH / 2 - 5);
            const gateBottom = progressToXY(0, -(TRACK_WIDTH / 2) + 5);
            return (
              <g>
                <line
                  x1={gateTop.x}
                  y1={gateTop.y}
                  x2={gateBottom.x}
                  y2={gateBottom.y}
                  stroke={GOLD}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <text
                  x={gateTop.x + 8}
                  y={gateTop.y - 8}
                  fill={GOLD}
                  fontSize="8"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  START
                </text>
              </g>
            );
          })()}

          {/* Finish line (checkerboard strip across the track) */}
          {(() => {
            const fTop = progressToXY(1, TRACK_WIDTH / 2 - 3);
            const fBot = progressToXY(1, -(TRACK_WIDTH / 2) + 3);
            const dx = fTop.x - fBot.x;
            const dy = fTop.y - fBot.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
            return (
              <g>
                <rect
                  x={fBot.x - 4}
                  y={fBot.y - 3}
                  width={8}
                  height={len}
                  fill="url(#checkerboard)"
                  transform={`rotate(${ang - 90}, ${fBot.x}, ${fBot.y})`}
                  rx="1"
                />
                <text
                  x={fTop.x + 8}
                  y={fTop.y - 8}
                  fill={TEXT_PRIMARY}
                  fontSize="8"
                  fontWeight="700"
                  fontFamily="sans-serif"
                  opacity="0.6"
                >
                  FINISH
                </text>
              </g>
            );
          })()}

          {/* Infield info display */}
          <text
            x={CX}
            y={CY - 30}
            textAnchor="middle"
            fill={TEXT_PRIMARY}
            fontSize="11"
            fontWeight="700"
            fontFamily="sans-serif"
            opacity="0.5"
          >
            {isFinished ? "RACE COMPLETE" : playing ? "LIVE" : "PAUSED"}
          </text>
          <text
            x={CX}
            y={CY - 14}
            textAnchor="middle"
            fill={GOLD}
            fontSize="18"
            fontWeight="800"
            fontFamily="monospace"
          >
            {(progress * distance).toFixed(1)}f / {distance}f
          </text>
          {leadingHorse && (
            <>
              <text
                x={CX}
                y={CY + 8}
                textAnchor="middle"
                fill={TEXT_SECONDARY}
                fontSize="9"
                fontFamily="sans-serif"
              >
                LEADER
              </text>
              <text
                x={CX}
                y={CY + 22}
                textAnchor="middle"
                fill={leadingHorse.color}
                fontSize="13"
                fontWeight="700"
                fontFamily="sans-serif"
              >
                {leadingHorse.name}
              </text>
              <text
                x={CX}
                y={CY + 37}
                textAnchor="middle"
                fill={GOLD}
                fontSize="11"
                fontWeight="600"
                fontFamily="monospace"
              >
                {leadingHorse.currentSpeed} mph
              </text>
            </>
          )}

          {/* Horse trails (colored dots) */}
          {horseStates.map((h) =>
            h.trail.map((t, ti) => (
              <circle
                key={`trail-${h.name}-${ti}`}
                cx={t.x}
                cy={t.y}
                r={2}
                fill={h.color}
                opacity={t.opacity}
              />
            ))
          )}

          {/* Horses on the track */}
          {horseStates.map((h, i) => {
            // Convert tangent angle to degrees for CSS rotation
            // The PixelHorse faces right by default, so 0 degrees = facing right
            const angleDeg = (h.angle * 180) / Math.PI;

            return (
              <g key={h.name} filter="url(#horseShadow)">
                {/* Horse sprite rendered via foreignObject */}
                <foreignObject
                  x={h.x - 12}
                  y={h.y - 10}
                  width="24"
                  height="20"
                  style={{ overflow: "visible" }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 15,
                      transform: `rotate(${angleDeg}deg)`,
                      transformOrigin: "center center",
                    }}
                  >
                    <PixelHorse
                      color={h.color}
                      size={20}
                      facing="right"
                      galloping={isGalloping}
                    />
                  </div>
                </foreignObject>

                {/* Position number badge — small, unobtrusive */}
                {h.currentPosition <= 5 && (
                  <text
                    x={h.x}
                    y={h.y - 8}
                    textAnchor="middle"
                    fill={h.color}
                    fontSize="8"
                    fontWeight="800"
                    fontFamily="sans-serif"
                    stroke={BG_WHITE}
                    strokeWidth="2"
                    paintOrder="stroke"
                  >
                    {h.currentPosition}
                  </text>
                )}

              </g>
            );
          })}

          {/* Finish overlays — podium badges when race is done */}
          {/* Finish results shown in the infield */}
          {isFinished && (
            <>
              {sorted.slice(0, 3).map((h, i) => {
                const badgeColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
                const medals = ["🥇", "🥈", "🥉"];
                const yPos = CY + 50 + i * 20;
                return (
                  <text
                    key={`finish-${h.name}`}
                    x={CX}
                    y={yPos}
                    textAnchor="middle"
                    fill={i === 0 ? badgeColors[0] : TEXT_SECONDARY}
                    fontSize={i === 0 ? "12" : "10"}
                    fontWeight={i === 0 ? "800" : "600"}
                    fontFamily="sans-serif"
                  >
                    {medals[i]} {h.name}
                  </text>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* ---- Controls bar ---- */}
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-lg font-bold transition-transform active:scale-90"
          style={{ background: GOLD, color: BG_WHITE, fontSize: 13 }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {progress >= 1 ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          ) : playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>

        {/* Speed pills */}
        {[1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="rounded-full px-2.5 py-1 font-semibold transition-colors"
            style={{
              background: speed === s ? GOLD : BORDER,
              color: speed === s ? BG_WHITE : TEXT_SECONDARY,
              fontSize: 13,
            }}
          >
            {s}x
          </button>
        ))}

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={handleScrub}
          onMouseDown={() => {
            setPlaying(false);
          }}
          className="race-scrubber ml-1 sm:ml-2 h-1.5 flex-1 min-w-[80px] cursor-pointer appearance-none rounded-full outline-none"
          style={{
            background: `linear-gradient(to right, ${GOLD} ${progress * 100}%, ${BORDER} ${progress * 100}%)`,
          }}
        />

        {/* Elapsed label */}
        <span
          className="min-w-[3rem] text-right font-mono"
          style={{ color: GOLD, fontSize: 12 }}
        >
          {(progress * distance).toFixed(1)}f
        </span>
      </div>

      {/* ---- Inline style for the scrubber thumb ---- */}
      <style jsx>{`
        .race-scrubber::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${GOLD};
          border: 2px solid ${BG_WHITE};
          cursor: pointer;
          box-shadow: 0 0 6px ${GOLD}80;
        }
        .race-scrubber::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${GOLD};
          border: 2px solid ${BG_WHITE};
          cursor: pointer;
          box-shadow: 0 0 6px ${GOLD}80;
        }
      `}</style>

      {/* ---- Info panel ---- */}
      <div
        className="mt-4 rounded-xl border p-3 sm:p-4"
        style={{
          background: BG_WHITE,
          borderColor: BORDER,
        }}
      >
        {/* Header row */}
        <div
          className="mb-3 flex flex-wrap items-center justify-between gap-1"
          style={{ fontSize: 14 }}
        >
          <span style={{ color: GOLD, fontWeight: 600 }}>
            Furlong {currentFurlongMarker} / {distance}
          </span>
          <span style={{ color: TEXT_SECONDARY }}>
            Leader:{" "}
            <span className="font-semibold" style={{ color: GOLD }}>
              {leadingHorse?.name ?? "---"}
            </span>
            {leadingHorse && (
              <span className="ml-2 font-mono" style={{ color: GOLD, fontSize: 12 }}>
                {leadingHorse.currentSpeed} mph
              </span>
            )}
          </span>
        </div>

        {/* Horse rows, sorted by position */}
        <div className="space-y-1.5">
          {sorted.map((h) => (
            <div
              key={h.name}
              className="flex items-center gap-2"
              style={{ fontSize: 14 }}
            >
              {/* Position badge */}
              <span
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full font-bold"
                style={{
                  background: `${h.color}20`,
                  color: h.color,
                  fontSize: 12,
                }}
              >
                {h.currentPosition}
              </span>

              {/* Color dot */}
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: h.color }}
              />

              {/* Name */}
              <span
                className="flex-1 truncate font-medium"
                style={{ color: TEXT_PRIMARY, fontSize: 14 }}
              >
                {h.name}
              </span>

              {/* Speed */}
              <span
                className="font-mono tabular-nums"
                style={{ color: GOLD, opacity: 0.9, fontSize: 12 }}
              >
                {h.currentSpeed} mph
              </span>

              {/* Odds */}
              {h.odds !== null && (
                <span
                  className="font-mono tabular-nums hidden sm:inline"
                  style={{ color: TEXT_MUTED, fontSize: 12 }}
                >
                  ({h.odds.toFixed(1)})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
