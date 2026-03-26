export const HORSES = {
  sprinter: {
    name: "The Sprinter",
    color: "#c9a84c",
    colorName: "Champion Gold",
    silk: "Solid gold",
    approach: "Quick stats: regression, correlation, summary stats, baseline models",
    risk: "safe" as const,
  },
  thoroughbred: {
    name: "The Thoroughbred",
    color: "#1a3a2a",
    colorName: "Stable Green",
    silk: "Green + white chevrons",
    approach: "Deep modeling: ML, econometrics, time series",
    risk: "moderate" as const,
  },
  darkHorse: {
    name: "The Dark Horse",
    color: "#5b3e8a",
    colorName: "Jockey Silk",
    silk: "Purple + silver stars",
    approach: "Creative: cross-domain analogies, NLP, network analysis",
    risk: "experimental" as const,
  },
  veteran: {
    name: "The Veteran",
    color: "#4a2c1a",
    colorName: "Saddle Brown",
    silk: "Brown + gold trim",
    approach: "Classical theory: domain-specific frameworks and models",
    risk: "safe" as const,
  },
  wildcard: {
    name: "The Wildcard",
    color: "#c41e3a",
    colorName: "Racing Red",
    silk: "Red + black lightning",
    approach: "Experimental: game theory, chaos theory, Monte Carlo, unconventional",
    risk: "experimental" as const,
  },
} as const;

export type HorseId = keyof typeof HORSES;

export const PIPELINE_STAGES = [
  { id: "ingest", name: "Ingest", subtitle: "Loading the Gate", furlong: 1 },
  { id: "understand", name: "Understand", subtitle: "Reading the Form Guide", furlong: 2 },
  { id: "engineer", name: "Engineer", subtitle: "Training Day", furlong: 3 },
  { id: "route", name: "Route", subtitle: "Picking the Horses", furlong: 4 },
  { id: "race", name: "Race", subtitle: "They're Off!", furlong: 5 },
  { id: "verify", name: "Verify", subtitle: "Photo Finish", furlong: 6 },
  { id: "present", name: "Present", subtitle: "Winner's Circle", furlong: 7 },
] as const;

export type StageId = (typeof PIPELINE_STAGES)[number]["id"];
