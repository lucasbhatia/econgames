"use client";

import { motion } from "framer-motion";
import type { RouteResult } from "@/lib/pipeline/types";
import { HORSES } from "@/lib/theme";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface Props {
  result: RouteResult | undefined;
  status: "pending" | "running" | "completed" | "error";
}

export default function StageRoute({ result, status }: Props) {
  if (status === "running" || !result) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <span className="text-sm text-gold">Picking the Horses...</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-5 space-y-5"
    >
      {/* Selected horses */}
      <div className="grid gap-3 sm:grid-cols-2">
        {result.selectedStrategies.map((strat) => {
          const horse = HORSES[strat.horse];
          return (
            <motion.div
              key={strat.horse}
              variants={fadeUp}
              className="rounded-lg bg-cream/[0.02] overflow-hidden"
              style={{ borderLeft: `3px solid ${horse.color}` }}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold" style={{ color: horse.color }}>
                    {horse.name}
                  </span>
                  <span className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                    strat.riskLevel === "safe" ? "bg-emerald-500/15 text-emerald-400"
                    : strat.riskLevel === "moderate" ? "bg-amber-500/15 text-amber-400"
                    : "bg-racing-red/15 text-racing-red"
                  }`}>
                    {strat.riskLevel}
                  </span>
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 flex-1 rounded-full bg-cream/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: horse.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${strat.confidence}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: horse.color }}>
                    {strat.confidence}%
                  </span>
                </div>

                <p className="text-xs text-cream/50 mb-1.5">{strat.reasoning}</p>
                <p className="text-[10px] text-cream/30 italic leading-relaxed">{strat.specificApproach}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Excluded */}
      {result.excludedStrategies.length > 0 && (
        <motion.div variants={fadeUp}>
          <p className="text-[10px] uppercase tracking-wider text-cream/25 mb-2">Sitting Out</p>
          {result.excludedStrategies.map((ex) => {
            const horse = HORSES[ex.horse];
            return (
              <div key={ex.horse} className="flex items-center gap-2 px-3 py-2 rounded bg-cream/[0.02] opacity-50">
                <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: horse.color }} />
                <span className="text-xs text-cream/50">{horse.name}</span>
                <span className="text-[10px] text-cream/30">— {ex.reason}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Out-of-the-box ideas */}
      {result.outOfTheBoxIdeas.length > 0 && (
        <motion.div variants={fadeUp}>
          <p className="text-[10px] uppercase tracking-wider text-silk mb-2">✦ Creative Ideas</p>
          <div className="space-y-2">
            {result.outOfTheBoxIdeas.map((idea, i) => (
              <div key={i} className="rounded-lg border border-silk/20 bg-silk/5 p-3">
                <p className="text-xs text-cream/70 font-semibold mb-1">{idea.idea}</p>
                <p className="text-[10px] text-cream/40">
                  From <span className="text-silk-light">{idea.fromDomain}</span> — {idea.howItApplies}
                </p>
                <span className="text-[10px] mt-1 inline-block" style={{ color: HORSES[idea.assignedTo].color }}>
                  → {HORSES[idea.assignedTo].name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
