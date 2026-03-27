"use client";

import { motion } from "framer-motion";
import { GOLD, BG_WHITE, BG_CARD, TEXT, TEXT_SEC, TEXT_MUTED, BORDER, type RaceCard } from "./constants";

export function PostParadeOverlay({ race, timer }: { race: RaceCard; timer: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
    >
      <div className="px-6 py-8 text-center space-y-4">
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="space-y-3"
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            Post Parade
          </div>
          <h2 className="text-2xl font-bold" style={{ color: TEXT }}>
            {race.name}
          </h2>
          <div className="text-sm" style={{ color: TEXT_SEC }}>
            {race.track.name} {"·"} {race.distance}F {race.surface} {"·"} {race.condition}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mt-6">
          {race.horses.map((horse, i) => (
            <motion.div
              key={horse.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: BG_WHITE, border: `1px solid ${BORDER}` }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: horse.color, color: "#fff" }}
              >
                {i + 1}
              </div>
              <span className="text-xs font-medium truncate" style={{ color: TEXT }}>
                {horse.name}
              </span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse-live" style={{ background: GOLD }} />
            </motion.div>
          ))}
        </div>

        <motion.div className="mt-6">
          <div
            className="text-5xl font-mono font-bold"
            style={{ color: GOLD }}
          >
            {timer}
          </div>
          <div className="text-xs uppercase tracking-wider mt-1" style={{ color: TEXT_MUTED }}>
            seconds to post
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
