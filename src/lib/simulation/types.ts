export type RunningStyle = "Front Runner" | "Stalker" | "Closer";
export type TrackBias = "none" | "slight_inside" | "slight_outside";
export type Surface = "Dirt" | "Turf";

export interface SimHorse {
  name: string;
  color: string;
  imageUrl: string;
  speedCurve: number[];
  topSpeed: number;
  avgSpeed: number;
  strideEfficiency: number;
  runningStyle: RunningStyle;
  consistency: number; // stdev: 0.3=low, 0.5=med, 0.8=high
  postPosition: number;
  isCustom: boolean;
}

export interface SimConfig {
  horses: SimHorse[];
  distanceFurlongs: number;
  surface: Surface;
  trackBias: TrackBias;
  numSimulations: number;
}

export interface SingleRaceResult {
  finishOrder: string[];
  times: Record<string, number>;
  gateSpeeds: Record<string, number[]>;
}

export interface HorseAggResult {
  name: string;
  color: string;
  winPct: number;
  placePct: number;
  showPct: number;
  fairOdds: string;
  avgFinish: number;
  finishDist: number[]; // count at each position
}

export interface SimResults {
  horses: HorseAggResult[];
  allRaces: SingleRaceResult[];
  topOrders: { order: string[]; count: number; pct: number }[];
}
