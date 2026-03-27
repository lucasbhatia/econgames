"use client";

import { Trophy, Sparkles } from "lucide-react";
import { GREEN, TEXT, TEXT_SEC, TEXT_MUTED } from "./constants";

export function LiveActivityFeed({ wins }: { wins: { name: string; bet_type: string; payout: number; selections: string[] }[] }) {
  if (wins.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: GREEN }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_SEC }}>
          Recent Wins
        </span>
      </div>
      <div className="space-y-1">
        {wins.slice(0, 5).map((w, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: `${GREEN}06`, border: `1px solid ${GREEN}15` }}>
            <Trophy className="w-3 h-3 shrink-0" style={{ color: GREEN }} />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold" style={{ color: TEXT }}>{w.name}</span>
              <span className="text-[10px] mx-1" style={{ color: TEXT_MUTED }}>won</span>
              <span className="text-[10px]" style={{ color: TEXT_SEC }}>{w.selections[0]}</span>
            </div>
            <span className="text-[11px] font-bold font-mono shrink-0" style={{ color: GREEN }}>
              +${w.payout}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
