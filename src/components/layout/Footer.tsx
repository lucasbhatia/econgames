import Link from "next/link";

const navLinks = [
  { href: "/arena", label: "Arena" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stable", label: "Stable" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0d1117] border-t border-[#c9a84c]/20">
      {/* Card suit decorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none text-[12rem] leading-none text-white/[0.03] flex items-center justify-around"
      >
        <span>♠</span>
        <span>♥</span>
        <span>♦</span>
        <span>♣</span>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-xl font-bold text-[#f5f0e1]">
              EconGames
            </h3>
            <p className="mt-2 text-sm text-[#f5f0e180]">
              Where data races to the finish line.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#f5f0e1]">
              Navigation
            </h4>
            <ul className="mt-3 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#f5f0e1]/50 transition-colors hover:text-[#c9a84c]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#f5f0e1]">
              About
            </h4>
            <p className="mt-3 text-sm text-[#f5f0e1]/50">
              EconGames is an equestrian-themed economics challenge platform
              powered by real racing data and AI-driven visualization.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-[#c9a84c]/10 py-4 text-center text-xs text-[#f5f0e1]/50">
        &copy; 2026 EconGames. All rights reserved.
      </div>
    </footer>
  );
}
