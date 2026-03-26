"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRaceClock } from "@/lib/context/RaceClockContext";
import { formatRaceTimer, PHASE_LABELS } from "@/lib/constants/race-timing";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Race Night" },
  { href: "/xray", label: "Race X-Ray" },
  { href: "/profiles", label: "Profiles" },
  { href: "/preview", label: "Preview" },
  { href: "/simulate", label: "Simulate" },
];

const PHASE_COLORS: Record<string, string> = {
  betting: "#b8941f",
  post_parade: "#ea580c",
  racing: "#ef4444",
  results: "#2563eb",
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { phase, timer } = useRaceClock();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phaseColor = PHASE_COLORS[phase] ?? "#b8941f";
  const isLivePage = pathname === "/live";

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-[#e5e2db]"
          : "bg-white/60 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🏇</span>
          <span className="font-heading text-[15px] font-bold text-[#1a1a2a] tracking-wide">
            GPS Racing Intelligence
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "text-[#b8941f] font-semibold bg-[#b8941f]/5"
                    : "text-[#6b7280] hover:text-[#1a1a2a] hover:bg-[#f3f1ec]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Race timer pill — always visible, links to /live */}
          {mounted && !isLivePage && (
            <Link
              href="/live"
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{
                background: `${phaseColor}10`,
                border: `1.5px solid ${phaseColor}30`,
              }}
            >
              <motion.div
                animate={phase === "racing" ? { opacity: [1, 0.3, 1] } : {}}
                transition={phase === "racing" ? { repeat: Infinity, duration: 0.8 } : {}}
                className="w-2 h-2 rounded-full"
                style={{ background: phaseColor }}
              />
              <span className="text-xs font-mono font-bold" style={{ color: phaseColor }}>
                {formatRaceTimer(timer)}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: phaseColor }}>
                {PHASE_LABELS[phase]}
              </span>
            </Link>
          )}
        </div>

        {/* Mobile: timer + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {mounted && (
            <Link
              href="/live"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: `${phaseColor}10`,
                border: `1px solid ${phaseColor}25`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: phaseColor }} />
              <span className="text-[11px] font-mono font-bold" style={{ color: phaseColor }}>
                {formatRaceTimer(timer)}
              </span>
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-[#6b7280] p-1"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white border-b border-[#e5e2db]"
          >
            <div className="px-5 py-3 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm ${
                      isActive
                        ? "text-[#b8941f] font-semibold bg-[#b8941f]/5"
                        : "text-[#6b7280]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
