import type {
  IngestResult,
  UnderstandResult,
  EngineerResult,
  RouteResult,
  RaceResult,
  VerifyResult,
  PresentResult,
  HorseExecution,
} from "./types";

// The prompt for the GPS horse racing challenge
export const CHALLENGE_PROMPT = `We are interested in exploring how to better leverage our GPS data to enhance race analysis and create more intuitive, engaging ways to understand race performance that can attract and retain new audiences to the sport. Using the provided datasets, your task is to develop a data-driven product or tool that utilizes GPS data to deliver meaningful insights beyond traditional racing metrics. Your solution should be supported by analysis of both traditional and GPS variables and clearly demonstrate the added value of GPS data. You are encouraged to consider how your approach could extend to races or tracks where GPS data may not be available, while still maintaining practical usability. Finally, apply your solution to an upcoming race(s) and show how it would be used in practice and why it would matter.`;

export const mockIngestResult: IngestResult = {
  fileName: "GPS Races + Traditional Races + GPS PPs + Starters PPs + Upcoming Races",
  format: "excel",
  encoding: "UTF-8",
  size: { rows: 985191, cols: 27, bytes: 133006548 },
  preview: [
    { track_id: "GP", race_date: "2026-01-15", race_number: 3, horse_name: "MIDNIGHT GLORY", registration_number: "A10234", gate: 0.0, position: 2, sectional_time: 0.0, distance_ran: 0, strides: 0 },
    { track_id: "GP", race_date: "2026-01-15", race_number: 3, horse_name: "MIDNIGHT GLORY", registration_number: "A10234", gate: 0.5, position: 3, sectional_time: 12.45, distance_ran: 330, strides: 28 },
    { track_id: "GP", race_date: "2026-01-15", race_number: 3, horse_name: "MIDNIGHT GLORY", registration_number: "A10234", gate: 1.0, position: 2, sectional_time: 11.82, distance_ran: 330, strides: 26 },
    { track_id: "SA", race_date: "2026-02-08", race_number: 7, horse_name: "GOLDEN STRIDE", registration_number: "B45678", gate: 0.0, position: 5, sectional_time: 0.0, distance_ran: 0, strides: 0 },
    { track_id: "SA", race_date: "2026-02-08", race_number: 7, horse_name: "GOLDEN STRIDE", registration_number: "B45678", gate: 0.5, position: 4, sectional_time: 12.01, distance_ran: 330, strides: 27 },
  ],
  columns: [
    "track_id", "race_date", "race_number", "distance", "distance_unit", "surface",
    "race_type", "grade", "Purse", "registration_number", "horse_name", "gate",
    "post_position", "morning_line_odds", "position", "official_position",
    "Post_time_Odds", "sectional_time", "running_time", "time_behind",
    "distance_behind", "distance_ran", "cumulative_distance_ran", "strides",
    "cumulative_strides", "field_size", "published_value"
  ],
  errors: [
    { column: "registration_number", issue: "Type mismatch: stored as INT in GPS files, STRING in others", severity: "warning", autoFix: "Cast all to string before joins" },
    { column: "morning_line_odds", issue: "Fractional format (e.g., '7/2') needs parsing to decimal", severity: "warning", autoFix: "Parse fractions to decimal odds" },
    { issue: "GPS files have multiple rows per horse per race (many-to-one vs Traditional)", severity: "warning" },
  ],
};

