"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PresentResult } from "@/lib/pipeline/types";
import { HORSES } from "@/lib/theme";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const JOURNEY_STEPS: { key: keyof PresentResult["journey"]; label: string }[] = [
  { key: "whatYouAsked", label: "What You Asked" },
  { key: "howWeReadIt", label: "How We Interpreted It" },
  { key: "whatYourDataShowed", label: "What Your Data Showed" },
  { key: "howWePreparedIt", label: "How We Prepared It" },
  { key: "whichApproachesWeTried", label: "Which Approaches We Tried" },
  { key: "whatEachFound", label: "What Each Horse Found" },
  { key: "whyThisOneWon", label: "Why This One Won" },
  { key: "whatSurprisedUs", label: "What Surprised Us" },
];

interface Props {
  result: PresentResult | undefined;
  status: "pending" | "running" | "completed" | "error";
}

export default function StagePresent({ result, status }: Props) {
  const [openStep, setOpenStep] = useState<string | null>(null);

  if (status === "running" || !result) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <span className="text-sm text-gold">Winner's Circle...</span>
      </div>
    );
  }

  const { winner, journey, meta } = result;
  const horse = HORSES[winner.horse];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-5 space-y-6"
    >
      {/* ── Winner Card ── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-xl p-6 text-center"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ background: `radial-gradient(circle at 50% 30%, ${horse.color}, transparent 65%)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-midnight/50" />

        <div className="relative">
          <p className="text-4xl mb-2">🏆</p>
          <h3 className="text-xl font-bold mb-1" style={{ color: horse.color }}>
            {horse.name}
          </h3>
          <p className="text-cream/40 text-sm">
            Composite Score: <span className="font-mono text-gold font-bold text-lg">{winner.compositeScore}</span>/100
          </p>
        </div>
      </motion.div>

      {/* ── Summary ── */}
      <motion.div variants={fadeUp} className="rounded-lg bg-cream/[0.02] p-4">
        <p className="text-sm text-cream/70 leading-relaxed">{winner.summary}</p>
      </motion.div>

      {/* ── Key Findings ── */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] uppercase tracking-widest text-gold/60 mb-3 font-semibold">Key Findings</p>
        <div className="space-y-2">
          {winner.keyFindings.map((finding, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="text-gold mt-0.5 shrink-0 text-xs">◆</span>
              <span className="text-cream/65 leading-relaxed">{finding}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Journey ── */}
      <motion.div variants={fadeUp}>
        <p className="text-[10px] uppercase tracking-widest text-gold/60 mb-3 font-semibold">The Journey — How We Got Here</p>
        <div className="space-y-px rounded-lg overflow-hidden">
          {JOURNEY_STEPS.map((step, i) => {
            const isOpen = openStep === step.key;
            const value = journey[step.key];
            if (Array.isArray(value)) return null;

            return (
              <div key={step.key}>
                <button
                  onClick={() => setOpenStep(isOpen ? null : step.key)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left bg-cream/[0.02] hover:bg-cream/[0.04] transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-cream/60 font-medium">{step.label}</span>
                  <span className="ml-auto text-cream/20 text-xs">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-12 py-3 text-xs text-cream/45 leading-relaxed bg-cream/[0.01]">
                        {value as string}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Explore Next ── */}
      {journey.exploreNext.length > 0 && (
        <motion.div variants={fadeUp}>
          <p className="text-[10px] uppercase tracking-widest text-silk mb-3 font-semibold">Explore Next</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {journey.exploreNext.map((suggestion, i) => (
              <div
                key={i}
                className="rounded-lg border border-silk/15 bg-silk/5 p-3 text-xs text-cream/55 hover:bg-silk/10 transition-colors"
              >
                <span className="text-silk mr-1.5">→</span>{suggestion}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Meta ── */}
      <motion.div variants={fadeUp} className="flex gap-6 text-[10px] text-cream/25 pt-2">
        <span>Duration: {meta.totalDuration.toFixed(1)}s</span>
        <span>Data points: {meta.dataPointsProcessed.toLocaleString()}</span>
      </motion.div>
    </motion.div>
  );
}
