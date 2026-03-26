"use client";

import { motion } from "framer-motion";
import { PIPELINE_STAGES } from "@/lib/theme";
import {
  Upload,
  BookOpen,
  Wrench,
  Route,
  Play,
  CheckCircle,
  Award,
} from "lucide-react";

const stageIcons = [Upload, BookOpen, Wrench, Route, Play, CheckCircle, Award];

const stageDescriptions = [
  "Upload your data — CSV, Excel, JSON. We validate, profile, and preview it instantly.",
  "AI reads your prompt and your data. It classifies the problem, profiles every column, and checks they match.",
  "Raw data transforms into analysis-ready features. Every step shown with before/after views.",
  "AI picks the best strategies for your problem. Each horse gets a specific plan and reasoning.",
  "All strategies execute in parallel. Watch them race live with streaming progress and reasoning.",
  "Every result gets verified: math checks, statistical validity, economic sense. Scored on 6 dimensions.",
  "The winner is crowned. Full analysis, charts, code, and the complete journey — glass box transparency.",
];

export default function PipelineSection() {
  return (
    <section className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-[#0a1018] to-midnight" />
      <div className="absolute inset-0 bg-horseshoe opacity-50" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-gold text-sm font-mono uppercase tracking-[0.2em] mb-4 block">
            The 7-Furlong Pipeline
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-cream mb-4">
            How the Race Is Run
          </h2>
          <p className="text-cream/50 max-w-xl mx-auto">
            Every challenge passes through 7 stages — from raw data to verified insights.
            Each stage is a furlong on the track.
          </p>
        </motion.div>

        {/* Pipeline track */}
        <div className="relative">
          {/* Track line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/0 via-gold/40 to-gold/0 md:-translate-x-px" />

          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = stageIcons[i];
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex items-start gap-6 mb-12 md:mb-16 ${
                  isLeft
                    ? "md:flex-row md:text-right"
                    : "md:flex-row-reverse md:text-left"
                } flex-row text-left`}
              >
                {/* Content */}
                <div className={`flex-1 ${isLeft ? "md:pr-16" : "md:pl-16"} pl-16 md:pl-0`}>
                  <div
                    className={`p-6 rounded-xl border border-cream/10 bg-cream/[0.02] hover:border-gold/30 transition-colors duration-300`}
                  >
                    <div className={`flex items-center gap-3 mb-3 ${isLeft ? "md:justify-end" : ""}`}>
                      <span className="text-gold font-mono text-sm">
                        Furlong {stage.furlong}
                      </span>
                      <span className="text-cream/30">·</span>
                      <span className="text-cream/60 font-semibold text-sm">
                        {stage.subtitle}
                      </span>
                    </div>
                    <h3 className="font-heading text-xl font-bold text-cream mb-2">
                      {stage.name}
                    </h3>
                    <p className="text-cream/50 text-sm leading-relaxed">
                      {stageDescriptions[i]}
                    </p>
                  </div>
                </div>

                {/* Node on track */}
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-9 h-9 rounded-full bg-midnight border-2 border-gold/50 flex items-center justify-center z-10">
                  <Icon className="w-4 h-4 text-gold" />
                </div>

                {/* Spacer for the other side */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            );
          })}

          {/* Finish line */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative flex justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center glow-gold">
              <span className="text-2xl">🏆</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
