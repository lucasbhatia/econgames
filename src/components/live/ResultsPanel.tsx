"use client";

import { motion } from "framer-motion";
import { Trophy, Eye } from "lucide-react";
import { GOLD, BG_CARD, TEXT, TEXT_MUTED, BORDER, ORANGE, type RaceCard, type BetResult, formatOddsDisplay } from "./constants";

export function ResultsPanel({
  race,
  finishOrder,
  betResults,
  totalWinnings,
  totalWagered,
}: {
  race: RaceCard;
  finishOrder: string[];
  betResults: BetResult[];
  totalWinnings: number;
  totalWagered: number;
}) {
  const netProfit = totalWinnings - totalWagered;

  return (
    <div className="space-y-5">
      {/* Finish Order */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
          Official Results
        </h3>
        <div className="space-y-1.5">
          {finishOrder.slice(0, 5).map((name, i) => {
            const horse = race.horses.find((h) => h.name === name);
            const badgeColors = [GOLD, "#c0c0c0", "#cd7f32", TEXT_MUTED, TEXT_MUTED];
            const isWinner = i === 0;
            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${isWinner ? "animate-gold-shimmer" : ""}`}
                style={{
                  background: isWinner ? `${GOLD}12` : BG_CARD,
                  border: `1.5px solid ${isWinner ? GOLD : BORDER}`,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: badgeColors[i], color: "#fff" }}
                >
                  {i + 1}
                </div>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: horse?.color ?? TEXT_MUTED, boxShadow: `0 0 6px ${horse?.color ?? TEXT_MUTED}50` }}
                />
                <span className="text-sm font-bold flex-1 truncate" style={{ color: isWinner ? GOLD : "#1a1a2a" }}>
                  {name}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: `${GOLD}10`, color: GOLD }}>
                  {formatOddsDisplay(race.odds[name]?.win ?? 2)}
                </span>
                {isWinner && <Trophy className="w-4 h-4 shrink-0" style={{ color: GOLD }} />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Photo finish indicator for close races */}
      {finishOrder.length >= 2 && (
        (() => {
          const o1 = race.odds[finishOrder[0]]?.win ?? 2;
          const o2 = race.odds[finishOrder[1]]?.win ?? 2;
          const isClose = Math.abs(o1 - o2) < 3;
          if (!isClose) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: `${ORANGE}08`, border: `1px solid ${ORANGE}30` }}
            >
              <Eye className="w-3.5 h-3.5" style={{ color: ORANGE }} />
              <span className="text-[11px] font-semibold" style={{ color: ORANGE }}>
                Photo Finish! {finishOrder[0]} edges {finishOrder[1]}
              </span>
            </motion.div>
          );
        })()
      )}
    </div>
  );
}
