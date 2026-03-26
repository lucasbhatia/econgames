"use client";

import { motion } from "framer-motion";
import type { IngestResult } from "@/lib/pipeline/types";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  result: IngestResult | undefined;
  status: "pending" | "running" | "completed" | "error";
}

export default function StageIngest({ result, status }: Props) {
  if (status === "running" || !result) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <span className="text-sm text-gold">Loading the Gate...</span>
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
      {/* Data Receipt — compact stat row */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-6">
        {[
          { label: "Files", value: result.fileName },
          { label: "Format", value: result.format.toUpperCase() },
          { label: "Shape", value: `${result.size.rows.toLocaleString()} rows × ${result.size.cols} cols` },
          { label: "Size", value: formatBytes(result.size.bytes) },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[10px] uppercase tracking-wider text-cream/30">{item.label}</p>
            <p className="font-mono text-sm text-cream/80">{item.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Preview Table */}
      {result.preview.length > 0 && (
        <motion.div variants={fadeUp} className="overflow-x-auto rounded-lg border border-cream/5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-cream/[0.03]">
                {Object.keys(result.preview[0]).map((col) => (
                  <th key={col} className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-gold/80 text-[11px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.preview.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-t border-cream/5 hover:bg-cream/[0.02]">
                  {Object.keys(result.preview[0]).map((col) => (
                    <td key={col} className="whitespace-nowrap px-3 py-1.5 font-mono text-cream/60 text-[11px]">
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Issues */}
      {result.errors.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-cream/30 font-semibold">Issues Found</p>
          {result.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-md bg-cream/[0.02]">
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                err.severity === "error" ? "bg-racing-red/20 text-racing-red" : "bg-amber-500/20 text-amber-400"
              }`}>
                {err.severity}
              </span>
              <span className="text-cream/60">{err.issue}</span>
              {err.autoFix && (
                <span className="ml-auto shrink-0 text-emerald-400/60 text-[10px]">Auto-fix: {err.autoFix}</span>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
