"use client";

import { motion } from "framer-motion";
import type { UnderstandResult } from "@/lib/pipeline/types";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const TYPE_COLORS: Record<string, string> = {
  numeric: "bg-emerald-500/20 text-emerald-400",
  categorical: "bg-blue-500/20 text-blue-400",
  datetime: "bg-purple-500/20 text-purple-400",
  text: "bg-orange-500/20 text-orange-400",
  boolean: "bg-cyan-500/20 text-cyan-400",
};

interface Props {
  result: UnderstandResult | undefined;
  status: "pending" | "running" | "completed" | "error";
}

export default function StageUnderstand({ result, status }: Props) {
  if (status === "running" || !result) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-lg"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
            >
              🏇
            </motion.span>
          ))}
        </motion.div>
        <span className="text-sm text-gold">Reading the Form Guide...</span>
      </div>
    );
  }

  const { prompt, data, matchScore, matchExplanation } = result;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-5"
    >
      {/* Match score banner */}
      <motion.div variants={fadeUp} className="flex items-center gap-4 mb-5 px-4 py-3 rounded-lg bg-cream/[0.03] border border-cream/5">
        <div className="text-center">
          <p className="text-2xl font-bold text-gold font-mono">{matchScore}%</p>
          <p className="text-[9px] uppercase tracking-wider text-cream/30">Match</p>
        </div>
        <div className="h-8 w-px bg-cream/10" />
        <p className="text-xs text-cream/50">{matchExplanation}</p>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* LEFT: Prompt Analysis */}
        <motion.div variants={fadeUp} className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold/60">What You're Asking</h4>

          {/* Classification */}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-semibold text-gold">
              {prompt.classification.type}
            </span>
            <span className="rounded-full bg-silk/20 px-2.5 py-1 text-[10px] font-semibold text-silk-light">
              {prompt.classification.domain}
            </span>
            <span className="rounded-full bg-cream/5 px-2.5 py-1 text-[10px] text-cream/50">
              Complexity {prompt.classification.complexity}/5
            </span>
          </div>

          {/* Requirements */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cream/30 mb-1.5">Requirements</p>
            <ul className="space-y-1">
              {prompt.extractedRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-cream/60">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Assumptions */}
          {prompt.implicitAssumptions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-amber-400/50 mb-1.5">Assumptions</p>
              <ul className="space-y-1">
                {prompt.implicitAssumptions.map((a, i) => (
                  <li key={i} className="text-xs text-amber-300/60 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ambiguities */}
          {prompt.ambiguities.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gold/40 mb-1.5">Ambiguities</p>
              <ul className="space-y-1">
                {prompt.ambiguities.map((a, i) => (
                  <li key={i} className="text-xs text-gold/50 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">?</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* RIGHT: Data Profile */}
        <motion.div variants={fadeUp} className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold/60">What Your Data Shows</h4>

          {/* Quality stats row */}
          <div className="flex gap-4">
            {[
              { label: "Complete", value: `${data.quality.completeness}%`, color: data.quality.completeness > 80 ? "text-emerald-400" : "text-amber-400" },
              { label: "Consistent", value: `${data.quality.typeConsistency}%`, color: "text-emerald-400" },
              { label: "Outliers", value: data.quality.outlierCount.toLocaleString(), color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider text-cream/30">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Key columns */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cream/30 mb-1.5">Key Columns</p>
            <div className="space-y-1">
              {data.columns.map((col) => (
                <div key={col.name} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-cream/[0.02]">
                  <span className="font-mono text-[11px] text-cream/70">{col.name}</span>
                  <div className="flex items-center gap-2">
                    {col.stats?.mean !== undefined && (
                      <span className="text-[10px] text-cream/30 font-mono">
                        μ={col.stats.mean.toFixed(1)}
                      </span>
                    )}
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${TYPE_COLORS[col.inferredType] ?? "text-cream/50"}`}>
                      {col.inferredType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected patterns */}
          <div className="flex flex-wrap gap-1.5">
            {data.timeSeriesDetected && (
              <span className="rounded bg-purple-500/10 px-2 py-1 text-[10px] text-purple-400">Time Series ✓</span>
            )}
            {data.panelDataDetected && (
              <span className="rounded bg-blue-500/10 px-2 py-1 text-[10px] text-blue-400">Panel Data ✓</span>
            )}
            {data.targetVariable && (
              <span className="rounded bg-gold/10 px-2 py-1 text-[10px] text-gold">Target: {data.targetVariable}</span>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
