"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Crown, Medal, Trophy, Hash, CircleDot } from "lucide-react";
import { GOLD, BG_WHITE, BG_CARD, TEXT, TEXT_SEC, TEXT_MUTED, BORDER, GREEN, RED } from "./constants";
import type { LeaderboardEntry, SchoolStanding } from "@/lib/supabase/useLeaderboard";

export function SharedLeaderboard({
  entries,
  schoolStandings,
  currentUserId,
  connected,
  loading,
}: {
  entries: LeaderboardEntry[];
  schoolStandings: SchoolStanding[];
  currentUserId?: string;
  connected: boolean;
  loading: boolean;
}) {
  const [tab, setTab] = useState<"players" | "schools">("players");

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-pulse text-xs" style={{ color: TEXT_MUTED }}>Loading leaderboard...</div>
      </div>
    );
  }

  if (entries.length === 0 && !connected) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs" style={{ color: TEXT_MUTED }}>Leaderboard offline</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_SEC }}>
          Leaderboard
        </span>
        {connected && (
          <span className="ml-auto flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}30` }}>
            <CircleDot className="w-2 h-2" /> Live
          </span>
        )}
      </div>

      {/* Pill tab switch */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
        {(["players", "schools"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
            style={{
              background: tab === t ? `${GOLD}15` : "transparent",
              color: tab === t ? GOLD : TEXT_MUTED,
              border: tab === t ? `1px solid ${GOLD}30` : "1px solid transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Players tab */}
      {tab === "players" && (
        <div className="space-y-1">
          {entries.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: TEXT_MUTED }}>No players yet. Be the first!</p>
          ) : entries.slice(0, 10).map((entry, i) => {
            const isYou = entry.id === currentUserId;
            const profit = entry.total_profit;
            const Icon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Trophy : Hash;

            return (
              <motion.div
                key={entry.id}
                layout
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all"
                style={{
                  background: isYou ? `${GOLD}08` : BG_CARD,
                  border: `1px solid ${isYou ? GOLD : BORDER}`,
                  borderLeft: isYou ? `3px solid ${GOLD}` : undefined,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i === 0 ? `${GOLD}20` : i < 3 ? `${TEXT_MUTED}15` : "transparent",
                    color: i === 0 ? GOLD : TEXT_SEC,
                  }}
                >
                  {i < 3 ? <Icon className="w-2.5 h-2.5" /> : <span className="text-[9px] font-mono">{i + 1}</span>}
                </div>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                  style={{ background: `${GOLD}15`, color: GOLD }}
                >
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate" style={{ color: TEXT }}>
                    {entry.name} {isYou && <span className="text-[9px] font-normal" style={{ color: GOLD }}>(you)</span>}
                  </div>
                  <div className="text-[9px] truncate" style={{ color: TEXT_MUTED }}>
                    {entry.school || "No school"} · {entry.races_played}R
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold font-mono" style={{ color: GOLD }}>
                    ${Math.round(entry.bankroll).toLocaleString()}
                  </div>
                  <div className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                    style={{
                      background: profit >= 0 ? `${GREEN}12` : `${RED}12`,
                      color: profit >= 0 ? GREEN : RED,
                    }}>
                    {profit >= 0 ? "+" : ""}{Math.round(profit)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Schools tab */}
      {tab === "schools" && (
        <div className="space-y-1">
          {schoolStandings.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: TEXT_MUTED }}>No school data yet — place bets to represent your school!</p>
          ) : schoolStandings.slice(0, 10).map((school, i) => (
            <motion.div
              key={school.school}
              layout
              className="px-2.5 py-2 rounded-lg"
              style={{
                background: i === 0 ? `${GOLD}06` : BG_WHITE,
                border: `1px solid ${i === 0 ? GOLD : BORDER}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                  style={{
                    background: i === 0 ? GOLD : i < 3 ? `${TEXT_MUTED}20` : BG_CARD,
                    color: i === 0 ? "#fff" : TEXT_SEC,
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate" style={{ color: i === 0 ? GOLD : TEXT }}>
                    {school.school}
                  </div>
                  <div className="text-[9px] flex items-center gap-1" style={{ color: TEXT_MUTED }}>
                    <span>{school.players} player{school.players !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>Avg ${school.avgBankroll.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold font-mono" style={{ color: school.totalProfit > 0 ? GREEN : school.totalProfit < 0 ? RED : TEXT_MUTED }}>
                    {school.totalProfit > 0 ? "+" : ""}{school.totalProfit === 0 ? "$0" : `$${Math.abs(school.totalProfit).toLocaleString()}`}
                  </div>
                  <div className="text-[9px]" style={{ color: TEXT_MUTED }}>
                    {school.players} player{school.players !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
