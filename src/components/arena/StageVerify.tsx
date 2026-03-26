"use client";

import { motion } from "framer-motion";
import type { VerifyResult, VerificationScores } from "@/lib/pipeline/types";
import { HORSES } from "@/lib/theme";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const SCORE_KEYS: (keyof Omit<VerificationScores, "composite">)[] = [
  "accuracy", "economicInsight", "robustness", "creativity", "interpretability", "dataUtilization",
];

const SCORE_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  economicInsight: "Insight",
  robustness: "Robustness",
  creativity: "Creativity",
  interpretability: "Clarity",
  dataUtilization: "Data Use",
};

interface Props {
  result: VerifyResult | undefined;
  status: "pending" | "running" | "completed" | "error";
}

export default function StageVerify({ result, status }: Props) {
  if (status === "running" || !result) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <span className="text-sm text-gold">Photo Finish...</span>
      </div>
    );
  }

  const winnerHorse = HORSES[result.winner];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-5 space-y-5"
    >
      {/* Winner banner */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-lg bg-cream/[0.03] p-4 text-center"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ background: `radial-gradient(circle at 50% 50%, ${winnerHorse.color}, transparent 70%)` }}
        />
        <div className="relative flex items-center justify-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <span className="text-lg font-bold" style={{ color: winnerHorse.color }}>
              {winnerHorse.name}
            </span>
            <span className="text-cream/40 text-xs ml-2">
              Score: <span className="font-mono text-gold">{result.winnerScore}</span>/100
            </span>
          </div>
        </div>
      </motion.div>

      {/* Per-horse verification */}
      {result.verifications.map((v) => {
        const horse = HORSES[v.horse];
        const isWinner = v.horse === result.winner;

        return (
          <motion.div
            key={v.horse}
            variants={fadeUp}
            className={`rounded-lg bg-cream/[0.02] p-4 ${isWinner ? "ring-1 ring-gold/20" : ""}`}
            style={{ borderLeft: `3px solid ${horse.color}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold" style={{ color: horse.color }}>
                {horse.name}
              </span>
              {isWinner && <span className="text-[10px] text-gold">🏆 Winner</span>}
              <span className="ml-auto font-mono text-sm font-bold" style={{ color: horse.color }}>
                {v.scores.composite}
              </span>
            </div>

            {/* Correctness checks — compact inline */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(Object.entries(v.correctness) as [string, boolean][]).map(([key, ok]) => (
                <span key={key} className={`text-[10px] ${ok ? "text-emerald-400" : "text-racing-red"}`}>
                  {ok ? "✓" : "✗"} {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </span>
              ))}
            </div>

            {/* Score bars */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
              {SCORE_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-14 text-[9px] text-cream/30 truncate">{SCORE_LABELS[key]}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-cream/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: horse.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${v.scores[key]}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="w-5 text-right font-mono text-[9px] text-cream/30">{v.scores[key]}</span>
                </div>
              ))}
            </div>

            {/* Unique insight */}
            {v.uniqueInsight && (
              <p className="mt-2 text-[10px] text-cream/35 italic">&ldquo;{v.uniqueInsight}&rdquo;</p>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
