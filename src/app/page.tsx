"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  FEATURED_RACE,
  HORSE_COLORS,
  RUNNING_STYLES,
} from "@/lib/data/race-data";
import RaceReplay from "@/components/arena/RaceReplay";
import SpeedTelemetry from "@/components/arena/SpeedTelemetry";
import StrideAnalysis from "@/components/arena/StrideAnalysis";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55 },
};

const S = "max-w-5xl mx-auto px-6";

const TABS = ["Race Replay", "Speed Traces", "Stride Analysis", "Running Styles"] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Race Replay");
  const [selectedHorses, setSelectedHorses] = useState([0, 1, 4]);

  const toggleHorse = (idx: number) => {
    setSelectedHorses((prev) =>
      prev.includes(idx)
        ? prev.filter((i) => i !== idx)
        : prev.length < 4
        ? [...prev, idx]
        : prev
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════ */}
      <section className="pt-32 pb-16">
        <div className={S}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1a1a2a] mb-5 leading-[1.15]">
              GPS Racing Intelligence
            </h1>
            <p className="text-[#6b7280] text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              See horse races like never before — with real-time speed, stride,
              and position data from GPS tracking.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/xray"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#b8941f] text-white text-base font-semibold hover:bg-[#a6840f] transition-colors"
            >
              Explore a Race &rarr;
            </Link>
            <Link
              href="/profiles"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#e5e2db] text-[#1a1a2a] text-base font-semibold hover:border-[#b8941f]/50 transition-colors"
            >
              Browse Horses &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          2. WHAT THIS TOOL DOES — 3 FEATURE CARDS
      ═══════════════════════════════════════ */}
      <section className="py-20">
        <div className={S}>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                title: "Race X-Ray",
                href: "/xray",
                desc: "Replay any race and see exactly how fast each horse was running, where they gained or lost ground, and why the winner won. Like watching a race with X-ray vision.",
              },
              {
                icon: Users,
                title: "Horse Profiles",
                href: "/profiles",
                desc: "Every horse gets a profile card showing their racing personality — are they a fast starter who fades, or a slow starter who charges from behind? See their speed patterns and recent results.",
              },
              {
                icon: TrendingUp,
                title: "Race Preview",
                href: "/preview",
                desc: "Before a race happens, see which horses match up well based on their GPS data. Who\u2019s likely to set the early pace? Who has the closing speed to come from behind?",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                {...fade}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="bg-[#f8f6f2] rounded-xl p-6 h-full flex flex-col">
                  <card.icon className="w-7 h-7 text-[#b8941f] mb-4" />
                  <h3 className="text-lg font-bold text-[#1a1a2a] mb-3">
                    {card.title}
                  </h3>
                  <p className="text-base text-[#6b7280] leading-relaxed mb-5 flex-1">
                    {card.desc}
                  </p>
                  <Link
                    href={card.href}
                    className="text-base font-medium text-[#b8941f] hover:underline"
                  >
                    Try it &rarr;
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3. QUICK GLOSSARY
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-[#f8f6f2]">
        <div className={S}>
          <motion.div {...fade}>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1a1a2a] mb-10">
              Racing Terms Made Simple
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                term: "Front Runner",
                color: "#22c55e",
                desc: "A horse that likes to lead from the start. Think of it like a sprinter — fast out of the gate.",
              },
              {
                term: "Stalker",
                color: "#8b5cf6",
                desc: "A horse that sits in the middle of the pack, saving energy, then makes a move. The patient racer.",
              },
              {
                term: "Closer",
                color: "#b8941f",
                desc: "A horse that starts near the back and accelerates past everyone in the final stretch. The comeback kid.",
              },
              {
                term: "Furlong",
                color: "#9ca3af",
                desc: "A unit of distance in horse racing. 1 furlong = 1/8 of a mile. An 8-furlong race is 1 mile.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.term}
                {...fade}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white rounded-xl border border-[#e5e2db] p-5"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <h3 className="text-base font-bold text-[#1a1a2a]">
                    {item.term}
                  </h3>
                </div>
                <p className="text-base text-[#6b7280] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          4. LIVE DEMO — TABBED
      ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className={S}>
          <motion.div {...fade}>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#9ca3af] mb-3">
              Live Demo
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1a1a2a] mb-2">
              Featured Race Analysis
            </h2>
            <p className="text-base text-[#6b7280] leading-relaxed max-w-2xl mt-3 mb-2">
              Here&rsquo;s a real $500K stakes race at Colonial Downs, broken
              down with GPS data. Try the tabs below.
            </p>
          </motion.div>

          {/* Race header */}
          <motion.div {...fade} className="mt-6 mb-6">
            <p className="text-sm font-mono text-[#6b7280]">
              CNL Race 9 — $500K Stakes — March 14, 2026 — 9F Dirt — 10 runners
            </p>
          </motion.div>

          {/* Field card — no finishing positions */}
          <motion.div
            {...fade}
            className="rounded-xl border border-[#e5e2db] bg-[#f8f6f2] overflow-hidden mb-8"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px bg-[#e5e2db]">
              {FEATURED_RACE.horses.map((horse, i) => (
                <div key={horse.name} className="bg-[#f8f6f2] px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: HORSE_COLORS[i] }}
                    />
                    <span className="text-[13px] font-semibold text-[#1a1a2a] truncate">
                      {horse.name}
                    </span>
                  </div>
                  <span className="text-[13px] text-[#9ca3af]">
                    PP{horse.postPos} · {horse.odds}-1
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="border-b border-[#e5e2db] mb-8">
            <div className="flex gap-6 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab
                      ? "text-[#b8941f] border-[#b8941f]"
                      : "text-[#9ca3af] border-transparent hover:text-[#6b7280]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {activeTab === "Race Replay" && (
              <motion.div
                key="replay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <RaceReplay
                  horses={FEATURED_RACE.horses}
                  colors={HORSE_COLORS}
                  distance={FEATURED_RACE.distance}
                />
              </motion.div>
            )}

            {activeTab === "Speed Traces" && (
              <motion.div
                key="speed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-wrap gap-2 mb-4">
                  {FEATURED_RACE.horses.map((horse, i) => (
                    <button
                      key={horse.name}
                      onClick={() => toggleHorse(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-all border ${
                        selectedHorses.includes(i)
                          ? "bg-[#f8f6f2] border-[#e5e2db] text-[#1a1a2a]"
                          : "bg-white border-[#e5e2db] text-[#9ca3af] hover:text-[#6b7280]"
                      }`}
                      style={
                        selectedHorses.includes(i)
                          ? { boxShadow: `inset 3px 0 0 ${HORSE_COLORS[i]}` }
                          : {}
                      }
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: HORSE_COLORS[i],
                          opacity: selectedHorses.includes(i) ? 1 : 0.3,
                        }}
                      />
                      {horse.name}
                    </button>
                  ))}
                </div>
                <p className="text-[13px] text-[#9ca3af] mb-4">
                  Select up to 4 horses to compare
                </p>
                <SpeedTelemetry
                  horses={FEATURED_RACE.horses}
                  colors={HORSE_COLORS}
                  selectedHorses={selectedHorses}
                />
              </motion.div>
            )}

            {activeTab === "Stride Analysis" && (
              <motion.div
                key="stride"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <StrideAnalysis
                  horses={FEATURED_RACE.horses}
                  colors={HORSE_COLORS}
                />
              </motion.div>
            )}

            {activeTab === "Running Styles" && (
              <motion.div
                key="styles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: "frontRunner", name: "Front Runner", pct: RUNNING_STYLES.frontRunner.pct, count: RUNNING_STYLES.frontRunner.count, desc: RUNNING_STYLES.frontRunner.description },
                    { key: "stalker", name: "Stalker", pct: RUNNING_STYLES.stalker.pct, count: RUNNING_STYLES.stalker.count, desc: RUNNING_STYLES.stalker.description },
                    { key: "closer", name: "Closer", pct: RUNNING_STYLES.closer.pct, count: RUNNING_STYLES.closer.count, desc: RUNNING_STYLES.closer.description },
                    { key: "other", name: "Other", pct: RUNNING_STYLES.other.pct, count: RUNNING_STYLES.other.count, desc: RUNNING_STYLES.other.description },
                  ].map((style) => (
                    <div
                      key={style.key}
                      className="rounded-xl bg-[#f8f6f2] border border-[#e5e2db] p-5 text-center"
                    >
                      <p className="text-sm font-bold text-[#1a1a2a] mb-1">{style.name}</p>
                      <p className="text-3xl font-mono font-bold text-[#b8941f] mb-1">{style.pct}%</p>
                      <p className="text-[13px] text-[#9ca3af] mb-3">{style.count} horses</p>
                      <div className="h-1.5 rounded-full bg-[#e5e2db] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#b8941f]"
                          initial={{ width: 0 }}
                          animate={{ width: `${style.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <p className="text-[13px] text-[#6b7280] mt-3 leading-relaxed">{style.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          5. FOOTER
      ═══════════════════════════════════════ */}
      <section className="py-16">
        <div className={S}>
          <div className="h-px bg-gradient-to-r from-transparent via-[#e5e2db] to-transparent mb-10" />

          <p className="text-center text-base text-[#9ca3af] mb-6">
            Built with 985,000 rows of real GPS data from 12 tracks
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              { label: "Race X-Ray", href: "/xray" },
              { label: "Horse Profiles", href: "/profiles" },
              { label: "Race Preview", href: "/preview" },
              { label: "About", href: "/about" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-base text-[#6b7280] hover:text-[#b8941f] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