export const mockUnderstandResult: UnderstandResult = {
  prompt: {
    originalPrompt: CHALLENGE_PROMPT,
    classification: {
      type: "product-development + prediction + visualization",
      domain: "sports analytics / horse racing",
      complexity: 5,
    },
    extractedRequirements: [
      "Leverage GPS data for enhanced race analysis",
      "Create intuitive, engaging ways to understand race performance",
      "Attract and retain new audiences to the sport",
      "Deliver meaningful insights beyond traditional racing metrics",
      "Analysis of both traditional AND GPS variables",
      "Demonstrate added value of GPS data",
      "Consider extension to non-GPS races/tracks",
      "Apply solution to upcoming race(s)",
      "Show practical usage and why it matters",
    ],
    implicitAssumptions: [
      "New audiences find traditional racing metrics confusing or unengaging",
      "GPS data provides measurably more insight than point-of-call data",
      "The solution should be visually compelling, not just analytically correct",
      "Upcoming races have entries but no results yet — predictions required",
    ],
    ambiguities: [
      "'New audiences' — casual fans? bettors? data enthusiasts? media?",
      "'Meaningful insights' — predictive value? entertainment? understanding?",
      "'Extend to non-GPS tracks' — model transfer? feature approximation?",
    ],
    keywords: ["GPS", "sectional timing", "race analysis", "engagement", "new audiences", "upcoming races", "prediction"],
    timeHorizon: "forecast",
  },
  data: {
    columns: [
      { name: "sectional_time", inferredType: "numeric", nullable: false, uniqueValues: 45230, sampleValues: [12.45, 11.82, 12.01, 11.55, 13.2], stats: { mean: 12.34, median: 12.28, min: 9.8, max: 16.5, std: 0.87 } },
      { name: "distance_ran", inferredType: "numeric", nullable: false, uniqueValues: 890, sampleValues: [330, 330, 660, 330, 440], stats: { mean: 345, median: 330, min: 0, max: 1320, std: 120 } },
      { name: "strides", inferredType: "numeric", nullable: false, uniqueValues: 95, sampleValues: [28, 26, 27, 25, 30], stats: { mean: 27.3, median: 27, min: 0, max: 42, std: 3.8 } },
      { name: "position", inferredType: "numeric", nullable: false, uniqueValues: 16, sampleValues: [2, 3, 5, 1, 4], stats: { mean: 4.5, median: 4, min: 1, max: 16, std: 2.8 } },
      { name: "gate", inferredType: "numeric", nullable: false, uniqueValues: 28, sampleValues: [0, 0.5, 1.0, 1.5, 2.0], stats: { mean: 3.2, median: 3.0, min: 0, max: 14, std: 2.1 } },
      { name: "post_time_odds", inferredType: "numeric", nullable: true, uniqueValues: 2840, sampleValues: [3.5, 8.2, 15.0, 2.1, 45.0] },
      { name: "official_position", inferredType: "numeric", nullable: false, uniqueValues: 16, sampleValues: [1, 3, 7, 2, 5] },
      { name: "track_id", inferredType: "categorical", nullable: false, uniqueValues: 12, sampleValues: ["GP", "SA", "AQU", "CD", "KEE"] },
      { name: "surface", inferredType: "categorical", nullable: false, uniqueValues: 3, sampleValues: ["D", "T", "AW"] },
      { name: "race_type", inferredType: "categorical", nullable: false, uniqueValues: 8, sampleValues: ["MSW", "CLM", "ALW", "STK", "AOC"] },
    ],
    quality: {
      completeness: 94.2,
      duplicateRows: 0,
      outlierCount: 1847,
      typeConsistency: 97.8,
    },
    correlations: [
      { col1: "sectional_time", col2: "distance_ran", value: 0.82 },
      { col1: "strides", col2: "distance_ran", value: 0.91 },
      { col1: "position", col2: "official_position", value: 0.35 },
      { col1: "post_time_odds", col2: "official_position", value: 0.28 },
      { col1: "gate", col2: "running_time", value: 0.95 },
    ],
    timeSeriesDetected: true,
    panelDataDetected: true,
    possibleJoinKeys: ["registration_number", "track_id + race_date + race_number"],
    targetVariable: "official_position",
  },
  matchScore: 96,
  matchExplanation: "Excellent match. The prompt asks about GPS race analysis and the data contains rich GPS sectional timing, stride data, and positional tracking across 985K rows.",
};

