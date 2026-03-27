"use client";

import { motion } from "framer-motion";
import { DollarSign, Trophy } from "lucide-react";
import { GOLD, GREEN, BLUE, PURPLE } from "./constants";

export function WinCelebration({ winnerName, totalWinnings }: { winnerName: string; totalWinnings: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
      style={{ background: "rgba(26,26,42,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div className="text-center space-y-3">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{
              x: (Math.random() - 0.5) * 350,
              y: (Math.random() - 0.5) * 250 - 100,
              scale: [0, 1, 0],
              rotate: Math.random() * 720,
            }}
            transition={{ duration: 2.5, delay: Math.random() * 0.4, ease: "easeOut" }}
            className="absolute w-2 h-2 rounded-sm"
            style={{
              background: [GOLD, "#f0d060", GREEN, BLUE, PURPLE, "#fff"][i % 6],
              left: "50%",
              top: "50%",
            }}
          />
        ))}

        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Trophy className="w-16 h-16 mx-auto" style={{ color: GOLD }} />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white"
        >
          Winner!
        </motion.h2>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg font-bold"
          style={{ color: GOLD }}
        >
          {winnerName}
        </motion.div>

        {totalWinnings > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl mt-2"
            style={{ background: `${GREEN}20`, border: `2px solid ${GREEN}` }}
          >
            <DollarSign className="w-5 h-5" style={{ color: GREEN }} />
            <span className="text-2xl font-mono font-bold" style={{ color: GREEN }}>
              +${totalWinnings.toLocaleString()}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
