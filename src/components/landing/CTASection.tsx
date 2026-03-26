"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-32 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-midnight to-[#0a0e14]" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent"
        >
          {/* Decorative suits */}
          <div className="text-gold/10 text-4xl mb-6 tracking-[0.5em]">♠ ♥ ♦ ♣</div>

          <h2 className="font-heading text-4xl md:text-5xl font-bold text-cream mb-4">
            Ready to Race?
          </h2>
          <p className="text-cream/50 text-lg mb-8 max-w-md mx-auto">
            Upload your GPS racing data and watch AI strategies compete to find
            insights no one has seen before.
          </p>

          <Link
            href="/arena"
            className="group inline-flex items-center gap-2 px-10 py-4 bg-gold text-midnight font-bold rounded-xl text-lg hover:bg-gold-light transition-all duration-300 glow-gold"
          >
            Enter the Arena
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="text-cream/30 text-sm mt-6 font-mono">
            GPS data already loaded · 985,000+ rows · 5 datasets
          </p>
        </motion.div>
      </div>
    </section>
  );
}