export const mockEngineerResult: EngineerResult = {
  steps: [
    {
      id: "e1",
      operation: "cast_types",
      column: "registration_number",
      params: { from: "int", to: "string" },
      reasoning: "GPS files store registration_number as INT while other files use STRING. Must unify before any joins.",
      beforeSnapshot: { rows: 985191, cols: 27 },
      afterSnapshot: { rows: 985191, cols: 27 },
      reversible: true,
    },
    {
      id: "e2",
      operation: "calculate_speed",
      params: { formula: "distance_ran / sectional_time" },
      reasoning: "Speed at each GPS gate is the key derived metric. feet/second at every half-furlong reveals pace patterns invisible in traditional data.",
      beforeSnapshot: { rows: 395536, cols: 27 },
      afterSnapshot: { rows: 395536, cols: 28 },
      reversible: true,
    },
    {
      id: "e3",
      operation: "calculate_stride_length",
      params: { formula: "distance_ran / strides" },
      reasoning: "Stride length = distance/strides. Longer strides at later gates may indicate a horse with closing speed. Biomechanical signature unique to GPS data.",
      beforeSnapshot: { rows: 395536, cols: 28 },
      afterSnapshot: { rows: 395536, cols: 29 },
      reversible: true,
    },
    {
      id: "e4",
      operation: "classify_running_style",
      params: { method: "position clustering at early vs late gates" },
      reasoning: "Classify each horse as front-runner, stalker, or closer based on position at gate 0-2 vs gate 4+. This running style feature is only possible with GPS gate-level data.",
      beforeSnapshot: { rows: 395536, cols: 29 },
      afterSnapshot: { rows: 26246, cols: 30 },
      reversible: true,
    },
    {
      id: "e5",
      operation: "calculate_pace_figures",
      params: { method: "normalize sectional times by track/distance/surface" },
      reasoning: "Normalize times across different track conditions for cross-track comparison. A 12.1s half-furlong at GP dirt vs SA turf means different things.",
      beforeSnapshot: { rows: 395536, cols: 30 },
      afterSnapshot: { rows: 395536, cols: 31 },
      reversible: true,
    },
    {
      id: "e6",
      operation: "parse_odds",
      column: "morning_line_odds",
      params: { method: "parse fractional to decimal" },
      reasoning: "Convert fractional odds like '7/2' to decimal (3.5) and implied probability (28.6%) for market efficiency analysis.",
      beforeSnapshot: { rows: 26246, cols: 31 },
      afterSnapshot: { rows: 26246, cols: 33 },
      reversible: true,
    },
  ],
  transformedColumns: ["registration_number", "morning_line_odds"],
  newFeatures: ["speed_fps", "stride_length_ft", "running_style", "pace_figure", "odds_decimal", "implied_probability"],
  droppedRows: 0,
  externalDataSuggestions: [
    { source: "Weather API", dataset: "Historical track conditions", why: "Track condition (fast/muddy/sloppy) significantly affects sectional times. Adding weather data could improve pace figure normalization." },
    { source: "Equibase", dataset: "Beyer Speed Figures", why: "Industry-standard speed figures would provide validation benchmark for our GPS-derived pace figures." },
  ],
};

