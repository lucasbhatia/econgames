"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  getCurrentEpoch,
  getTimeInCycle,
  getPhaseFromCycleTime,
  getPhaseTimer,
  CYCLE_DURATION,
  BETTING_DURATION,
  RACING_DURATION,
  type RacePhase,
} from "@/lib/constants/race-timing";

interface RaceClockState {
  epoch: number;
  phase: RacePhase;
  timer: number;
  cycleProgress: number;
  timeUntilNextRace: number;
}

const RaceClockContext = createContext<RaceClockState>({
  epoch: 0,
  phase: "betting",
  timer: 0,
  cycleProgress: 0,
  timeUntilNextRace: 0,
});

export function RaceClockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RaceClockState>({
    epoch: 0,
    phase: "betting",
    timer: 0,
    cycleProgress: 0,
    timeUntilNextRace: 0,
  });

  useEffect(() => {
    function tick() {
      const cycleTime = getTimeInCycle();
      setState({
        epoch: getCurrentEpoch(),
        phase: getPhaseFromCycleTime(cycleTime),
        timer: getPhaseTimer(cycleTime),
        cycleProgress: cycleTime / CYCLE_DURATION,
        timeUntilNextRace: Math.ceil(CYCLE_DURATION - cycleTime),
      });
    }

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <RaceClockContext.Provider value={state}>
      {children}
    </RaceClockContext.Provider>
  );
}

export function useRaceClock() {
  return useContext(RaceClockContext);
}
