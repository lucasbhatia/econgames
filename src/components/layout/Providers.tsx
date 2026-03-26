"use client";

import { RaceClockProvider } from "@/lib/context/RaceClockContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <RaceClockProvider>{children}</RaceClockProvider>;
}