export const mockRouteResult: RouteResult = {
  problemFingerprint: {
    dataShape: "panel (GPS: many-to-one, Traditional: cross-section)",
    targetType: "continuous (speed/pace) + categorical (position/running style)",
    sampleSize: "large (985K rows across 5 files)",
    featureCount: 33,
    nonlinearity: "highly_nonlinear (horse racing is chaotic, position changes are step-like)",
  },
  selectedStrategies: [
    {
      horse: "sprinter",
      confidence: 92,
      reasoning: "Large dataset with clear numeric targets. Quick statistical analysis will establish baseline pace profiles, speed distributions, and correlation benchmarks against which creative approaches are measured.",
      specificApproach: "Build per-horse speed profiles from GPS sectional times. Calculate speed at each gate, aggregate by race. Produce summary statistics by track, surface, distance. Baseline linear model predicting finish position from early-gate speed + stride length.",
      riskLevel: "safe",
    },
    {
      horse: "thoroughbred",
      confidence: 88,
      reasoning: "Panel data with time series structure (gate-by-gate within race, race-by-race across time) is ideal for ML. Random Forest and XGBoost can capture nonlinear interactions between speed, stride, position that simple regression misses.",
      specificApproach: "XGBoost model: predict finish position from gate-level speed, stride length, running style, pace figures, post position, field size. Feature importance analysis reveals which GPS features add most predictive value vs traditional-only features. Apply to upcoming races for predictions.",
      riskLevel: "moderate",
    },
    {
      horse: "darkHorse",
      confidence: 78,
      reasoning: "The prompt specifically asks about engaging new audiences. This requires creative visualization and storytelling — not just accurate models. Cross-domain thinking from sports analytics (NBA player tracking, F1 telemetry) can inspire novel race visualization approaches.",
      specificApproach: "Build a 'Race Replay Engine' — reconstruct any race from GPS data as an animated visualization showing each horse's speed, position, and stride in real-time. Create 'horse DNA profiles' — unique performance fingerprints from GPS patterns. Borrow from F1 telemetry overlays: side-by-side speed traces comparing horses through every gate.",
      riskLevel: "experimental",
    },
    {
      horse: "wildcard",
      confidence: 65,
      reasoning: "Monte Carlo simulation on upcoming races using GPS-derived features could produce probability distributions of outcomes far richer than single-point predictions. Also: apply physics models (drag, energy expenditure) to stride + speed data.",
      specificApproach: "Monte Carlo race simulation: sample from each horse's historical GPS distributions (speed per gate, stride length variance, running style tendency) to simulate 10,000 race outcomes. Report win probabilities with uncertainty bounds. Energy expenditure model: estimate metabolic cost from stride frequency × speed to predict late-race fatigue.",
      riskLevel: "experimental",
    },
  ],
  excludedStrategies: [
    {
      horse: "veteran",
      reason: "Classical economic theory (supply/demand, equilibrium) doesn't directly apply to this sports analytics problem. The data is physical performance data, not market/economic data. The Veteran's theory-first approach would add complexity without insight here.",
    },
  ],
  outOfTheBoxIdeas: [
    {
      idea: "F1-Style Telemetry Overlays — borrow from Formula 1's on-screen speed traces where viewers see real-time speed comparisons between drivers through every sector. Apply to horse racing: overlay speed traces gate-by-gate for any two horses, showing exactly where one horse gained or lost ground.",
      fromDomain: "Formula 1 / Motorsport Analytics",
      howItApplies: "GPS sectional data IS telemetry data. Same concept: speed at fixed distance points, position relative to competitors. F1 proved these visualizations dramatically increase viewer engagement.",
      assignedTo: "darkHorse",
    },
    {
      idea: "Biomechanical Efficiency Score — stride length × speed gives a 'ground cover efficiency' metric. Horses with longer strides at the same speed are mechanically more efficient. This could predict which horses have reserves for a finishing kick.",
      fromDomain: "Biomechanics / Exercise Science",
      howItApplies: "GPS data includes both strides and distance_ran per gate. stride_length = distance/strides. Correlating stride efficiency with late-race performance could identify 'closers' before they close.",
      assignedTo: "wildcard",
    },
  ],
};

