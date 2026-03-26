"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RaceResult, HorseExecution } from "@/lib/pipeline/types";
import { HORSES } from "@/lib/theme";
import type { HorseId } from "@/lib/theme";

const STATUS_LABELS: Record<HorseExecution["status"], { text: string; cls: string }> = {
  gate: { text: "In Gate", cls: "bg-cream/10 text-cream/40" },
  running: { text: "Running", cls: "bg-emerald-500/15 text-emerald-400" },
  stumbled: { text: "Stumbled", cls: "bg-amber-500/15 text-amber-400" },
  recovered: { text: "Recovered", cls: "bg-blue-500/15 text-blue-400" },
  finished: { text: "Finished", cls: "bg-gold/15 text-gold" },
  dnf: { text: "DNF", cls: "bg-racing-red/15 text-racing-red" },
};

interface Props {
  result: RaceResult | undefined;
  status: "pending" | "running" | "completed" | "error";
  executions?: HorseExecution[];
}

export default function StageRace({ result, status, executions }: Props) {
  const [expanded, setExpanded] = useState<HorseId | null>(null);
  const horses: HorseExecution[] = result?.executions ?? executions ?? [];

  if ((status === "running" || status === "pending") && horses.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-xl"
              animate={{ x: [0, 12, 24] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            >
              🏇
            </motion.span>
          ))}
        </motion.div>
        <span className="text-sm text-gold">They're Off!</span>
      </div>
    );
  }

  const sorted = [...horses].sort((a, b) => b.progress - a.progress);

  return (
    <div className="p-5 space-y-2">
      {/* Header bar */}
      <div className="flex items-center justify-between text-[10px] text-cream/30 px-1 mb-1">
        <span>HORSE</span>
        <span>PROGRESS</span>
      </div>

      {sorted.map((exec, rank) => {
        const horse = HORSES[exec.horse];
        const statusMeta = STATUS_LABELS[exec.status];
        const isExpanded = expanded === exec.horse;

        return (
          <div key={exec.horse}>
            <button
              onClick={() => setExpanded(isExpanded ? null : exec.horse)}
              className="w-full rounded-lg bg-cream/[0.02] p-3 text-left hover:bg-cream/[0.04] transition-colors"
              style={{ borderLeft: `3px solid ${horse.color}` }}
            >
              <div className="flex items-center gap-3 mb-2">
                {status === "completed" && (
                  <span className="w-5 h-5 rounded-full bg-cream/5 flex items-center justify-center text-[10px] font-bold text-cream/50">
                    {rank + 1}
                  </span>
                )}
                <span className="text-xs font-bold" style={{ color: horse.color }}>
                  {horse.name}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${statusMeta.cls}`}>
                  {statusMeta.text}
                </span>
                <span className="ml-auto text-[10px] font-mono text-cream/30">
                  {exec.currentStep}/{exec.totalSteps}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 rounded-full bg-cream/5 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: horse.color + "80" }}
                  animate={{ width: `${exec.progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                />
                <motion.span
                  className="absolute top-1/2 -translate-y-1/2 text-[10px] leading-none"
                  animate={{ left: `${Math.min(exec.progress, 95)}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                >
                  🏇
                </motion.span>
              </div>

              {/* Quick results when finished */}
              {exec.status === "finished" && exec.intermediateResults.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {exec.intermediateResults.map((r, i) => (
                    <span key={i} className="text-[10px] text-cream/40">
                      {r.label}: <span className="font-mono text-gold/70">{String(r.value)}</span>
                    </span>
                  ))}
                </div>
              )}
            </button>

            {/* Expanded steps */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-6 border-l border-cream/10 py-2 pl-4 space-y-2">
                    {exec.steps.map((step) => (
                      <div key={step.stepNumber} className="text-xs">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-cream/25">#{step.stepNumber}</span>
                          <span className="font-semibold text-cream/70">{step.action}</span>
                          <span className="ml-auto text-cream/20 text-[10px]">{step.duration}s</span>
                        </div>
                        <p className="text-cream/40 text-[11px]">{step.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
