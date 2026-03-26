import { HorseId } from "@/lib/theme";

// ── Stage 1: Ingest ──

export interface IngestResult {
  fileName: string;
  format: "csv" | "json" | "excel" | "text";
  encoding: string;
  size: { rows: number; cols: number; bytes: number };
  preview: Record<string, unknown>[];
  columns: string[];
  errors: Array<{
    row?: number;
    column?: string;
    issue: string;
    severity: "warning" | "error";
    autoFix?: string;
  }>;
}

// ── Stage 2: Understand ──

export interface PromptAnalysis {
  originalPrompt: string;
  classification: {
    type: string;
    domain: string;
    complexity: 1 | 2 | 3 | 4 | 5;
  };
  extractedRequirements: string[];
  implicitAssumptions: string[];
  ambiguities: string[];
  keywords: string[];
  timeHorizon: "historical" | "current" | "forecast";
}

export interface ColumnProfile {
  name: string;
  inferredType: "numeric" | "categorical" | "datetime" | "text" | "boolean";
  nullable: boolean;
  uniqueValues: number;
  sampleValues: unknown[];
  stats?: {
    mean?: number;
    median?: number;
    min?: number;
    max?: number;
    std?: number;
    distribution?: number[];
  };
}

export interface DataProfile {
  columns: ColumnProfile[];
  quality: {
    completeness: number;
    duplicateRows: number;
    outlierCount: number;
    typeConsistency: number;
  };
  correlations: { col1: string; col2: string; value: number }[];
  timeSeriesDetected: boolean;
  panelDataDetected: boolean;
  possibleJoinKeys: string[];
  targetVariable?: string;
}

export interface UnderstandResult {
  prompt: PromptAnalysis;
  data: DataProfile;
  matchScore: number;
  matchExplanation: string;
}

// ── Stage 3: Engineer ──

export interface EngineeringStep {
  id: string;
  operation: string;
  column?: string;
  params: Record<string, unknown>;
  reasoning: string;
  beforeSnapshot: { rows: number; cols: number };
  afterSnapshot: { rows: number; cols: number };
  reversible: boolean;
}

export interface EngineerResult {
  steps: EngineeringStep[];
  transformedColumns: string[];
  newFeatures: string[];
  droppedRows: number;
  externalDataSuggestions: Array<{
    source: string;
    dataset: string;
    why: string;
  }>;
}

// ── Stage 4: Route ──

export interface StrategySelection {
  horse: HorseId;
  confidence: number;
  reasoning: string;
  specificApproach: string;
  riskLevel: "safe" | "moderate" | "experimental";
}

export interface RouteResult {
  problemFingerprint: {
    dataShape: string;
    targetType: string;
    sampleSize: string;
    featureCount: number;
    nonlinearity: string;
  };
  selectedStrategies: StrategySelection[];
  excludedStrategies: Array<{
    horse: HorseId;
    reason: string;
  }>;
  outOfTheBoxIdeas: Array<{
    idea: string;
    fromDomain: string;
    howItApplies: string;
    assignedTo: HorseId;
  }>;
}

// ── Stage 5: Race ──

export interface RaceStep {
  stepNumber: number;
  action: string;
  input: string;
  output: string;
  reasoning: string;
  duration: number;
  confidence: number;
  codeGenerated?: string;
  error?: string;
  recovery?: string;
}

export interface HorseExecution {
  horse: HorseId;
  status: "gate" | "running" | "stumbled" | "recovered" | "finished" | "dnf";
  steps: RaceStep[];
  currentStep: number;
  totalSteps: number;
  progress: number;
  liveOutput: string;
  intermediateResults: Array<{ label: string; value: unknown }>;
}

export interface RaceResult {
  executions: HorseExecution[];
  totalDuration: number;
}

// ── Stage 6: Verify ──

export interface VerificationScores {
  accuracy: number;
  economicInsight: number;
  robustness: number;
  creativity: number;
  interpretability: number;
  dataUtilization: number;
  composite: number;
}

export interface HorseVerification {
  horse: HorseId;
  correctness: {
    mathValid: boolean;
    unitsConsistent: boolean;
    magnitudeReasonable: boolean;
    replicable: boolean;
  };
  scores: VerificationScores;
  agreedWith: HorseId[];
  disagreedWith: HorseId[];
  uniqueInsight: string | null;
}

export interface VerifyResult {
  verifications: HorseVerification[];
  winner: HorseId;
  winnerScore: number;
}

// ── Stage 7: Present ──

export interface PresentResult {
  winner: {
    horse: HorseId;
    compositeScore: number;
    summary: string;
    keyFindings: string[];
    fullAnalysis: string;
  };
  journey: {
    whatYouAsked: string;
    howWeReadIt: string;
    whatYourDataShowed: string;
    howWePreparedIt: string;
    whichApproachesWeTried: string;
    whatEachFound: string;
    whyThisOneWon: string;
    whatSurprisedUs: string;
    exploreNext: string[];
  };
  meta: {
    totalDuration: number;
    dataPointsProcessed: number;
  };
}

// ── Pipeline State ──

export type StageStatus = "pending" | "running" | "completed" | "error";

export interface PipelineState {
  currentStage: number;
  stages: {
    ingest: { status: StageStatus; result?: IngestResult };
    understand: { status: StageStatus; result?: UnderstandResult };
    engineer: { status: StageStatus; result?: EngineerResult };
    route: { status: StageStatus; result?: RouteResult };
    race: { status: StageStatus; result?: RaceResult };
    verify: { status: StageStatus; result?: VerifyResult };
    present: { status: StageStatus; result?: PresentResult };
  };
  prompt: string;
  dataFiles: string[];
}

export const initialPipelineState: PipelineState = {
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
};
