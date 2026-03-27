"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

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

interface RaceReplayProps {
  horses: HorseEntry[];
  colors: string[];
  distance: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GOLD = "#b8941f";
const BG_DARK = "#131a24";
const BG_LANE = "#182231";
const BG_LANE_ALT = "#1c2840";
const TEXT_WHITE = "#e8edf2";
const TEXT_DIM = "#6b7d8d";

const BASE_DURATION = 10; // seconds at 1x
const LANE_HEIGHT = 42;
const LABEL_WIDTH = 120;

/* ------------------------------------------------------------------ */
/*  Inline styles for gallop keyframe (injected once)                  */
/* ------------------------------------------------------------------ */

const GALLOP_CSS = `
@keyframes gallop {
  0%   { transform: translate(-100%, -50%) scaleY(1); }
  25%  { transform: translate(-100%, calc(-50% - 1px)) scaleY(1.06); }
  50%  { transform: translate(-100%, -50%) scaleY(1); }
  75%  { transform: translate(-100%, calc(-50% + 1px)) scaleY(0.94); }
  100% { transform: translate(-100%, -50%) scaleY(1); }
}
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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
/*  Horse Silhouette SVG — compact racing silhouette                   */
/* ------------------------------------------------------------------ */

function HorseSilhouette({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 40 26" fill="none">
      <path
        d="M4 18L8 14L12 12L16 14L20 10L24 12L28 8L32 10L36 8L38 12L36 18L34 22L30 22L28 18L24 22L20 22L18 18L14 22L10 22L8 18L4 22Z"
        fill={color}
        opacity={0.9}
      />
      <circle cx="36" cy="7" r="3" fill={color} />
      <circle cx="37.5" cy="6" r="0.8" fill="white" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RaceReplay({ horses, colors, distance }: RaceReplayProps) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const cssInjectedRef = useRef(false);

  // Inject gallop CSS once
  useEffect(() => {
    if (cssInjectedRef.current) return;
    cssInjectedRef.current = true;
    const style = document.createElement("style");
    style.textContent = GALLOP_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const step = (dt * speed) / BASE_DURATION;
      const next = Math.min(1, progressRef.current + step);
      progressRef.current = next;
      setProgress(next);
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

  const n = horses.length;
  const isGalloping = playing && progress > 0 && progress < 1;
  const isFinished = progress >= 1;

  const horseStates = useMemo(() => {
    return horses.map((h, i) => {
      const interp = lerpGate(h.gates, progress, distance);
      const finished = progress >= 1;
      const currentPosition = finished ? h.finish : interp.position;
      const maxSpread = 0.15 * progress;
      const positionOffset = ((currentPosition - 1) / Math.max(1, n - 1)) * maxSpread;
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

  const togglePlay = () => {
    if (progress >= 1) {
      setProgress(0);
      progressRef.current = 0;
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
  };

  // Furlong markers
  const furlongMarks = [];
  for (let f = 1; f < distance; f++) {
    furlongMarks.push({ furlong: f, pct: f / distance });
  }

  return (
    <div className="w-full select-none rounded-xl overflow-hidden" style={{ background: BG_DARK }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: isFinished ? GOLD : playing ? "#ef4444" : TEXT_DIM }}
          >
            {isFinished ? "Finished" : playing ? "Playing" : "Ready"}
          </span>
          <span className="text-xs font-mono font-bold" style={{ color: GOLD }}>
            {(progress * distance).toFixed(1)}f / {distance}f
          </span>
        </div>
        {leader && (progress > 0.05 || isFinished) && (
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: TEXT_DIM }}>
              {isFinished ? "Winner:" : "Leader:"}
            </span>
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: leader.color }} />
            <span className="text-xs font-bold" style={{ color: TEXT_WHITE }}>{leader.name}</span>
            <span className="text-[10px] font-mono" style={{ color: GOLD }}>{leader.currentSpeed} ft/s</span>
          </div>
        )}
      </div>

      {/* Track area */}
      <div className="relative">
        {/* Furlong markers */}
        <div className="relative h-4" style={{ marginLeft: LABEL_WIDTH, marginRight: 24 }}>
          {furlongMarks.map((m) => (
            <div
              key={m.furlong}
              className="absolute top-0 h-full flex items-center"
              style={{ left: `${m.pct * 100}%`, transform: "translateX(-50%)" }}
            >
              <span className="text-[7px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{m.furlong}f</span>
            </div>
          ))}
          <div className="absolute right-0 top-0 h-full flex items-center">
            <span className="text-[7px] font-bold font-mono" style={{ color: "#ef4444" }}>FIN</span>
          </div>
        </div>

        {/* Finish line — checkerboard pattern */}
        <div
          className="absolute top-4 bottom-0 z-10"
          style={{
            right: 20,
            width: 6,
            background: `repeating-linear-gradient(
              45deg,
              #fff 0px, #fff 3px,
              #333 3px, #333 6px
            )`,
            opacity: 0.4,
          }}
        />

        {/* Furlong vertical lines */}
        {furlongMarks.map((m) => (
          <div
            key={`line-${m.furlong}`}
            className="absolute top-4 bottom-0"
            style={{
              left: `calc(${LABEL_WIDTH}px + ${m.pct * 100}% * (1 - ${(LABEL_WIDTH + 24)}px / 100%))`,
              width: 1,
              background: "rgba(255,255,255,0.03)",
            }}
          />
        ))}

        {/* Horse lanes */}
        {horseStates.map((h, i) => {
          const xPct = h.horseX * 100;
          const isLeader = h.currentPosition === 1;
          const isPodium = h.currentPosition <= 3;

          return (
            <div
              key={h.name}
              className="flex items-center relative"
              style={{
                height: LANE_HEIGHT,
                background: i % 2 === 0 ? BG_LANE : BG_LANE_ALT,
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              {/* Lane label */}
              <div className="shrink-0 flex items-center gap-2 px-3" style={{ width: LABEL_WIDTH }}>
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: isLeader && (isGalloping || isFinished) ? GOLD : `${h.color}30`,
                    color: isLeader && (isGalloping || isFinished) ? "#fff" : h.color,
                  }}
                >
                  {(isGalloping || isFinished) ? h.currentPosition : i + 1}
                </div>
                <span
                  className="text-[11px] font-medium truncate"
                  style={{ color: isLeader && (isGalloping || isFinished) ? GOLD : isPodium && (isGalloping || isFinished) ? TEXT_WHITE : TEXT_DIM }}
                >
                  {h.name}
                </span>
              </div>

              {/* Track lane */}
              <div className="flex-1 relative h-full" style={{ marginRight: 28 }}>
                {/* Trail with gradient */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full"
                  style={{
                    left: 0,
                    width: `${xPct}%`,
                    background: `linear-gradient(to right, transparent 0%, ${h.color}25 30%, ${h.color}60 100%)`,
                    willChange: "width",
                    transition: "width 0.06s linear",
                  }}
                />

                {/* Horse — left% for position, keyframe for gallop bounce */}
                <div
                  className="absolute top-1/2"
                  style={{
                    left: `${xPct}%`,
                    transform: "translate(-100%, -50%)",
                    willChange: "left, transform",
                    transition: "left 0.08s linear",
                    animation: isGalloping ? "gallop 0.5s ease-in-out infinite" : "none",
                    transformOrigin: "center bottom",
                  }}
                >
                  <HorseSilhouette color={h.color} size={30} />
                </div>
              </div>

              {/* Position + speed */}
              <div
                className="absolute right-1 flex items-center gap-1 text-[8px] font-mono"
                style={{ color: isPodium && (isGalloping || isFinished) ? GOLD : "rgba(255,255,255,0.2)" }}
              >
                {(isGalloping || isFinished) && (
                  <>
                    <span className="font-bold">{ordinal(h.currentPosition)}</span>
                    <span style={{ color: "rgba(255,255,255,0.15)" }}>{h.currentSpeed}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 3 bar */}
      {isFinished && (
        <div
          className="flex items-center gap-1 px-3 py-2 overflow-x-auto"
          style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {sorted.slice(0, 3).map((h, i) => (
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
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: GOLD, color: "#fff" }}
        >
          {isFinished ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 1l10 6-10 6z" />
            </svg>
          ) : playing ? (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <rect x="1" y="1" width="3.5" height="12" rx="1" />
              <rect x="7.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2 1l10 6-10 6z" />
            </svg>
          )}
        </button>

        {/* Speed buttons */}
        {[1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="px-2 py-1 rounded text-[10px] font-bold transition-colors"
            style={{
              background: speed === s ? GOLD : "rgba(255,255,255,0.06)",
              color: speed === s ? "#fff" : TEXT_DIM,
            }}
          >
            {s}x
          </button>
        ))}

        {/* Timeline scrubber */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={handleScrub}
          onMouseDown={() => setPlaying(false)}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${progress * 100}%, rgba(255,255,255,0.1) ${progress * 100}%, rgba(255,255,255,0.1) 100%)`,
            accentColor: GOLD,
          }}
        />

        {/* Distance readout */}
        <span className="text-xs font-mono font-bold shrink-0" style={{ color: GOLD }}>
          {(progress * distance).toFixed(1)}f
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full"
          style={{
            background: isFinished ? GOLD : "#ef4444",
            width: `${progress * 100}%`,
            transition: "width 0.06s linear",
          }}
        />
      </div>
    </div>
  );
}
