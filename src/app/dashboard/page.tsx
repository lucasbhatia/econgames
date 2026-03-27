"use client";

import { motion } from "framer-motion";
import { Activity, Trophy, BarChart3, Database } from "lucide-react";
import { HORSES } from "@/lib/theme";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PIPELINE_ACTIVE, MODEL_DIAGNOSTICS, TRANSFER_DIAGNOSTICS, HORSE_SPEED_FIGURES } from "@/lib/data/pipeline-output";

// AUDIT FIX [WARN]: Replace mock stat cards with real pipeline data when available.
const STAT_CARDS = PIPELINE_ACTIVE ? [
  { label: "Races Analyzed", value: MODEL_DIAGNOSTICS.n_train.toLocaleString(), icon: Activity },
  { label: "Prediction Accuracy", value: `${Math.round(MODEL_DIAGNOSTICS.ensemble.r2_val * 100)}%`, icon: Trophy },
  { label: "Avg Error", value: `${MODEL_DIAGNOSTICS.ensemble.mae_val.toFixed(1)} positions`, icon: BarChart3 },
  { label: "Horses Tracked", value: Object.keys(HORSE_SPEED_FIGURES).length.toLocaleString(), icon: Database },
] : [
  { label: "Total Races", value: "—", icon: Activity },
  { label: "Prediction Accuracy", value: "—", icon: Trophy },
  { label: "Avg Error", value: "—", icon: BarChart3 },
  { label: "Horses Tracked", value: "—", icon: Database },
];

const LEADERBOARD = [
  {
    horse: "darkHorse" as const,
    name: "Dark Horse",
    wins: 12,
    avgScore: 84.2,
    bestScore: 96,
    specialty: "Creative & engagement",
  },
  {
    horse: "thoroughbred" as const,
    name: "Thoroughbred",
    wins: 15,
    avgScore: 83.1,
    bestScore: 94,
    specialty: "ML & prediction",
  },
  {
    horse: "sprinter" as const,
    name: "Sprinter",
    wins: 10,
    avgScore: 78.5,
    bestScore: 89,
    specialty: "Statistical baselines",
  },
  {
    horse: "wildcard" as const,
    name: "Wildcard",
    wins: 7,
    avgScore: 76.8,
    bestScore: 92,
    specialty: "Experimental methods",
  },
  {
    horse: "veteran" as const,
    name: "Veteran",
    wins: 3,
    avgScore: 71.2,
    bestScore: 85,
    specialty: "Classical theory",
  },
];

const CHART_DATA = [
  { challenge: "Ch 1", darkHorse: 72, thoroughbred: 68, sprinter: 65, wildcard: 60, veteran: 55 },
  { challenge: "Ch 2", darkHorse: 78, thoroughbred: 74, sprinter: 70, wildcard: 68, veteran: 58 },
  { challenge: "Ch 3", darkHorse: 75, thoroughbred: 80, sprinter: 73, wildcard: 72, veteran: 62 },
  { challenge: "Ch 4", darkHorse: 82, thoroughbred: 79, sprinter: 76, wildcard: 65, veteran: 67 },
  { challenge: "Ch 5", darkHorse: 88, thoroughbred: 85, sprinter: 74, wildcard: 78, veteran: 70 },
  { challenge: "Ch 6", darkHorse: 84, thoroughbred: 87, sprinter: 80, wildcard: 82, veteran: 68 },
  { challenge: "Ch 7", darkHorse: 90, thoroughbred: 86, sprinter: 78, wildcard: 75, veteran: 72 },
  { challenge: "Ch 8", darkHorse: 86, thoroughbred: 88, sprinter: 82, wildcard: 88, veteran: 74 },
  { challenge: "Ch 9", darkHorse: 92, thoroughbred: 90, sprinter: 85, wildcard: 80, veteran: 76 },
  { challenge: "Ch 10", darkHorse: 96, thoroughbred: 94, sprinter: 89, wildcard: 92, veteran: 85 },
];

const RECENT_ACTIVITY = [
  { title: "The Triple Crown Sprint", winner: "darkHorse" as const, score: 96, date: "Mar 24, 2026" },
  { title: "Belmont Regression Stakes", winner: "thoroughbred" as const, score: 94, date: "Mar 20, 2026" },
  { title: "Derby Day Forecast", winner: "wildcard" as const, score: 92, date: "Mar 17, 2026" },
  { title: "Preakness Data Classic", winner: "sprinter" as const, score: 89, date: "Mar 13, 2026" },
  { title: "Breeders' Cup Analysis", winner: "thoroughbred" as const, score: 88, date: "Mar 10, 2026" },
];

