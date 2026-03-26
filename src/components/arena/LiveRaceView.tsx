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
  progress: number;      // 0-1
  isRacing: boolean;
  isFinished: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GOLD = "#b8941f";
const BG_DARK = "#1a1a2a";
const TEXT_MUTED = "#9ca3af";

const LANE_HEIGHT = 46;
const TRACK_PADDING_LEFT = 110;
const TRACK_PADDING_RIGHT = 36;

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
/*  Horse Silhouette SVG                                               */
/* ------------------------------------------------------------------ */

function HorseSilhouette({ color, galloping, size = 28 }: { color: string; galloping: boolean; size?: number }) {
  // Simple horse silhouette path
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
      {/* Head */}
      <circle cx="36" cy={galloping ? "5" : "7"} r="3.5" fill={color} />
      {/* Eye */}
      <circle cx="37.5" cy={galloping ? "4" : "6"} r="1" fill="white" />
      {/* Legs */}
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

  // Compute each horse's horizontal position (0-1) based on their race position
  const horseStates = useMemo(() => {
    return horses.map((h, i) => {
      const interp = lerpGate(h.gates, progress, distance);
      const finished = progress >= 1;
      const currentPosition = finished ? h.finish : interp.position;

      // Horse's x progress: leader gets full progress, others trail behind
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

  const totalHeight = n * LANE_HEIGHT + 80; // extra for header/footer

  return (
    <div className="w-full select-none rounded-2xl overflow-hidden" style={{ background: BG_DARK }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isRacing && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 rounded-full"
                style={{ background: "#ef4444" }}
              />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: isFinished ? GOLD : isRacing ? "#ef4444" : TEXT_MUTED }}>
              {isFinished ? "Photo Finish" : isRacing ? "Live" : "Waiting"}
            </span>
          </div>
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
      <div className="relative" style={{ height: n * LANE_HEIGHT + 16, padding: "8px 0" }}>
        {/* Finish line */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            right: TRACK_PADDING_RIGHT,
            width: 3,
            background: `repeating-linear-gradient(180deg, #fff 0px, #fff 4px, ${BG_DARK} 4px, ${BG_DARK} 8px)`,
            opacity: 0.4,
          }}
        />

        {/* Quarter markers */}
        {[0.25, 0.5, 0.75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0"
            style={{
              left: `${TRACK_PADDING_LEFT + mark * (100 - ((TRACK_PADDING_LEFT + TRACK_PADDING_RIGHT) / 10))}%`,
              width: 1,
              background: "rgba(255,255,255,0.06)",
            }}
          />
        ))}

        {/* Horse lanes */}
        {horseStates.map((h, i) => {
          const trackWidth = `calc(100% - ${TRACK_PADDING_LEFT + TRACK_PADDING_RIGHT}px)`;
          const xPercent = h.horseX * 100;

          return (
            <div
              key={h.name}
              className="flex items-center absolute left-0 right-0"
              style={{
                top: i * LANE_HEIGHT + 8,
                height: LANE_HEIGHT,
              }}
            >
              {/* Lane background (alternating) */}
              <div
                className="absolute inset-0"
                style={{
                  background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              />

              {/* Horse name + post position label */}
              <div className="shrink-0 flex items-center gap-1.5 px-2" style={{ width: TRACK_PADDING_LEFT }}>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: h.color }}
                >
                  {i + 1}
                </div>
                <span className="text-[11px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {h.name}
                </span>
              </div>

              {/* Track lane */}
              <div className="flex-1 relative h-full" style={{ marginRight: TRACK_PADDING_RIGHT }}>
                {/* Trail */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-[4px] rounded-full"
                  style={{
                    left: 0,
                    width: `${xPercent}%`,
                    background: `linear-gradient(to right, transparent, ${h.color}40)`,
                    transition: "width 0.2s ease-out",
                  }}
                />

                {/* Horse sprite */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{
                    left: `${xPercent}%`,
                    transform: "translate(-50%, -50%)",
                    transition: "left 0.2s ease-out",
                  }}
                >
                  <HorseSilhouette color={h.color} galloping={isGalloping} size={36} />
                </motion.div>
              </div>

              {/* Current position badge */}
              <div
                className="absolute shrink-0 flex items-center justify-center text-[9px] font-bold font-mono"
                style={{
                  right: 8,
                  width: 24,
                  color: h.currentPosition <= 3 ? GOLD : "rgba(255,255,255,0.3)",
                }}
              >
                {isRacing || isFinished ? (
                  <span>{h.currentPosition}{h.currentPosition === 1 ? "st" : h.currentPosition === 2 ? "nd" : h.currentPosition === 3 ? "rd" : "th"}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar: Top 3 */}
      {(isRacing || isFinished) && (
        <div className="flex items-center gap-4 px-4 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {sorted.slice(0, 3).map((h, i) => {
            const medals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
            return (
              <div key={h.name} className="flex items-center gap-1.5">
                <span className="text-sm">{medals[i]}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: h.color }} />
                <span className="text-[11px] font-bold" style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {h.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full transition-all duration-200"
          style={{ background: isFinished ? GOLD : "#ef4444", width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
