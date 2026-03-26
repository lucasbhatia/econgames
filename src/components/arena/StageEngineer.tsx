"use client";

import { motion } from "framer-motion";
import type { EngineerResult } from "@/lib/pipeline/types";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface Props {
  result: EngineerResult | undefined;
  status: "pending" | "running" | "completed" | "error";
}

export default function StageEngineer({ result, status }: Props) {
  if (status === "running" || !result) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <span className="text-sm text-gold">Training Day...</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-5 space-y-4"
    >
      {/* Summary bar */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-5 text-xs text-cream/40 px-1">
        <span><strong className="text-cream/60">{result.steps.length}</strong> transforms</span>
        <span><strong className="text-cream/60">{result.newFeatures.length}</strong> new features</span>
        <span><strong className="text-cream/60">{result.droppedRows}</strong> rows dropped</span>
      </motion.div>

      {/* Transform steps */}
      <div className="space-y-2">
        {result.steps.map((step, i) => (
          <motion.div
            key={step.id}
            variants={fadeUp}
            className="flex gap-3 items-start"
          >
            {/* Step connector */}
            <div className="flex flex-col items-center pt-1">
              <div className={`w-2 h-2 rounded-full shrink-0 ${i % 2 === 0 ? "bg-gold" : "bg-track"}`} />
              {i < result.steps.length - 1 && <div className="w-px flex-1 bg-cream/10 mt-1" />}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-3 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-cream/80">{step.operation}</span>
                {step.column && (
                  <span className="font-mono text-[10px] text-cream/30 bg-cream/5 px-1.5 py-0.5 rounded">
                    {step.column}
                  </span>
                )}
                <span className="ml-auto text-[10px] font-mono text-cream/20 shrink-0">
                  {step.beforeSnapshot.rows.toLocaleString()}×{step.beforeSnapshot.cols}
                  <span className="text-gold mx-1">→</span>
                  {step.afterSnapshot.rows.toLocaleString()}×{step.afterSnapshot.cols}
                </span>
              </div>
              <p className="text-xs text-cream/45 leading-relaxed">{step.reasoning}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New features */}
      {result.newFeatures.length > 0 && (
        <motion.div variants={fadeUp}>
          <p className="text-[10px] uppercase tracking-wider text-cream/30 mb-2">New Features Created</p>
          <div className="flex flex-wrap gap-1.5">
            {result.newFeatures.map((f) => (
              <span key={f} className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-400">
                + {f}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
