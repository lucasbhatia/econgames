"use client";

import { useState } from "react";
import { GLOSSARY, type GlossaryEntry } from "@/lib/glossary";

/**
 * Wraps a horse racing or statistical term with a hover/tap tooltip
 * that shows a plain-English explanation. Used throughout the app
 * to make jargon accessible to newcomers.
 *
 * Usage: <GlossaryTerm term="furlong" /> → renders "Race Segment" with tooltip
 * Usage: <GlossaryTerm term="furlong" showOriginal /> → renders "Furlong" with tooltip
 * Usage: <GlossaryTerm term="furlong">6F</GlossaryTerm> → renders "6F" with tooltip
 */
export function GlossaryTerm({
  term,
  children,
  showOriginal = false,
  className = "",
}: {
  /** Key into GLOSSARY (e.g., "furlong", "stride_efficiency") */
  term: string;
  /** Custom display text (overrides label) */
  children?: React.ReactNode;
  /** Show the original technical term instead of the plain-English label */
  showOriginal?: boolean;
  /** Additional CSS classes */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[term];

  if (!entry) {
    // Unknown term — render children or term as-is
    return <span className={className}>{children ?? term}</span>;
  }

  const displayText = children ?? (showOriginal ? entry.term : entry.label);

  return (
    <span
      className={`relative inline-flex items-center gap-0.5 cursor-help ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={() => setOpen((prev) => !prev)}
    >
      <span className="border-b border-dotted border-current">{displayText}</span>
      {open && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-xl bg-[#1a1a2a] px-4 py-3 text-left shadow-xl z-50 pointer-events-none"
          style={{ maxWidth: "calc(100vw - 2rem)" }}
        >
          <span className="block text-xs font-bold text-[#b8941f] mb-1">
            {entry.label}
          </span>
          <span className="block text-xs text-white/90 leading-relaxed">
            {entry.tooltip}
          </span>
          {entry.analogy && (
            <span className="block text-xs text-white/60 leading-relaxed mt-1.5 italic">
              {entry.analogy}
            </span>
          )}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#1a1a2a]" />
        </span>
      )}
    </span>
  );
}

/**
 * Wraps a number with contextual explanation tooltip.
 * Shows the raw number plus a plain-English interpretation.
 */
export function ContextNumber({
  value,
  context,
  unit,
  className = "",
}: {
  /** The formatted number string to display */
  value: string;
  /** Plain-English context (e.g., "faster than 80% of horses") */
  context: string;
  /** Optional unit label */
  unit?: string;
  /** Additional CSS classes */
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex items-baseline gap-1 cursor-help ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={() => setOpen((prev) => !prev)}
    >
      <span>{value}</span>
      {unit && <span className="text-[0.75em] opacity-60">{unit}</span>}
      {open && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl bg-[#1a1a2a] px-4 py-3 text-left shadow-xl z-50 pointer-events-none"
          style={{ maxWidth: "calc(100vw - 2rem)" }}
        >
          <span className="block text-xs text-white/90 leading-relaxed">
            {context}
          </span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#1a1a2a]" />
        </span>
      )}
    </span>
  );
}
