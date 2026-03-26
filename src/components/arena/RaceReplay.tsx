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
const BG_DARK = "#1a1a2a";
const BG_LANE = "#1e1e30";
const TEXT_MUTED = "#9ca3af";
const BORDER_DARK = "rgba(255,255,255,0.08)";

const BASE_DURATION = 10; // seconds at 1x
const LANE_HEIGHT = 32;
const LABEL_WIDTH = 100;

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

/* ------------------------------------------------------------------ */
/*  Horse Silhouette                                                   */
/* ------------------------------------------------------------------ */

function HorseSilhouette({ color, galloping, size = 24 }: { color: string; galloping: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 40 28" fill="none">
      <path
        d={galloping
          ? "M2 20L6 14L10 16L14 12L18 14L22 10L26 12L30 8L34 10L38 6L36 14L38 20L34 22L30 18L26 22L22 18L18 22L14 18L10 22L6 18L2 22Z"
          : "M4 18L8 14L12 12L16 14L20 10L24 12L28 8L32 10L36 8L38 12L36 18L34 22L30 22L28 18L24 22L20 22L18 18L14 22L10 22L8 18L4 22Z"
        }
        fill={color}
        opacity={0.9}
      />
      <circle cx="36" cy={galloping ? "5" : "7"} r="3.5" fill={color} />
      <circle cx="37.5" cy={galloping ? "4" : "6"} r="1" fill="white" />
      {galloping ? (
        <>
          <rect x="8" y="20" width="2" height="6" rx="1" fill={color} opacity={0.7} />
          <rect x="14" y="18" width="2" height="8" rx="1" fill={color} opacity={0.7} transform="rotate(-15 14 18)" />
          <rect x="24" y="20" width="2" height="6" rx="1" fill={color} opacity={0.7} />
          <rect x="30" y="16" width="2" height="10" rx="1" fill={color} opacity={0.7} transform="rotate(10 30 16)" />
        </>
      ) : (
        <>
          <rect x="10" y="20" width="2" height="6" rx="1" fill={color} opacity={0.7} />
          <rect x="16" y="20" width="2" height="6" rx="1" fill={color} opacity={0.7} />
          <rect x="24" y="20" width="2" height="6" rx="1" fill={color} opacity={0.7} />
          <rect x="30" y="20" width="2" height="6" rx="1" fill={color} opacity={0.7} />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RaceReplay({ horses, colors, distance }: RaceReplayProps) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  progressRef.current = progress;

  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const increment = (dt * speed) / BASE_DURATION;
      const next = Math.min(progressRef.current + increment, 1);
      setProgress(next);
      progressRef.current = next;
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
      const positionOffset = (currentPosition - 1) * 0.04;
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
  }, [horses, colors, progress, distance]);

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

  return (
    <div className="w-full select-none rounded-xl overflow-hidden" style={{ background: BG_DARK }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${BORDER_DARK}` }}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: isFinished ? GOLD : playing ? "#ef4444" : TEXT_MUTED }}>
            {isFinished ? "Race Complete" : playing ? "Playing" : "Paused"}
          </span>
          <span className="text-xs font-mono" style={{ color: GOLD }}>
            {(progress * distance).toFixed(1)}f / {distance}f
          </span>
        </div>
        {leader && (
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Leader:</span>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: leader.color }} />
            <span className="text-xs font-bold" style={{ color: "#fff" }}>{leader.name}</span>
            <span className="text-[10px] font-mono" style={{ color: GOLD }}>{leader.currentSpeed} ft/s</span>
          </div>
        )}
      </div>

      {/* Race lanes */}
      <div className="relative" style={{ padding: "6px 0" }}>
        {/* Finish line */}
        <div className="absolute top-0 bottom-0" style={{ right: 32, width: 3, background: `repeating-linear-gradient(180deg, #fff 0px, #fff 4px, ${BG_DARK} 4px, ${BG_DARK} 8px)`, opacity: 0.3 }} />

        {/* Quarter markers */}
        {[0.25, 0.5, 0.75].map((mark) => (
          <div key={mark} className="absolute top-0 bottom-0" style={{ left: `${LABEL_WIDTH + mark * (100 - 15)}%`, width: 1, background: "rgba(255,255,255,0.04)" }}>
            <span className="absolute -top-0.5 -translate-x-1/2 text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
              {Math.round(mark * distance)}f
            </span>
          </div>
        ))}

        {horseStates.map((h, i) => {
          const xPercent = h.horseX * 100;
          return (
            <div key={h.name} className="flex items-center relative" style={{ height: LANE_HEIGHT, background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
              {/* Label */}
              <div className="shrink-0 flex items-center gap-1.5 px-2.5" style={{ width: LABEL_WIDTH }}>
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: h.color }}>{i + 1}</div>
                <span className="text-[10px] font-medium truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{h.name}</span>
              </div>

              {/* Track lane */}
              <div className="flex-1 relative h-full" style={{ marginRight: 32 }}>
                {/* Trail */}
                <div className="absolute top-1/2 -translate-y-1/2 h-[2px] rounded-full" style={{ left: 0, width: `${xPercent}%`, background: `linear-gradient(to right, transparent, ${h.color}50)`, transition: "width 0.15s ease-out" }} />
                {/* Horse */}
                <div className="absolute top-1/2" style={{ left: `${xPercent}%`, transform: "translate(-100%, -50%)", transition: "left 0.15s ease-out" }}>
                  <HorseSilhouette color={h.color} galloping={isGalloping} size={22} />
                </div>
              </div>

              {/* Position + speed */}
              <div className="absolute right-1 flex items-center gap-1 text-[8px] font-mono" style={{ color: h.currentPosition <= 3 ? GOLD : "rgba(255,255,255,0.25)" }}>
                <span className="font-bold">{h.currentPosition}</span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>{h.currentSpeed}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 3 bar */}
      {isFinished && (
        <div className="flex items-center gap-4 px-4 py-2" style={{ borderTop: `1px solid ${BORDER_DARK}` }}>
          {sorted.slice(0, 3).map((h, i) => {
            const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
            return (
              <div key={h.name} className="flex items-center gap-1.5">
                <span className="text-sm">{medals[i]}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: h.color }} />
                <span className="text-[10px] font-bold" style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)" }}>{h.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER_DARK}` }}>
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="flex h-8 w-8 items-center justify-center rounded-lg font-bold transition-transform active:scale-90"
          style={{ background: GOLD, color: "#fff", fontSize: 12 }}
        >
          {progress >= 1 ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          ) : playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>

        {/* Speed */}
        {[1, 2, 4].map((s) => (
          <button key={s} onClick={() => setSpeed(s)} className="rounded-full px-2 py-1 font-semibold transition-colors" style={{ background: speed === s ? GOLD : "rgba(255,255,255,0.06)", color: speed === s ? "#fff" : TEXT_MUTED, fontSize: 11 }}>
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
          onMouseDown={() => setPlaying(false)}
          className="flex-1 h-1.5 cursor-pointer appearance-none rounded-full outline-none"
          style={{ background: `linear-gradient(to right, ${GOLD} ${progress * 100}%, rgba(255,255,255,0.1) ${progress * 100}%)` }}
        />

        <span className="text-xs font-mono min-w-[3rem] text-right" style={{ color: GOLD }}>
          {(progress * distance).toFixed(1)}f
        </span>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${GOLD};
          border: 2px solid #fff;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${GOLD};
          border: 2px solid #fff;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
