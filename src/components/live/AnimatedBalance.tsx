"use client";

import { useState, useEffect, useRef } from "react";
import { GREEN, RED } from "./constants";

export function AnimatedBalance({ value, prefix = "$" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    // Capture direction before updating ref
    setDirection(to > from ? "up" : "down");
    prevRef.current = to;

    const diff = to - from;
    const duration = 1500;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setDirection(null);
      }
    }
    requestAnimationFrame(tick);
  }, [value]);

  const isUp = direction === "up";
  const isDown = direction === "down";

  return (
    <span
      className="font-mono font-bold tabular-nums transition-colors duration-500"
      style={{ color: isUp ? GREEN : isDown ? RED : undefined }}
    >
      {prefix}{display.toLocaleString()}
    </span>
  );
}
