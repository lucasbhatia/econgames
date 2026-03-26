"use client";

import { motion } from "framer-motion";
import { HORSES } from "@/lib/theme";

const horseEntries = Object.entries(HORSES) as [string, (typeof HORSES)[keyof typeof HORSES]][];

export default function HorsesSection() {
  return (
    <section className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-[#0e1620] to-midnight" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm font-mono uppercase tracking-[0.2em] mb-4 block">
            Meet the Contenders
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-cream mb-4">
            Five Strategies, Five Horses
          </h2>
          <p className="text-cream/50 max-w-xl mx-auto">
            Each challenge is attacked by five distinct AI strategies — from quick stats
            to wild experiments. They race in parallel, and the best answer wins.
          </p>
        </motion.div>

        {/* Horse cards */}
        <div className="grid md:grid-cols-5 gap-4">
          {horseEntries.map(([id, horse], i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative rounded-xl border border-cream/10 bg-cream/[0.02] overflow-hidden hover:border-opacity-50 transition-all duration-300 cursor-default"
              style={{ ["--horse-color" as string]: horse.color }}
            >
              {/* Top color bar */}
              <div
                className="h-1.5"
                style={{ backgroundColor: horse.color }}
              />

              <div className="p-5">
                {/* Horse emoji + name */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: horse.color + "20" }}
                  >
                    🏇
                  </div>
                  <h3
                    className="font-heading text-base font-bold"
                    style={{ color: horse.color }}
                  >
                    {horse.name}
                  </h3>
                </div>

                {/* Silk pattern */}
                <div className="text-cream/30 text-xs mb-3 font-mono">
                  {horse.silk}
                </div>

                {/* Approach */}
                <p className="text-cream/50 text-xs leading-relaxed mb-4">
                  {horse.approach}
                </p>

                {/* Risk badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      horse.risk === "safe"
                        ? "bg-stable/30 text-green-400"
                        : horse.risk === "moderate"
                        ? "bg-gold/20 text-gold"
                        : "bg-racing-red/20 text-racing-red"
                    }`}
                  >
                    {horse.risk}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
