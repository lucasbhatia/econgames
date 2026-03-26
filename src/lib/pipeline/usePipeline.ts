"use client";

import { useState, useCallback } from "react";
import type { PipelineState, StageStatus, HorseExecution } from "./types";
import {
  mockIngestResult,
  mockUnderstandResult,
  mockEngineerResult,
  mockRouteResult,
  mockRaceResult,
  mockVerifyResult,
  mockPresentResult,
  mockRaceExecutions,
  CHALLENGE_PROMPT,
} from "./mock-data";

const STAGE_KEYS = [
  "ingest",
  "understand",
  "engineer",
  "route",
  "race",
  "verify",
  "present",
] as const;

const STAGE_DELAYS = [2000, 3000, 2500, 2000, 4000, 3000, 2000];

const STAGE_RESULTS = [
  mockIngestResult,
  mockUnderstandResult,
  mockEngineerResult,
  mockRouteResult,
  mockRaceResult,
  mockVerifyResult,
  mockPresentResult,
];

export function usePipeline() {
  const [state, setState] = useState<PipelineState>({
    currentStage: -1,
    prompt: "",
    dataFiles: [],
    stages: {
      ingest: { status: "pending" },
      understand: { status: "pending" },
      engineer: { status: "pending" },
      route: { status: "pending" },
      race: { status: "pending" },
      verify: { status: "pending" },
      present: { status: "pending" },
    },
  });

  const [isRunning, setIsRunning] = useState(false);
  const [raceExecutions, setRaceExecutions] = useState<HorseExecution[]>(mockRaceExecutions.map(e => ({ ...e, status: "gate", progress: 0, currentStep: 0 })));

  const runPipeline = useCallback(async (prompt: string) => {
    setIsRunning(true);

    setState((prev) => ({
      ...prev,
      prompt,
      dataFiles: [
        "GPS Races.xlsx",
        "Traditional Races.xlsx",
        "GPS PPs.xlsx",
        "Starters PPs.xlsx",
        "upcoming races.xlsx",
      ],
      currentStage: -1,
      stages: {
        ingest: { status: "pending" },
        understand: { status: "pending" },
        engineer: { status: "pending" },
        route: { status: "pending" },
        race: { status: "pending" },
        verify: { status: "pending" },
        present: { status: "pending" },
      },
    }));

    for (let i = 0; i < STAGE_KEYS.length; i++) {
      const key = STAGE_KEYS[i];

      // Set running
      setState((prev) => ({
        ...prev,
        currentStage: i,
        stages: {
          ...prev.stages,
          [key]: { status: "running" as StageStatus },
        },
      }));

      // Simulate race progress for stage 5
      if (key === "race") {
        await simulateRace(setRaceExecutions);
      }

      // Wait for "processing"
      await new Promise((r) => setTimeout(r, STAGE_DELAYS[i]));

      // Set completed with result
      setState((prev) => ({
        ...prev,
        stages: {
          ...prev.stages,
          [key]: {
            status: "completed" as StageStatus,
            result: STAGE_RESULTS[i],
          },
        },
      }));
    }

    setIsRunning(false);
  }, []);

  const runWithPreloadedPrompt = useCallback(() => {
    runPipeline(CHALLENGE_PROMPT);
  }, [runPipeline]);

  return {
    state,
    isRunning,
    raceExecutions,
    runPipeline,
    runWithPreloadedPrompt,
  };
}

async function simulateRace(
  setExecs: React.Dispatch<React.SetStateAction<typeof mockRaceExecutions>>
) {
  const finishOrder = [2, 0, 3, 1]; // darkHorse, sprinter, wildcard, thoroughbred
  const speeds = [3.5, 4, 2.5, 3]; // progress per tick

  for (let tick = 0; tick < 30; tick++) {
    await new Promise((r) => setTimeout(r, 120));
    setExecs((prev) =>
      prev.map((exec, i) => {
        const speed = speeds[i] + (Math.random() - 0.3) * 2;
        const newProgress = Math.min(100, exec.progress + speed);
        const stepProgress = Math.floor((newProgress / 100) * exec.totalSteps);
        return {
          ...exec,
          progress: newProgress,
          currentStep: stepProgress,
          status:
            newProgress >= 100
              ? ("finished" as const)
              : newProgress > 0
              ? ("running" as const)
              : ("gate" as const),
        };
      })
    );
  }

  // Ensure all finish
  setExecs((prev) =>
    prev.map((exec) => ({
      ...exec,
      ...mockRaceExecutions.find((m) => m.horse === exec.horse)!,
      progress: 100,
      status: "finished" as const,
    }))
  );
}
