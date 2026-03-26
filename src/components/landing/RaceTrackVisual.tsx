"use client";

import { motion } from "framer-motion";
import { HORSES } from "@/lib/theme";
import { useEffect, useState } from "react";

const horses = [
  { id: "sprinter", ...HORSES.sprinter },
  { id: "thoroughbred", ...HORSES.thoroughbred },
  { id: "darkHorse", ...HORSES.darkHorse },
  { id: "veteran", ...HORSES.veteran },
  { id: "wildcard", ...HORSES.wildcard },
];

export default function RaceTrackVisual() {
  const [positions, setPositions] = useState(horses.map(() => 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          const next = pos + Math.random() * 3 + 0.5;
          return next > 100 ? Math.random() * 10 : next;
        })
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-cream/10 bg-midnight/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-cream/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-racing-red animate-pulse" />
          <span className="text-cream/50 text-xs font-mono uppercase tracking-wider">
            Live Race Preview
          </span>
        </div>
        <span className="text-cream/30 text-xs font-mono">5 strategies racing</span>
      </div>

      {/* Track */}
      <div className="p-6 space-y-3">
        {horses.map((horse, i) => (
          <div key={horse.id} className="flex items-center gap-3">
            {/* Horse name */}
            <div className="w-32 shrink-0 text-right">
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: horse.color }}
              >
                {horse.name}
              </span>
            </div>

            {/* Lane */}
            <div className="flex-1 relative h-8 rounded-lg bg-cream/5 overflow-hidden">
              {/* Track markings */}
              <div className="absolute inset-0 flex">
                {[...Array(10)].map((_, j) => (
                  <div
                    key={j}
                    className="flex-1 border-r border-cream/5 last:border-r-0"
                  />
                ))}
              </div>

              {/* Horse position */}
              <motion.div
                className="absolute top-1 bottom-1 left-0 rounded-md flex items-center justify-end pr-2"
                style={{ backgroundColor: horse.color + "30" }}
                animate={{ width: `${positions[i]}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <span className="text-sm">🏇</span>
              </motion.div>
            </div>

            {/* Position % */}
            <div className="w-12 shrink-0">
              <span className="text-xs font-mono text-cream/40">
                {Math.round(positions[i])}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Finish line indicator */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2 text-cream/30 text-xs font-mono">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cream/20 to-transparent" />
          <span>FINISH LINE →</span>
        </div>
      </div>
    </div>
  );
}
