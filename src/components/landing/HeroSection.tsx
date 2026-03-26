"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Brain, Trophy, Eye, BarChart3 } from "lucide-react";
import { HORSES } from "@/lib/theme";
import RaceTrackVisual from "./RaceTrackVisual";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-[#0f1923] to-midnight" />

      {/* Subtle suit pattern */}
      <div className="absolute inset-0 bg-suits opacity-50" />

      {/* Radial glow behind hero */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 mb-8"
        >
          <span className="text-gold text-sm font-mono">♠ ♥ ♦ ♣</span>
          <span className="text-cream/70 text-sm">Data Analysis Reimagined</span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="text-cream">Where Data</span>
          <br />
          <span className="text-gradient-gold">Races to the Finish</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-cream/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Submit a prompt. Upload your data. Watch five AI strategies race head-to-head
          to find the best insights — with full transparency into every decision.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/arena"
            className="group flex items-center gap-2 px-8 py-4 bg-gold text-midnight font-bold rounded-xl text-lg hover:bg-gold-light transition-all duration-300 animate-pulse-gold"
          >
            Enter the Arena
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-8 py-4 border border-cream/20 text-cream rounded-xl text-lg hover:border-gold/50 hover:text-gold transition-all duration-300"
          >
            View Dashboard
          </Link>
        </motion.div>

        {/* Race Track Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <RaceTrackVisual />
        </motion.div>
      </div>

      {/* Feature pills at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="relative z-10 mt-16 pb-12 flex flex-wrap justify-center gap-4 px-6"
      >
        {[
          { icon: Zap, label: "5 AI Strategies Racing" },
          { icon: Eye, label: "Full Transparency" },
          { icon: Brain, label: "Creative Insights" },
          { icon: BarChart3, label: "Real-Time Visualization" },
          { icon: Trophy, label: "Verified Results" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-cream/5 border border-cream/10 text-cream/60 text-sm"
          >
            <Icon className="w-4 h-4 text-gold" />
            {label}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
