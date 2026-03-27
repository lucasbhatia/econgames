"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ALL_PROFILES, type RunningStyle } from "@/lib/data/horse-profiles";
import Image from "next/image";

type StyleFilter = "All" | RunningStyle;

const STYLE_FILTERS: StyleFilter[] = [
  "All",
  "Front Runner",
  "Stalker",
  "Closer",
];

const STYLE_COLORS: Record<RunningStyle, { bg: string; text: string }> = {
  "Front Runner": { bg: "#1a3a2a18", text: "#1a3a2a" },
  Stalker: { bg: "#5b3e8a18", text: "#5b3e8a" },
  Closer: { bg: "#b8941f18", text: "#b8941f" },
};

function formColor(finish: number): string {
  if (finish <= 3) return "#22c55e";
  if (finish <= 5) return "#b8941f";
  return "#9ca3af";
}

/* -- Small Speed Curve (card thumbnail) ---------------------------------- */

function SpeedCurve({
  data,
  color,
  width = 150,
  height = 35,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = width;
  const h = height;
  const padding = 4;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2);
      const y = h - padding - ((v - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-lg bg-[#f8f6f2] p-1.5">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        className="w-full h-auto"
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function ProfilesPage() {
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("All");

  const filtered = useMemo(() => {
    return ALL_PROFILES.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStyle =
        styleFilter === "All" || p.runningStyle === styleFilter;
      return matchesSearch && matchesStyle;
    });
  }, [search, styleFilter]);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-20 pb-16">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-heading text-3xl text-[#1a1a2a] mb-2">
          Horse Profiles
        </h1>
        <p className="text-[#6b7280] text-base">
          GPS-powered performance cards for every horse
        </p>
      </header>

      {/* Running Style Legend */}
      <div
        className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-4 py-2.5"
        style={{
          backgroundColor: "#f8f6f2",
          border: "1px solid #e5e2db",
        }}
      >
        <span className="text-xs font-medium text-[#9ca3af] mr-1">
          Running styles GPS-classified from GPS gate position data:
        </span>
        <span className="text-xs text-[#6b7280]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#1a3a2a] mr-1.5 align-middle" />
          Front Runner — leads from the start
        </span>
        <span className="text-xs text-[#9ca3af]">&middot;</span>
        <span className="text-xs text-[#6b7280]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#5b3e8a] mr-1.5 align-middle" />
          Stalker — sits mid-pack, moves late
        </span>
        <span className="text-xs text-[#9ca3af]">&middot;</span>
        <span className="text-xs text-[#6b7280]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#b8941f] mr-1.5 align-middle" />
          Closer — starts back, finishes strong
        </span>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#e5e2db] bg-white pl-10 pr-4 py-2 text-base text-[#1a1a2a] placeholder:text-[#9ca3af] outline-none focus:border-[#b8941f] transition-colors"
          />
        </div>

        <span className="text-xs text-[#9ca3af] hidden sm:inline">
          Click any card to view full profile
        </span>

        <div className="flex flex-wrap gap-2">
          {STYLE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStyleFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                styleFilter === f
                  ? "bg-[#b8941f] text-white"
                  : "bg-[#f8f6f2] text-[#6b7280] border border-[#e5e2db] hover:border-[#b8941f]/40"
              }`}
            >
              {f === "All" ? "All" : `${f}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
          key={styleFilter + search}
        >
          {filtered.map((horse) => {
            const styleColor = STYLE_COLORS[horse.runningStyle];
            const slug = horse.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <motion.div key={horse.name} variants={item}>
                <Link
                  href={`/profiles/${slug}`}
                  className="block rounded-2xl border border-[#e5e2db] bg-white hover:shadow-xl hover:border-[#b8941f]/40 transition-all group overflow-hidden"
                >
                  {/* Large horse image — player card style */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden" style={{ background: `${horse.color}08` }}>
                    <Image
                      src={horse.imageUrl}
                      alt={horse.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Running style badge overlay */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
                        style={{ backgroundColor: `${styleColor.text}dd`, color: "#fff" }}
                      >
                        {horse.runningStyle}
                      </span>
                    </div>
                    {/* Form dots overlay */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      {horse.recentForm.slice(0, 5).map((r, i) => (
                        <span key={i} className="inline-block h-2.5 w-2.5 rounded-full border border-white/30" style={{ backgroundColor: formColor(r.finish) }} />
                      ))}
                    </div>
                    {/* Silk color strip at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: horse.color }} />
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-[#1a1a2a] group-hover:text-[#b8941f] transition-colors">
                        {horse.name}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-[#b8941f] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Key stats — clean 3-column */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center py-2 rounded-lg" style={{ background: "#f8f6f2" }}>
                        <p className="font-mono text-base font-bold text-[#1a1a2a]">{horse.topSpeed.toFixed(1)}</p>
                        <p className="text-[10px] text-[#9ca3af] uppercase">Top Speed</p>
                      </div>
                      <div className="text-center py-2 rounded-lg" style={{ background: "#f8f6f2" }}>
                        <p className="font-mono text-base font-bold text-[#1a1a2a]">{horse.strideEfficiency.toFixed(2)}</p>
                        <p className="text-[10px] text-[#9ca3af] uppercase">Efficiency</p>
                      </div>
                      <div className="text-center py-2 rounded-lg" style={{ background: "#f8f6f2" }}>
                        <p className="font-mono text-base font-bold" style={{ color: horse.avgFinish <= 3 ? "#16a34a" : horse.avgFinish <= 5 ? "#b8941f" : "#1a1a2a" }}>
                          {horse.avgFinish.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-[#9ca3af] uppercase">Avg Finish</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-[#6b7280] text-lg font-medium mb-2">
            No horses found
          </p>
          <p className="text-[#9ca3af] text-sm">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