export const mockRaceExecutions: HorseExecution[] = [
  {
    horse: "sprinter",
    status: "finished",
    progress: 100,
    currentStep: 5,
    totalSteps: 5,
    liveOutput: "Baseline analysis complete. Speed profiles generated for all 26,246 race entries.",
    steps: [
      { stepNumber: 1, action: "aggregate", input: "GPS race data", output: "Per-horse speed profiles at each gate", reasoning: "Aggregate sectional_time and distance_ran by gate for each horse to build speed curves", duration: 3.2, confidence: 95 },
      { stepNumber: 2, action: "analyze", input: "Speed profiles", output: "Distribution statistics by track/surface/distance", reasoning: "Understanding baseline speed distributions is required before any modeling", duration: 2.1, confidence: 92 },
      { stepNumber: 3, action: "correlate", input: "GPS vs Traditional features", output: "GPS speed at gate 2 correlates 0.72 with finish position; traditional pos_at_poc_3 only 0.45", reasoning: "Quantify the added value of GPS features over traditional point-of-call data", duration: 1.8, confidence: 90 },
      { stepNumber: 4, action: "model", input: "Feature matrix", output: "Linear regression: R²=0.61 with GPS features vs R²=0.42 without", reasoning: "Baseline model shows GPS features improve prediction by 45%", duration: 4.5, confidence: 88 },
      { stepNumber: 5, action: "visualize", input: "Model results", output: "Speed profile charts, feature importance bar chart, GPS vs Traditional comparison", reasoning: "Visual evidence of GPS value-add for the presentation", duration: 2.0, confidence: 94 },
    ],
    intermediateResults: [
      { label: "R² with GPS", value: 0.61 },
      { label: "R² without GPS", value: 0.42 },
      { label: "GPS Value-Add", value: "+45%" },
    ],
  },
  {
    horse: "thoroughbred",
    status: "finished",
    progress: 100,
    currentStep: 6,
    totalSteps: 6,
    liveOutput: "XGBoost model trained. Feature importance analysis reveals gate-2 speed and stride length as top GPS predictors.",
    steps: [
      { stepNumber: 1, action: "engineer", input: "Raw GPS + Traditional data", output: "Feature matrix with 33 features per horse-race", reasoning: "Combine GPS-derived features (speed, stride_length, running_style, pace_figure) with traditional features for comparison", duration: 5.2, confidence: 90 },
      { stepNumber: 2, action: "split", input: "Feature matrix", output: "Train (80%) / Test (20%) split by date to prevent leakage", reasoning: "Time-based split is critical — can't use future races to predict past ones", duration: 0.8, confidence: 98 },
      { stepNumber: 3, action: "train", input: "Training data", output: "XGBoost model (500 trees, max_depth=6, lr=0.1)", reasoning: "XGBoost handles mixed feature types and nonlinear interactions well for tabular data", duration: 12.3, confidence: 85 },
      { stepNumber: 4, action: "evaluate", input: "Test data predictions", output: "MAE=1.82 positions (GPS) vs MAE=2.45 (Traditional only)", reasoning: "GPS features reduce prediction error by 26% — substantial improvement", duration: 3.1, confidence: 92 },
      { stepNumber: 5, action: "analyze", input: "Feature importances", output: "Top 5: gate2_speed (0.18), stride_length_avg (0.14), pace_figure (0.12), running_style (0.09), post_position (0.08)", reasoning: "Feature importance proves GPS-specific features dominate the model", duration: 2.4, confidence: 94 },
      { stepNumber: 6, action: "predict", input: "Upcoming race entries + historical GPS PPs", output: "Predictions for 12 upcoming races with confidence intervals", reasoning: "Apply trained model to upcoming races using each horse's GPS past performance data", duration: 4.8, confidence: 78 },
    ],
    intermediateResults: [
      { label: "MAE (GPS)", value: "1.82 positions" },
      { label: "MAE (Traditional)", value: "2.45 positions" },
      { label: "Improvement", value: "26%" },
      { label: "Top Feature", value: "gate2_speed" },
    ],
  },
  {
    horse: "darkHorse",
    status: "finished",
    progress: 100,
    currentStep: 5,
    totalSteps: 5,
    liveOutput: "Race Replay Engine prototype complete. F1-style telemetry overlays designed for horse racing.",
    steps: [
      { stepNumber: 1, action: "design", input: "GPS gate-level data structure", output: "Race Replay Engine specification — animate horse positions from gate data", reasoning: "New audiences need visual stories, not statistics tables. A replay that shows the actual race dynamics from data is compelling.", duration: 3.5, confidence: 82 },
      { stepNumber: 2, action: "prototype", input: "GPS positions + speeds per gate", output: "Animated speed trace overlay comparing two horses through a race", reasoning: "Borrowed from F1 telemetry: showing WHERE speed differences happen tells a story numbers alone cannot", duration: 6.2, confidence: 85 },
      { stepNumber: 3, action: "create", input: "Historical GPS data per horse", output: "Horse DNA Performance Profiles — unique fingerprint per horse showing speed curve shape, stride pattern, running style tendency", reasoning: "Like a player card in fantasy sports — makes each horse a character with a visible identity", duration: 4.8, confidence: 80 },
      { stepNumber: 4, action: "validate", input: "GPS vs non-GPS tracks", output: "Transfer learning approach: use GPS tracks to train a model, then approximate gate-level features from traditional point-of-call data for non-GPS tracks", reasoning: "The prompt asks about extension to non-GPS tracks. We can impute approximate GPS features from traditional data using a trained mapping model.", duration: 5.5, confidence: 72 },
      { stepNumber: 5, action: "apply", input: "Upcoming race entries", output: "Race preview cards with DNA profiles, predicted speed traces, and engagement score", reasoning: "Apply the full visualization concept to upcoming races to show practical value", duration: 3.8, confidence: 78 },
    ],
    intermediateResults: [
      { label: "Concept", value: "Race Replay Engine + DNA Profiles" },
      { label: "Engagement Score", value: "8.4/10 (estimated)" },
      { label: "Non-GPS Transfer", value: "R²=0.68 approximation" },
    ],
  },
  {
    horse: "wildcard",
    status: "finished",
    progress: 100,
    currentStep: 5,
    totalSteps: 5,
    liveOutput: "Monte Carlo simulation complete. 10,000 race simulations per upcoming race. Energy model validated.",
    steps: [
      { stepNumber: 1, action: "model", input: "Historical GPS speed distributions per horse", output: "Per-gate speed probability distributions for each horse", reasoning: "Instead of point estimates, model the full distribution of each horse's speed at each gate. This captures variability — some horses are consistent, some volatile.", duration: 4.2, confidence: 75 },
      { stepNumber: 2, action: "simulate", input: "Speed distributions + field composition", output: "10,000 simulated races per upcoming race entry", reasoning: "Monte Carlo lets us account for the inherent randomness in racing. A horse might be fastest on average but lose 30% of the time due to high variance.", duration: 8.5, confidence: 70 },
      { stepNumber: 3, action: "analyze", input: "Simulation results", output: "Win probabilities, place probabilities, exacta/trifecta probabilities with confidence bounds", reasoning: "Rich probability outputs are more useful than 'this horse will win' — they capture uncertainty honestly", duration: 3.2, confidence: 82 },
      { stepNumber: 4, action: "physics", input: "Stride frequency × speed × distance", output: "Energy expenditure model: estimated metabolic cost per gate", reasoning: "Physics of locomotion: energy ∝ stride_frequency² × speed. Horses that are 'spending' more energy early may fade late. GPS stride + speed data makes this calculable.", duration: 5.8, confidence: 65 },
      { stepNumber: 5, action: "synthesize", input: "Monte Carlo + Energy model", output: "Fatigue-adjusted win probabilities: horses with lower early energy expenditure get 15% boost in late-closing scenarios", reasoning: "Combining simulation with biomechanics gives unique insight: not just who CAN win, but who has the RESERVES to win when the race gets tough.", duration: 3.5, confidence: 72 },
    ],
    intermediateResults: [
      { label: "Simulations/Race", value: "10,000" },
      { label: "Energy Prediction", value: "Fatigue-adjusted odds" },
      { label: "Unique Insight", value: "Reserve energy → closing ability" },
    ],
  },
];