// ── Animation helpers ─────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ── Component ─────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-6xl mx-auto pt-20 pb-16 px-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#f5f0e1] tracking-tight">
            The Tote Board
          </h1>
          <p className="mt-2 text-[#f5f0e1]/50 text-lg">
            Performance analytics across all races
          </p>
        </motion.div>

        {/* ── Stat Cards ─────────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                variants={fadeUp}
                className="rounded-xl border border-[#f5f0e1]/10 bg-[#f5f0e1]/[0.02] p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-[#c9a84c]" />
                  <span className="text-[#f5f0e1]/50 text-sm">{card.label}</span>
                </div>
                <p className="font-mono text-3xl text-[#c9a84c] font-semibold">
                  {card.value}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Strategy Leaderboard ────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="rounded-xl border border-[#f5f0e1]/10 bg-[#f5f0e1]/[0.02] p-6 mb-12"
        >
          <h2 className="font-heading text-xl font-bold text-[#f5f0e1] mb-4">
            Strategy Leaderboard
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[#f5f0e1]/40 border-b border-[#f5f0e1]/10">
                  <th className="pb-3 pr-4 font-medium">#</th>
                  <th className="pb-3 pr-4 font-medium">Horse</th>
                  <th className="pb-3 pr-4 font-medium">Wins</th>
                  <th className="pb-3 pr-4 font-medium">Avg Score</th>
                  <th className="pb-3 pr-4 font-medium">Best Score</th>
                  <th className="pb-3 font-medium">Specialty</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD.map((row, i) => (
                  <motion.tr
                    key={row.horse}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                    className="border-b border-[#f5f0e1]/5 last:border-0"
                  >
                    <td className="py-3 pr-4 text-[#f5f0e1]/60 font-mono">
                      {i === 0 ? "🏆" : i + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: HORSES[row.horse].color }}
                        />
                        <span className="text-[#f5f0e1] font-medium">
                          {row.name}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#c9a84c] font-mono">
                      {row.wins}
                    </td>
                    <td className="py-3 pr-4 text-[#f5f0e1]/70 font-mono">
                      {row.avgScore}
                    </td>
                    <td className="py-3 pr-4 text-[#f5f0e1]/70 font-mono">
                      {row.bestScore}
                    </td>
                    <td className="py-3 text-[#f5f0e1]/50 text-xs">
                      {row.specialty}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Performance Chart ───────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-[#f5f0e1]/10 bg-[#f5f0e1]/[0.02] p-6 mb-12"
        >
          <h2 className="font-heading text-xl font-bold text-[#f5f0e1] mb-6">
            Composite Scores Over Time
          </h2>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#c9a84c"
                  strokeOpacity={0.12}
                />
                <XAxis
                  dataKey="challenge"
                  stroke="#f5f0e1"
                  strokeOpacity={0.3}
                  tick={{ fill: "#f5f0e1", fillOpacity: 0.5, fontSize: 12 }}
                />
                <YAxis
                  domain={[50, 100]}
                  stroke="#f5f0e1"
                  strokeOpacity={0.3}
                  tick={{ fill: "#f5f0e1", fillOpacity: 0.5, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1117",
                    border: "1px solid rgba(245,240,225,0.15)",
                    borderRadius: 8,
                    color: "#f5f0e1",
                    fontSize: 13,
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "#f5f0e1", fontSize: 12, opacity: 0.7 }}
                />
                <Line
                  type="monotone"
                  dataKey="darkHorse"
                  name="Dark Horse"
                  stroke={HORSES.darkHorse.color}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="thoroughbred"
                  name="Thoroughbred"
                  stroke={HORSES.thoroughbred.color}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="sprinter"
                  name="Sprinter"
                  stroke={HORSES.sprinter.color}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="wildcard"
                  name="Wildcard"
                  stroke={HORSES.wildcard.color}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="veteran"
                  name="Veteran"
                  stroke={HORSES.veteran.color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Recent Activity Feed ────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-[#f5f0e1]/10 bg-[#f5f0e1]/[0.02] p-6"
        >
          <h2 className="font-heading text-xl font-bold text-[#f5f0e1] mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((entry, i) => (
              <motion.div
                key={entry.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                className="flex items-center justify-between py-3 border-b border-[#f5f0e1]/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: HORSES[entry.winner].color }}
                  />
                  <div>
                    <p className="text-[#f5f0e1] text-sm font-medium">
                      {entry.title}
                    </p>
                    <p className="text-[#f5f0e1]/40 text-xs mt-0.5">
                      {entry.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${HORSES[entry.winner].color}20`,
                      color: HORSES[entry.winner].color,
                    }}
                  >
                    {HORSES[entry.winner].name}
                  </span>
                  <span className="text-[#c9a84c] font-mono text-sm font-semibold">
                    {entry.score}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
