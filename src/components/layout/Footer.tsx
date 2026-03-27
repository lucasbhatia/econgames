import Link from "next/link";

const navLinks = [
  { href: "/live", label: "Race Night" },
  { href: "/xray", label: "Race X-Ray" },
  { href: "/profiles", label: "Horse Profiles" },
  { href: "/preview", label: "Preview" },
  { href: "/simulate", label: "Simulate" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#e5e2db]" style={{ background: "#f8f6f2" }}>
      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-xl font-bold text-[#1a1a2a]">
              GPS Racing Intelligence
            </h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Real-time horse racing analytics powered by GPS data.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#1a1a2a]">
              Navigation
            </h4>
            <ul className="mt-3 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6b7280] transition-colors hover:text-[#b8941f]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#1a1a2a]">
              About
            </h4>
            <p className="mt-3 text-sm text-[#6b7280]">
              GPS Racing Intelligence is an equestrian-themed economics challenge
              platform powered by real GPS tracking data and AI-driven race visualization.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-[#e5e2db] py-4 text-center text-xs text-[#9ca3af]">
        &copy; 2026 GPS Racing Intelligence. All rights reserved.
      </div>
    </footer>
  );
}