export const mockRaceResult: RaceResult = {
  executions: mockRaceExecutions,
  totalDuration: 95.4,
};

export const mockVerifyResult: VerifyResult = {
  verifications: [
    {
      horse: "sprinter",
      correctness: { mathValid: true, unitsConsistent: true, magnitudeReasonable: true, replicable: true },
      scores: { accuracy: 75, economicInsight: 60, robustness: 85, creativity: 40, interpretability: 90, dataUtilization: 70, composite: 70 },
      agreedWith: ["thoroughbred"],
      disagreedWith: [],
      uniqueInsight: "Established baseline: GPS features provide 45% more predictive value than traditional data alone.",
    },
    {
      horse: "thoroughbred",
      correctness: { mathValid: true, unitsConsistent: true, magnitudeReasonable: true, replicable: true },
      scores: { accuracy: 92, economicInsight: 78, robustness: 88, creativity: 55, interpretability: 72, dataUtilization: 95, composite: 83 },
      agreedWith: ["sprinter"],
      disagreedWith: [],
      uniqueInsight: "XGBoost reveals gate-2 speed as the single most predictive GPS feature — early acceleration pattern predicts finish position better than any traditional metric.",
    },
    {
      horse: "darkHorse",
      correctness: { mathValid: true, unitsConsistent: true, magnitudeReasonable: true, replicable: true },
      scores: { accuracy: 68, economicInsight: 92, robustness: 65, creativity: 98, interpretability: 95, dataUtilization: 80, composite: 84 },
      agreedWith: [],
      disagreedWith: [],
      uniqueInsight: "The Race Replay Engine and DNA Profiles address the prompt's core ask — engaging new audiences — more directly than any purely analytical approach. The F1 telemetry concept has proven engagement value in motorsport.",
    },
    {
      horse: "wildcard",
      correctness: { mathValid: true, unitsConsistent: true, magnitudeReasonable: true, replicable: true },
      scores: { accuracy: 70, economicInsight: 85, robustness: 60, creativity: 92, interpretability: 68, dataUtilization: 88, composite: 77 },
      agreedWith: [],
      disagreedWith: [],
      uniqueInsight: "Fatigue-adjusted win probabilities are entirely novel — no existing racing product combines Monte Carlo simulation with biomechanical energy modeling from GPS stride data.",
    },
  ],
  winner: "darkHorse",
  winnerScore: 84,
};

