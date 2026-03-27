"use client";

import { motion } from "framer-motion";
import { GOLD, ORANGE, GREEN, BLUE, RED, BORDER, TEXT, type Phase } from "./constants";
import { formatRaceTimer as formatTimer } from "@/lib/constants/race-timing";

export function TimerRing({ seconds, total, phase, label }: { seconds: number; total: number; phase: Phase; label: string }) {
  const pct = total > 0 ? seconds / total : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const color = phase === "betting" ? GOLD : phase === "post_parade" ? ORANGE : phase === "racing" ? GREEN : BLUE;
  const isUrgent = phase === "betting" && seconds <= 30;

  return (
    <div className="relative w-[88px] h-[88px] flex items-center justify-center">
      <svg width="88" height="88" className="absolute -rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke={BORDER} strokeWidth="3.5" />
        <motion.circle
          cx="44" cy="44" r={radius} fill="none"
          stroke={isUrgent ? RED : color} strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          animate={isUrgent ? { opacity: [1, 0.5, 1] } : {}}
          transition={isUrgent ? { repeat: Infinity, duration: 0.8 } : {}}
        />
      </svg>
      <div className="text-center z-10">
        <div
          className="text-lg font-mono font-bold"
          style={{ color: isUrgent ? RED : TEXT }}
        >
          {formatTimer(seconds)}
        </div>
        <div
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: isUrgent ? RED : color }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
