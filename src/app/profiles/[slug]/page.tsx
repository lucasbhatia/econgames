"use client";

import { use } from "react";
import { ALL_PROFILES } from "@/lib/data/horse-profiles";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Zap,
  Activity,
  TrendingUp,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { PIPELINE_ACTIVE, getHorseSpeedFigures } from "@/lib/data/pipeline-output";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function formatFormDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function finishColor(pos: number): string {
  if (pos === 1) return "#b8941f";
  if (pos <= 3) return "#22c55e";
  if (pos <= 5) return "#1a1a2a";
  return "#9ca3af";
}

function formatEarnings(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STYLE_COLORS: Record<string, { bg: string; text: string }> = {
  "Front Runner": { bg: "#1a3a2a18", text: "#1a3a2a" },
  Stalker: { bg: "#5b3e8a18", text: "#5b3e8a" },
  Closer: { bg: "#b8941f18", text: "#b8941f" },
};

/* ── Speed Curve SVG ─────────────────────────────────────────────────────── */

function FullSpeedCurve({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 600;
  const h = 180;
  const px = 48;
  const py = 24;

  const mid = min + range / 2;

  const points = data
    .map((v, i) => {
      const x = px + (i / (data.length - 1)) * (w - px * 2);
      const y = h - py - ((v - min) / range) * (h - py * 2);
      return `${x},${y}`;
    })
    .join(" ");

  // Area fill below curve
  const firstX = px;
  const lastX = px + ((data.length - 1) / (data.length - 1)) * (w - px * 2);
  const areaPoints = `${firstX},${h - py} ${points} ${lastX},${h - py}`;

  // Grid lines
  const gridYValues = [min, mid, max];
  const gridLines = gridYValues.map((v) => {
    const y = h - py - ((v - min) / range) * (h - py * 2);
    return { y, label: v.toFixed(1) };
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className="w-full h-auto"
    >
      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={px}
            y1={g.y}
            x2={w - px}
            y2={g.y}
            stroke="#e5e2db"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <text x={px - 6} y={g.y + 3} fontSize="10" fill="#9ca3af" textAnchor="end">
            {g.label}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      <text x={px} y={h - 4} fontSize="10" fill="#9ca3af" textAnchor="middle">
        Start
      </text>
      <text x={w / 2} y={h - 4} fontSize="10" fill="#9ca3af" textAnchor="middle">
        Mid-race
      </text>
      <text x={w - px} y={h - 4} fontSize="10" fill="#9ca3af" textAnchor="middle">
        Finish
      </text>

      {/* Y axis label */}
      <text
        x="10"
        y={h / 2}
        fontSize="10"
        fill="#9ca3af"
        transform={`rotate(-90 14 ${h / 2})`}
      >
        ft/s
      </text>

      {/* Area fill */}
      <polygon points={areaPoints} fill={color} opacity="0.08" />

      {/* Speed curve line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((v, i) => {
        const x = px + (i / (data.length - 1)) * (w - px * 2);
        const y = h - py - ((v - min) / range) * (h - py * 2);
        return (
          <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
        );
      })}
    </svg>
  );
}

/* ── Framer Motion Variants ──────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

/* ── Page Component ──────────────────────────────────────────────────────── */

export default function HorseProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const horse = ALL_PROFILES.find(
    (p) => p.name.toLowerCase().replace(/\s+/g, "-") === slug
  );

  if (!horse) {
    return (
      <div className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <h1 className="font-heading text-3xl text-[#1a1a2a] mb-4">
          Horse Not Found
        </h1>
        <p className="text-[#6b7280] mb-8">
          We couldn&apos;t find a profile matching &ldquo;{slug}&rdquo;.
        </p>
        <Link
          href="/profiles"
          className="inline-flex items-center gap-2 text-[#b8941f] font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profiles
        </Link>
      </div>
    );
  }

  const styleColor = STYLE_COLORS[horse.runningStyle] ?? {
    bg: "#9ca3af18",
    text: "#9ca3af",
  };

  const infoGrid = [
    { label: "Trainer", value: horse.trainer },
    { label: "Jockey", value: horse.jockey },
    { label: "Sire", value: horse.sire },
    { label: "Dam", value: horse.dam },
    { label: "Age", value: `${horse.age} yrs` },
    { label: "Weight", value: `${horse.weight} lbs` },
  ];

  const speedFigs = PIPELINE_ACTIVE ? getHorseSpeedFigures(horse.name) : null;

  const statsCards = [
    {
      label: "Top Speed",
      value: `${horse.topSpeed.toFixed(1)}`,
      unit: "ft/s",
      icon: <Zap className="h-4 w-4 text-[#b8941f]" />,
    },
    {
      label: "Avg Speed",
      value: `${horse.avgSpeed.toFixed(1)}`,
      unit: "ft/s",
      icon: <Activity className="h-4 w-4 text-[#b8941f]" />,
    },
    {
      label: "Stride Efficiency",
      value: `${horse.strideEfficiency.toFixed(2)}`,
      unit: "",
      icon: <TrendingUp className="h-4 w-4 text-[#b8941f]" />,
    },
    {
      label: "Avg Finish",
      value: `${horse.avgFinish.toFixed(1)}`,
      unit: `of ${horse.races} races`,
      icon: <Trophy className="h-4 w-4 text-[#b8941f]" />,
    },
    {
      label: "Best Distance",
      value: horse.bestDistance,
      unit: "",
      icon: null,
    },
    {
      label: "Best Surface",
      value: horse.bestSurface,
      unit: "",
      icon: null,
    },
    // Pipeline-computed speed figures (only if pipeline has been run and horse has data)
    ...(speedFigs ? [
      {
        label: "Speed Figure",
        value: `${speedFigs.career_best.toFixed(0)}`,
        unit: "career best",
        icon: <BarChart3 className="h-4 w-4 text-[#b8941f]" />,
      },
      {
        label: "Recent Figure",
        value: `${speedFigs.recent_best.toFixed(0)}`,
        unit: `best of last 3`,
        icon: <BarChart3 className="h-4 w-4 text-[#b8941f]" />,
      },
      {
        label: "Avg Figure",
        value: `${speedFigs.avg_last_5.toFixed(0)}`,
        unit: `last ${Math.min(5, speedFigs.num_races)} races`,
        icon: null,
      },
    ] : []),
  ];

  return (
    <motion.div
      className="mx-auto max-w-5xl px-6 pt-20 pb-16"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      {/* ── Back Link + Horse Name ────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-8">
        <Link
          href="/profiles"
          className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#b8941f] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profiles
        </Link>

        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-heading text-4xl text-[#1a1a2a]">
            {horse.name}
          </h1>
          <span
            className="rounded-full px-3 py-1 text-sm font-medium"
            style={{ backgroundColor: styleColor.bg, color: styleColor.text }}
          >
            {horse.runningStyle}
          </span>
        </div>
      </motion.div>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row gap-8 mb-12"
      >
        {/* Large photo */}
        <div className="flex-shrink-0">
          <div
            className="w-80 h-80 rounded-2xl overflow-hidden border-4"
            style={{ borderColor: horse.color }}
          >
            <Image
              src={horse.imageUrl}
              alt={horse.name}
              width={320}
              height={320}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 min-w-0">
          {/* Personality */}
          <p className="text-lg italic text-[#6b7280] leading-relaxed mb-6">
            &ldquo;{horse.personality}&rdquo;
          </p>

          {/* Fun facts */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] mb-2">
              Fun Facts
            </h3>
            <ul className="space-y-1.5">
              {horse.funFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#1a1a2a]">
                  <span className="mt-1 block h-2 w-2 rounded-full bg-[#b8941f] flex-shrink-0" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
            {infoGrid.map((item) => (
              <div key={item.label} className="flex items-baseline gap-2">
                <span className="text-xs text-[#9ca3af] uppercase tracking-wider w-16 flex-shrink-0">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-[#1a1a2a]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Earnings + Wins */}
          <div className="flex items-center gap-6">
            <div className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] px-5 py-3 text-center">
              <p className="text-2xl font-mono font-bold text-[#b8941f]">
                {formatEarnings(horse.earnings)}
              </p>
              <p className="text-xs text-[#9ca3af] mt-0.5">Career Earnings</p>
            </div>
            <div className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] px-5 py-3 text-center">
              <p className="text-2xl font-mono font-bold text-[#1a1a2a]">
                {horse.wins}
              </p>
              <p className="text-xs text-[#9ca3af] mt-0.5">Career Wins</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Strengths & Weaknesses ────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
      >
        {/* Strengths */}
        <div className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] p-6">
          <h2 className="font-heading text-lg text-[#1a1a2a] mb-4 flex items-center gap-2">
            <span className="text-green-600">&#10003;</span> Strengths
          </h2>
          <ul className="space-y-3">
            {horse.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#1a1a2a]">
                <span className="mt-0.5 text-green-600 flex-shrink-0">&#10003;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] p-6">
          <h2 className="font-heading text-lg text-[#1a1a2a] mb-4 flex items-center gap-2">
            <span className="text-amber-500">&#9888;</span> Weaknesses
          </h2>
          <ul className="space-y-3">
            {horse.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#1a1a2a]">
                <span className="mt-0.5 text-amber-500 flex-shrink-0">&#9888;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* ── GPS Performance Data ──────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-12">
        <h2 className="font-heading text-2xl text-[#1a1a2a] mb-6">
          GPS Performance Data
        </h2>

        {/* Speed Curve */}
        <div className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] p-6 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] mb-4">
            Speed Curve (ft/s across race)
          </h3>
          <FullSpeedCurve data={horse.speedCurve} color={horse.color} />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] p-4 text-center"
            >
              {card.icon && (
                <div className="flex justify-center mb-1">{card.icon}</div>
              )}
              <p className="text-2xl font-mono font-bold text-[#1a1a2a]">
                {card.value}
              </p>
              <p className="text-xs text-[#9ca3af] mt-1">{card.label}</p>
              {card.unit && (
                <p className="text-[10px] text-[#9ca3af]">{card.unit}</p>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Race History ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-12">
        <h2 className="font-heading text-2xl text-[#1a1a2a] mb-6">
          Recent Results
        </h2>

        <div className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-3 px-6 py-3 border-b border-[#e5e2db]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              Date
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              Track
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] text-right">
              Finish
            </span>
          </div>

          {/* Table rows */}
          {horse.recentForm.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-3 px-6 py-3"
              style={{
                backgroundColor: i % 2 === 0 ? "transparent" : "#ffffff",
              }}
            >
              <span className="text-sm text-[#6b7280]">
                {formatFormDate(r.date)}
              </span>
              <span className="text-sm font-medium text-[#1a1a2a]">
                {r.track}
              </span>
              <span
                className="text-sm font-semibold text-right"
                style={{ color: finishColor(r.finish) }}
              >
                {ordinal(r.finish)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Race X-Ray Link ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Link
          href="/xray"
          className="group flex items-center justify-between rounded-xl bg-[#f8f6f2] border border-[#e5e2db] px-6 py-5 hover:border-[#b8941f] transition-colors"
        >
          <div>
            <p className="font-heading text-lg text-[#1a1a2a] mb-1">
              See this horse in action
            </p>
            <p className="text-sm text-[#6b7280]">
              Watch {horse.name}&apos;s GPS data come alive in the Race X-Ray
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-[#9ca3af] group-hover:text-[#b8941f] transition-colors" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