export const mockPresentResult: PresentResult = {
  winner: {
    horse: "darkHorse",
    compositeScore: 84,
    summary: "The Dark Horse wins with a creative, audience-first solution: a GPS-powered Race Replay Engine with Horse DNA Performance Profiles and F1-style telemetry overlays. While The Thoroughbred scored higher on raw accuracy (92 vs 68), The Dark Horse best answered the prompt's core question — how to attract and retain new audiences — by building engaging visualizations that make GPS data accessible to non-experts.",
    keyFindings: [
      "GPS data provides 45% more predictive value than traditional race data alone (validated by both Sprinter and Thoroughbred)",
      "Gate-2 speed (first furlong acceleration) is the single most predictive GPS feature for finish position",
      "Race Replay Engine: reconstructs races from GPS data as animated visualizations with real-time speed overlays",
      "Horse DNA Profiles: unique performance fingerprints showing each horse's speed curve, stride pattern, and running style — like a player card",
      "F1 Telemetry Overlays: side-by-side speed traces showing exactly where one horse gains or loses ground — proven engagement concept",
      "Non-GPS track extension: trained model can approximate GPS features from traditional point-of-call data (R²=0.68)",
      "Monte Carlo simulation provides probability distributions for upcoming races — more honest than point predictions",
      "Biomechanical energy model: horses with lower early energy expenditure have 15% higher closing probability — GPS stride data makes this calculable",
    ],
    fullAnalysis: "Full analysis covers 985,191 data points across 5 Excel files. The GPS Race Replay Engine transforms raw gate-level telemetry into compelling visual narratives. Each horse gets a DNA Profile — a visual fingerprint derived from their historical GPS patterns showing speed curves, stride efficiency, and running style tendency. For upcoming races, these profiles generate preview cards with predicted speed traces and matchup comparisons. The approach extends to non-GPS tracks via a transfer learning model that approximates gate-level features from traditional point-of-call positions.",
  },
  journey: {
    whatYouAsked: "How to leverage GPS data for better race analysis and audience engagement, with practical application to upcoming races.",
    howWeReadIt: "Classified as a product-development + prediction challenge in sports analytics, complexity 5/5. Key insight: the prompt prioritizes engagement over pure accuracy.",
    whatYourDataShowed: "985K rows of GPS sectional timing across 5 files. Key features: sectional_time, strides, distance_ran at every half-furlong gate. Strong correlations: strides↔distance (0.91), speed↔time (0.82).",
    howWePreparedIt: "6 engineering steps: type unification, speed calculation, stride length, running style classification, pace figure normalization, odds parsing. Created 6 new GPS-derived features.",
    whichApproachesWeTried: "4 horses ran: Sprinter (baseline stats), Thoroughbred (XGBoost ML), Dark Horse (Race Replay Engine + DNA Profiles), Wildcard (Monte Carlo + Energy Model). The Veteran sat out — this is sports analytics, not classical economics.",
    whatEachFound: "Sprinter: GPS adds 45% predictive value. Thoroughbred: XGBoost with gate-2 speed as top feature, 26% error reduction. Dark Horse: engaging visualization platform inspired by F1 telemetry. Wildcard: probability distributions with fatigue-adjusted closing predictions.",
    whyThisOneWon: "The Dark Horse scored highest composite (84) because it best addressed the prompt's engagement requirement. While Thoroughbred had higher accuracy (92), the prompt asked for tools to 'attract and retain new audiences' — and the Race Replay Engine with DNA Profiles delivers exactly that.",
    whatSurprisedUs: "The Wildcard's energy expenditure model was unexpectedly powerful — connecting stride frequency and speed to predict late-race fatigue is genuinely novel and only possible with GPS data. This should be incorporated into the Dark Horse's visualization toolkit.",
    exploreNext: [
      "Build the Race Replay Engine as a real-time web application with Three.js 3D track visualization",
      "Integrate the Wildcard's energy model into DNA Profiles to show 'reserve energy' as a visual gauge",
      "A/B test the F1 telemetry overlay concept with actual new audiences to validate engagement hypothesis",
      "Expand to live race data streaming when GPS feeds become available in real-time",
      "Partner with racing media to embed DNA Profile cards in pre-race coverage",
    ],
  },
  meta: {
    totalDuration: 95.4,
    dataPointsProcessed: 985191,
  },
};
