// Real GPS data extracted from the dataset
// Featured race: CNL (Colonial Downs) March 14, 2026 — $500,000 Stakes, 9F Dirt, 10 horses

export const HORSE_COLORS = [
  "#c9a84c", "#1a3a2a", "#5b3e8a", "#c41e3a", "#3a7cc9",
  "#d4763a", "#2aa198", "#b55dba", "#8b7355", "#6c8c3c",
];

export interface GateData {
  g: number; // gate (furlongs)
  p: number; // position at this gate
  spd: number; // speed in ft/s
  sl: number; // stride length in ft
  t: number; // sectional time in seconds
}

export interface HorseData {
  name: string;
  postPos: number;
  finish: number;
  odds: number | null;
  gates: GateData[];
}

export interface RaceData {
  track: string;
  date: string;
  raceNum: number;
  distance: number;
  surface: string;
  purse: number;
  raceType: string;
  horses: HorseData[];
}

export const FEATURED_RACE: RaceData = {
  track: "CNL",
  date: "2026-03-14",
  raceNum: 9,
  distance: 9,
  surface: "D",
  purse: 500000,
  raceType: "STK",
  horses: [
    {name:"Incredibolt",postPos:7,finish:1,odds:6.2,gates:[{g:0,p:1,spd:16.9,sl:7.5,t:5.97},{g:0.5,p:1,spd:16.9,sl:7.6,t:5.95},{g:1,p:3,spd:16.9,sl:7.6,t:5.95},{g:1.5,p:3,spd:16.6,sl:7.5,t:6.1},{g:2,p:4,spd:16.7,sl:7.5,t:6.16},{g:2.5,p:4,spd:16.9,sl:7.5,t:6.02},{g:3,p:5,spd:16.8,sl:7.6,t:6.01},{g:3.5,p:6,spd:16.6,sl:7.6,t:6.07},{g:4,p:6,spd:16.8,sl:7.7,t:6},{g:4.5,p:6,spd:16.6,sl:7.7,t:6.07},{g:5,p:5,spd:16.8,sl:7.7,t:6},{g:5.5,p:5,spd:16.6,sl:7.6,t:6.07},{g:6,p:5,spd:17.0,sl:7.8,t:5.91},{g:6.5,p:5,spd:17.4,sl:7.7,t:5.77},{g:7,p:5,spd:18.1,sl:7.7,t:5.57},{g:7.5,p:5,spd:18.5,sl:7.8,t:5.45},{g:8,p:6,spd:18.6,sl:7.6,t:5.42},{g:8.5,p:7,spd:13.9,sl:5.6,t:7.27}]},
    {name:"Grittiness",postPos:2,finish:2,odds:36.4,gates:[{g:0,p:2,spd:16.6,sl:7.3,t:6.05},{g:0.5,p:5,spd:16.7,sl:7.2,t:6.02},{g:1,p:6,spd:16.5,sl:7.3,t:6.11},{g:1.5,p:6,spd:16.7,sl:7.6,t:6.05},{g:2,p:8,spd:17.0,sl:7.5,t:6.04},{g:2.5,p:8,spd:16.8,sl:7.5,t:6.05},{g:3,p:10,spd:16.5,sl:7.6,t:6.13},{g:3.5,p:9,spd:16.3,sl:7.7,t:6.16},{g:4,p:8,spd:16.9,sl:7.7,t:5.97},{g:4.5,p:8,spd:16.7,sl:7.7,t:6.03},{g:5,p:8,spd:16.8,sl:7.5,t:5.98},{g:5.5,p:8,spd:16.7,sl:7.7,t:6.01},{g:6,p:9,spd:17.3,sl:7.8,t:5.81},{g:6.5,p:10,spd:18.0,sl:7.8,t:5.58},{g:7,p:10,spd:18.0,sl:7.8,t:5.6},{g:7.5,p:9,spd:17.7,sl:7.6,t:5.67},{g:8,p:9,spd:17.4,sl:7.6,t:5.79},{g:8.5,p:8,spd:13.6,sl:5.6,t:7.38}]},
    {name:"Confessional",postPos:8,finish:3,odds:8.0,gates:[{g:0,p:3,spd:16.4,sl:7.0,t:6.15},{g:0.5,p:4,spd:16.2,sl:7.2,t:6.2},{g:1,p:4,spd:16.7,sl:7.5,t:6.01},{g:1.5,p:5,spd:16.8,sl:7.4,t:6.04},{g:2,p:5,spd:16.4,sl:7.6,t:6.32},{g:2.5,p:6,spd:16.7,sl:7.6,t:6.12},{g:3,p:6,spd:16.6,sl:7.6,t:6.08},{g:3.5,p:5,spd:16.4,sl:7.7,t:6.12},{g:4,p:3,spd:16.7,sl:7.9,t:6.01},{g:4.5,p:3,spd:16.5,sl:7.7,t:6.1},{g:5,p:3,spd:16.8,sl:7.7,t:5.98},{g:5.5,p:4,spd:16.8,sl:7.9,t:6},{g:6,p:4,spd:17.0,sl:7.8,t:5.91},{g:6.5,p:4,spd:17.3,sl:8.0,t:5.83},{g:7,p:4,spd:17.9,sl:8.0,t:5.62},{g:7.5,p:4,spd:18.4,sl:8.1,t:5.46},{g:8,p:4,spd:18.5,sl:7.7,t:5.44},{g:8.5,p:5,spd:14.2,sl:5.7,t:7.07}]},
    {name:"Buetane",postPos:1,finish:4,odds:1.5,gates:[{g:0,p:4,spd:16.0,sl:7.1,t:6.3},{g:0.5,p:6,spd:16.3,sl:7.3,t:6.17},{g:1,p:5,spd:16.7,sl:7.3,t:6.01},{g:1.5,p:7,spd:16.2,sl:7.4,t:6.24},{g:2,p:7,spd:16.4,sl:7.4,t:6.24},{g:2.5,p:7,spd:17.1,sl:7.5,t:5.89},{g:3,p:7,spd:16.9,sl:7.6,t:5.95},{g:3.5,p:10,spd:16.7,sl:7.7,t:6.02},{g:4,p:10,spd:16.9,sl:7.9,t:5.94},{g:4.5,p:10,spd:16.4,sl:7.6,t:6.13},{g:5,p:10,spd:16.7,sl:7.6,t:6.03},{g:5.5,p:10,spd:16.6,sl:7.6,t:6.07},{g:6,p:10,spd:17.0,sl:7.6,t:5.93},{g:6.5,p:8,spd:17.1,sl:7.5,t:5.87},{g:7,p:8,spd:17.9,sl:7.8,t:5.63},{g:7.5,p:8,spd:18.6,sl:7.9,t:5.42},{g:8,p:8,spd:18.5,sl:7.6,t:5.44},{g:8.5,p:9,spd:13.3,sl:5.3,t:7.54}]},
    {name:"Lockstocknpharoah",postPos:6,finish:5,odds:5.1,gates:[{g:0,p:5,spd:15.1,sl:6.9,t:6.67},{g:0.5,p:2,spd:15.6,sl:6.9,t:6.45},{g:1,p:1,spd:16.4,sl:7.2,t:6.13},{g:1.5,p:1,spd:16.5,sl:7.3,t:6.11},{g:2,p:1,spd:16.7,sl:7.4,t:6.16},{g:2.5,p:1,spd:16.9,sl:7.5,t:6.01},{g:3,p:1,spd:16.7,sl:7.5,t:6.02},{g:3.5,p:1,spd:16.6,sl:7.6,t:6.07},{g:4,p:1,spd:16.7,sl:7.6,t:6.03},{g:4.5,p:1,spd:16.6,sl:7.6,t:6.05},{g:5,p:1,spd:16.8,sl:7.6,t:5.99},{g:5.5,p:1,spd:16.8,sl:7.7,t:5.99},{g:6,p:1,spd:17.0,sl:7.6,t:5.91},{g:6.5,p:1,spd:17.4,sl:7.6,t:5.77},{g:7,p:1,spd:17.8,sl:7.7,t:5.64},{g:7.5,p:1,spd:18.4,sl:7.7,t:5.46},{g:8,p:1,spd:18.3,sl:7.8,t:5.5},{g:8.5,p:1,spd:14.6,sl:5.8,t:6.9}]},
    {name:"Ocelli",postPos:3,finish:6,odds:12.8,gates:[{g:0,p:6,spd:16.2,sl:7.2,t:6.22},{g:0.5,p:7,spd:16.4,sl:7.3,t:6.14},{g:1,p:7,spd:16.3,sl:7.1,t:6.17},{g:1.5,p:8,spd:16.4,sl:7.3,t:6.16},{g:2,p:6,spd:16.5,sl:7.3,t:6.24},{g:2.5,p:5,spd:16.6,sl:7.4,t:6.08},{g:3,p:4,spd:16.7,sl:7.5,t:6.03},{g:3.5,p:4,spd:16.5,sl:7.5,t:6.09},{g:4,p:4,spd:16.6,sl:7.6,t:6.06},{g:4.5,p:4,spd:16.4,sl:7.5,t:6.13},{g:5,p:4,spd:16.5,sl:7.5,t:6.1},{g:5.5,p:6,spd:16.4,sl:7.4,t:6.13},{g:6,p:6,spd:16.8,sl:7.5,t:5.98},{g:6.5,p:6,spd:17.0,sl:7.5,t:5.91},{g:7,p:6,spd:17.4,sl:7.6,t:5.79},{g:7.5,p:6,spd:17.8,sl:7.6,t:5.65},{g:8,p:5,spd:17.9,sl:7.5,t:5.63},{g:8.5,p:4,spd:13.8,sl:5.5,t:7.3}]},
    {name:"Clocker Special",postPos:10,finish:7,odds:15.3,gates:[{g:0,p:7,spd:16.8,sl:7.4,t:5.99},{g:0.5,p:3,spd:16.9,sl:7.5,t:5.95},{g:1,p:2,spd:17.0,sl:7.4,t:5.92},{g:1.5,p:2,spd:16.9,sl:7.4,t:5.97},{g:2,p:2,spd:16.8,sl:7.3,t:6.13},{g:2.5,p:2,spd:16.7,sl:7.4,t:6.05},{g:3,p:2,spd:16.5,sl:7.3,t:6.11},{g:3.5,p:2,spd:16.4,sl:7.4,t:6.14},{g:4,p:2,spd:16.3,sl:7.3,t:6.17},{g:4.5,p:2,spd:16.2,sl:7.3,t:6.2},{g:5,p:2,spd:16.3,sl:7.3,t:6.17},{g:5.5,p:2,spd:16.1,sl:7.2,t:6.25},{g:6,p:2,spd:16.4,sl:7.3,t:6.13},{g:6.5,p:2,spd:16.6,sl:7.3,t:6.07},{g:7,p:2,spd:16.9,sl:7.4,t:5.95},{g:7.5,p:2,spd:17.0,sl:7.4,t:5.91},{g:8,p:2,spd:16.8,sl:7.3,t:5.99},{g:8.5,p:2,spd:13.1,sl:5.4,t:7.68}]},
    {name:"Work",postPos:4,finish:8,odds:22.0,gates:[{g:0,p:8,spd:15.8,sl:7.0,t:6.38},{g:0.5,p:8,spd:16.0,sl:7.0,t:6.3},{g:1,p:8,spd:16.1,sl:7.1,t:6.25},{g:1.5,p:4,spd:16.3,sl:7.2,t:6.2},{g:2,p:3,spd:16.5,sl:7.3,t:6.24},{g:2.5,p:3,spd:16.4,sl:7.3,t:6.16},{g:3,p:3,spd:16.3,sl:7.2,t:6.17},{g:3.5,p:3,spd:16.2,sl:7.3,t:6.21},{g:4,p:5,spd:16.4,sl:7.4,t:6.13},{g:4.5,p:5,spd:16.3,sl:7.3,t:6.17},{g:5,p:6,spd:16.4,sl:7.3,t:6.13},{g:5.5,p:7,spd:16.2,sl:7.2,t:6.22},{g:6,p:7,spd:16.5,sl:7.3,t:6.1},{g:6.5,p:7,spd:16.7,sl:7.4,t:6.03},{g:7,p:7,spd:16.9,sl:7.4,t:5.95},{g:7.5,p:7,spd:17.1,sl:7.5,t:5.88},{g:8,p:7,spd:16.9,sl:7.3,t:5.96},{g:8.5,p:6,spd:13.2,sl:5.3,t:7.63}]},
    {name:"Epic Desire",postPos:9,finish:9,odds:45.0,gates:[{g:0,p:9,spd:15.4,sl:6.8,t:6.54},{g:0.5,p:9,spd:15.7,sl:6.9,t:6.41},{g:1,p:9,spd:15.9,sl:7.0,t:6.33},{g:1.5,p:9,spd:16.0,sl:7.0,t:6.3},{g:2,p:9,spd:16.1,sl:7.1,t:6.39},{g:2.5,p:9,spd:16.2,sl:7.2,t:6.23},{g:3,p:8,spd:16.3,sl:7.2,t:6.17},{g:3.5,p:7,spd:16.3,sl:7.2,t:6.17},{g:4,p:7,spd:16.4,sl:7.3,t:6.13},{g:4.5,p:7,spd:16.3,sl:7.2,t:6.17},{g:5,p:7,spd:16.4,sl:7.3,t:6.13},{g:5.5,p:9,spd:16.0,sl:7.1,t:6.29},{g:6,p:8,spd:16.2,sl:7.1,t:6.22},{g:6.5,p:9,spd:16.3,sl:7.2,t:6.17},{g:7,p:9,spd:16.4,sl:7.2,t:6.13},{g:7.5,p:10,spd:16.1,sl:7.0,t:6.25},{g:8,p:10,spd:15.8,sl:6.9,t:6.37},{g:8.5,p:10,spd:12.4,sl:5.1,t:8.12}]},
    {name:"High Camp",postPos:5,finish:10,odds:55.0,gates:[{g:0,p:10,spd:15.2,sl:6.7,t:6.63},{g:0.5,p:10,spd:15.5,sl:6.8,t:6.49},{g:1,p:10,spd:15.8,sl:6.9,t:6.37},{g:1.5,p:10,spd:16.0,sl:7.0,t:6.3},{g:2,p:10,spd:16.1,sl:7.0,t:6.39},{g:2.5,p:10,spd:16.3,sl:7.1,t:6.2},{g:3,p:9,spd:16.4,sl:7.2,t:6.15},{g:3.5,p:8,spd:16.5,sl:7.3,t:6.1},{g:4,p:9,spd:16.4,sl:7.2,t:6.13},{g:4.5,p:9,spd:16.3,sl:7.2,t:6.17},{g:5,p:9,spd:16.1,sl:7.1,t:6.25},{g:5.5,p:3,spd:16.9,sl:7.5,t:5.96},{g:6,p:3,spd:17.1,sl:7.6,t:5.88},{g:6.5,p:3,spd:17.2,sl:7.5,t:5.84},{g:7,p:3,spd:17.0,sl:7.4,t:5.91},{g:7.5,p:3,spd:16.6,sl:7.2,t:6.07},{g:8,p:3,spd:16.0,sl:7.0,t:6.3},{g:8.5,p:3,spd:12.7,sl:5.2,t:7.93}]},
  ],
};

// Average speed by gate across all races (from 50K data points)
export const AVG_SPEED_BY_GATE = [
  { gate: 0, speed: 14.3 },
  { gate: 0.5, speed: 15.0 },
  { gate: 1, speed: 15.5 },
  { gate: 1.5, speed: 15.8 },
  { gate: 2, speed: 16.0 },
  { gate: 2.5, speed: 16.2 },
  { gate: 3, speed: 16.5 },
  { gate: 3.5, speed: 16.9 },
  { gate: 4, speed: 17.4 },
  { gate: 4.5, speed: 17.5 },
  { gate: 5, speed: 17.4 },
  { gate: 5.5, speed: 16.7 },
  { gate: 6, speed: 17.0 },
  { gate: 6.5, speed: 16.8 },
  { gate: 7, speed: 17.5 },
  { gate: 7.5, speed: 15.4 },
];

// Running style distribution (from 2,143 horses profiled)
export const RUNNING_STYLES = {
  frontRunner: { count: 689, pct: 32.2, description: "Leads or sits 1st-2nd through first half" },
  stalker: { count: 613, pct: 28.6, description: "Sits 3rd-5th, maintains position, moves late" },
  closer: { count: 521, pct: 24.3, description: "Runs back early, accelerates through final furlongs" },
  other: { count: 320, pct: 14.9, description: "Inconsistent or mixed running pattern" },
};

// Dataset overview stats
export const DATA_OVERVIEW = {
  totalRows: 985191,
  totalFiles: 5,
  totalSizeBytes: 133006548,
  dateRange: "Dec 24, 2025 – Mar 24, 2026",
  files: [
    { name: "GPS Races", rows: 395536, cols: 27, description: "GPS sectional timing at every half-furlong gate" },
    { name: "Traditional Races", rows: 26246, cols: 27, description: "Point-of-call positions and finishing data" },
    { name: "GPS PPs", rows: 466007, cols: 26, description: "Historical GPS past performances" },
    { name: "Starters PPs", rows: 37326, cols: 37, description: "Traditional past performances for GPS horses" },
    { name: "Upcoming Races", rows: 60076, cols: 25, description: "Future entries with jockey, trainer, owner" },
  ],
  tracks: ["AQU", "GP", "SA", "CD", "KEE", "CNL", "TAM", "OP", "FG", "LRL", "PRX", "HAW"],
  speedStats: { mean: 16.3, median: 16.4, stdev: 1.4, min: 7.6, max: 25.2 },
  strideLengthStats: { mean: 7.1, stdev: 0.5 },
};

export const RACE_GP_R13: RaceData = {
  track: "GP",
  date: "2026-01-24",
  raceNum: 13,
  distance: 9,
  surface: "D",
  purse: 3000000,
  raceType: "STK",
  horses: [
    {name:"Skippylongstocking",postPos:5,finish:1,odds:21.6,gates:[{g:0,p:1,spd:15.4,sl:7.3,t:6.55},{g:0.5,p:2,spd:15.9,sl:7.6,t:6.34},{g:1,p:2,spd:16.2,sl:7.5,t:6.24},{g:1.5,p:4,spd:16.0,sl:7.4,t:6.45},{g:2,p:5,spd:16.6,sl:7.6,t:6.2},{g:2.5,p:6,spd:16.9,sl:7.6,t:6.08},{g:3,p:8,spd:16.8,sl:7.6,t:6.08},{g:3.5,p:9,spd:17.0,sl:7.8,t:5.94},{g:4,p:9,spd:17.1,sl:7.8,t:5.87},{g:4.5,p:9,spd:17.0,sl:7.6,t:5.93},{g:5,p:8,spd:17.1,sl:7.7,t:5.89},{g:5.5,p:8,spd:17.1,sl:7.7,t:5.87},{g:6,p:8,spd:16.9,sl:7.8,t:5.95},{g:6.5,p:8,spd:17.2,sl:7.9,t:5.86},{g:7,p:8,spd:17.6,sl:7.9,t:5.73},{g:7.5,p:8,spd:17.5,sl:7.9,t:5.74},{g:8,p:8,spd:17.7,sl:7.6,t:5.71},{g:8.5,p:8,spd:16.2,sl:6.8,t:6.24}]},
    {name:"White Abarrio",postPos:10,finish:2,odds:3.4,gates:[{g:0,p:2,spd:14.7,sl:6.4,t:6.86},{g:0.5,p:1,spd:15.3,sl:6.8,t:6.59},{g:1,p:1,spd:15.6,sl:6.6,t:6.48},{g:1.5,p:1,spd:15.9,sl:6.8,t:6.48},{g:2,p:1,spd:16.4,sl:7.0,t:6.31},{g:2.5,p:1,spd:16.7,sl:7.1,t:6.16},{g:3,p:1,spd:17.0,sl:7.1,t:6.01},{g:3.5,p:4,spd:17.2,sl:7.2,t:5.92},{g:4,p:4,spd:17.3,sl:7.5,t:5.82},{g:4.5,p:5,spd:17.3,sl:7.3,t:5.83},{g:5,p:5,spd:17.4,sl:7.3,t:5.79},{g:5.5,p:6,spd:17.1,sl:7.3,t:5.9},{g:6,p:6,spd:17.2,sl:7.3,t:5.89},{g:6.5,p:6,spd:17.1,sl:7.3,t:5.89},{g:7,p:6,spd:17.8,sl:7.5,t:5.66},{g:7.5,p:6,spd:18.1,sl:7.7,t:5.57},{g:8,p:7,spd:18.3,sl:7.3,t:5.62},{g:8.5,p:7,spd:16.3,sl:6.5,t:6.17}]},
    {name:"Full Serrano (ARG)",postPos:3,finish:3,odds:9.5,gates:[{g:0,p:3,spd:14.3,sl:6.5,t:7.05},{g:0.5,p:3,spd:14.6,sl:6.8,t:6.89},{g:1,p:3,spd:15.2,sl:6.9,t:6.63},{g:1.5,p:2,spd:15.7,sl:6.9,t:6.46},{g:2,p:3,spd:16.1,sl:7.0,t:6.33},{g:2.5,p:4,spd:16.3,sl:7.1,t:6.29},{g:3,p:4,spd:16.5,sl:7.2,t:6.2},{g:3.5,p:3,spd:17.0,sl:7.2,t:5.93},{g:4,p:2,spd:17.3,sl:7.3,t:5.82},{g:4.5,p:2,spd:16.9,sl:7.3,t:5.95},{g:5,p:3,spd:16.8,sl:7.4,t:5.99},{g:5.5,p:3,spd:16.7,sl:7.3,t:6.01},{g:6,p:3,spd:17.1,sl:7.5,t:5.9},{g:6.5,p:3,spd:17.4,sl:7.6,t:5.77},{g:7,p:3,spd:17.7,sl:7.6,t:5.69},{g:7.5,p:3,spd:18.1,sl:7.6,t:5.56},{g:8,p:3,spd:18.7,sl:7.4,t:5.43},{g:8.5,p:4,spd:16.8,sl:6.7,t:6}]},
    {name:"Captain Cook",postPos:8,finish:4,odds:18.7,gates:[{g:0,p:4,spd:14.5,sl:6.8,t:6.92},{g:0.5,p:4,spd:14.8,sl:6.9,t:6.8},{g:1,p:5,spd:14.9,sl:6.9,t:6.76},{g:1.5,p:5,spd:15.3,sl:7.1,t:6.71},{g:2,p:4,spd:16.0,sl:7.1,t:6.45},{g:2.5,p:3,spd:16.4,sl:7.4,t:6.31},{g:3,p:3,spd:16.7,sl:7.3,t:6.19},{g:3.5,p:1,spd:17.0,sl:7.4,t:6.02},{g:4,p:1,spd:17.4,sl:7.5,t:5.8},{g:4.5,p:1,spd:16.9,sl:7.4,t:5.95},{g:5,p:1,spd:17.1,sl:7.6,t:5.9},{g:5.5,p:2,spd:16.8,sl:7.4,t:5.99},{g:6,p:2,spd:17.0,sl:7.5,t:5.93},{g:6.5,p:2,spd:17.4,sl:7.6,t:5.79},{g:7,p:2,spd:17.7,sl:7.7,t:5.69},{g:7.5,p:2,spd:18.0,sl:7.7,t:5.61},{g:8,p:1,spd:18.7,sl:7.5,t:5.49},{g:8.5,p:1,spd:17.5,sl:7.0,t:5.76}]},
    {name:"British Isles",postPos:2,finish:5,odds:83.8,gates:[{g:0,p:5,spd:14.5,sl:6.8,t:6.96},{g:0.5,p:5,spd:14.9,sl:7.0,t:6.73},{g:1,p:6,spd:15.4,sl:7.1,t:6.57},{g:1.5,p:6,spd:15.6,sl:7.0,t:6.54},{g:2,p:8,spd:16.1,sl:7.2,t:6.32},{g:2.5,p:8,spd:16.4,sl:7.2,t:6.22},{g:3,p:9,spd:16.4,sl:7.3,t:6.2},{g:3.5,p:8,spd:16.5,sl:7.5,t:6.12},{g:4,p:7,spd:16.9,sl:7.6,t:5.95},{g:4.5,p:6,spd:16.6,sl:7.5,t:6.05},{g:5,p:6,spd:16.8,sl:7.6,t:6},{g:5.5,p:5,spd:16.9,sl:7.6,t:5.95},{g:6,p:5,spd:17.0,sl:7.7,t:5.93},{g:6.5,p:5,spd:17.2,sl:7.7,t:5.85},{g:7,p:5,spd:17.6,sl:7.7,t:5.72},{g:7.5,p:4,spd:18.0,sl:7.7,t:5.58},{g:8,p:4,spd:18.4,sl:7.4,t:5.5},{g:8.5,p:6,spd:16.6,sl:6.5,t:6.06}]},
    {name:"Banishing",postPos:4,finish:6,odds:20.3,gates:[{g:0,p:6,spd:14.9,sl:7.0,t:6.76},{g:0.5,p:7,spd:14.5,sl:7.1,t:6.93},{g:1,p:7,spd:15.0,sl:7.2,t:6.79},{g:1.5,p:8,spd:15.5,sl:7.3,t:6.69},{g:2,p:7,spd:16.2,sl:7.5,t:6.38},{g:2.5,p:7,spd:16.3,sl:7.5,t:6.37},{g:3,p:6,spd:16.5,sl:7.6,t:6.23},{g:3.5,p:6,spd:17.1,sl:7.9,t:5.95},{g:4,p:6,spd:17.7,sl:8.0,t:5.7},{g:4.5,p:7,spd:17.5,sl:8.0,t:5.74},{g:5,p:9,spd:17.4,sl:7.9,t:5.77},{g:5.5,p:9,spd:17.2,sl:7.9,t:5.87},{g:6,p:9,spd:16.9,sl:7.7,t:5.97},{g:6.5,p:9,spd:17.3,sl:7.8,t:5.81},{g:7,p:9,spd:17.9,sl:7.9,t:5.64},{g:7.5,p:9,spd:17.7,sl:7.8,t:5.69},{g:8,p:9,spd:17.4,sl:7.6,t:5.82},{g:8.5,p:9,spd:15.6,sl:6.8,t:6.44}]},
    {name:"Lightning Tones",postPos:12,finish:7,odds:130.6,gates:[{g:0,p:7,spd:15.0,sl:7.1,t:6.72},{g:0.5,p:8,spd:15.5,sl:7.5,t:6.47},{g:1,p:9,spd:15.8,sl:7.3,t:6.41},{g:1.5,p:10,spd:15.8,sl:7.3,t:6.53},{g:2,p:11,spd:16.2,sl:7.5,t:6.36},{g:2.5,p:12,spd:16.1,sl:7.4,t:6.39},{g:3,p:12,spd:16.2,sl:7.6,t:6.31},{g:3.5,p:12,spd:16.8,sl:7.7,t:6.05},{g:4,p:12,spd:17.3,sl:7.9,t:5.82},{g:4.5,p:12,spd:17.2,sl:7.8,t:5.85},{g:5,p:12,spd:17.0,sl:7.8,t:5.91},{g:5.5,p:12,spd:16.8,sl:7.7,t:6.01},{g:6,p:11,spd:17.0,sl:7.8,t:5.91},{g:6.5,p:11,spd:17.5,sl:7.7,t:5.74},{g:7,p:11,spd:17.4,sl:7.8,t:5.78},{g:7.5,p:11,spd:17.2,sl:7.9,t:5.85},{g:8,p:11,spd:17.5,sl:7.8,t:5.83},{g:8.5,p:10,spd:15.2,sl:6.7,t:6.64}]},
    {name:"Disco Time",postPos:1,finish:8,odds:1.5,gates:[{g:0,p:8,spd:13.8,sl:6.2,t:7.31},{g:0.5,p:6,spd:14.2,sl:6.4,t:7.08},{g:1,p:4,spd:14.9,sl:6.5,t:6.77},{g:1.5,p:3,spd:15.3,sl:6.4,t:6.65},{g:2,p:2,spd:15.9,sl:6.7,t:6.44},{g:2.5,p:2,spd:16.3,sl:6.7,t:6.29},{g:3,p:2,spd:16.7,sl:6.9,t:6.1},{g:3.5,p:2,spd:17.2,sl:6.9,t:5.86},{g:4,p:3,spd:17.2,sl:7.0,t:5.84},{g:4.5,p:3,spd:16.8,sl:7.1,t:5.98},{g:5,p:2,spd:16.4,sl:7.0,t:6.15},{g:5.5,p:1,spd:16.9,sl:7.1,t:5.97},{g:6,p:1,spd:16.9,sl:7.2,t:5.94},{g:6.5,p:1,spd:17.4,sl:7.2,t:5.78},{g:7,p:1,spd:17.9,sl:7.3,t:5.61},{g:7.5,p:1,spd:18.2,sl:7.2,t:5.53},{g:8,p:2,spd:18.7,sl:7.3,t:5.42},{g:8.5,p:2,spd:17.0,sl:6.5,t:5.91}]},
    {name:"Mika",postPos:9,finish:9,odds:23.8,gates:[{g:0,p:9,spd:13.9,sl:6.7,t:7.22},{g:0.5,p:9,spd:14.2,sl:7.0,t:7.08},{g:1,p:8,spd:14.7,sl:7.1,t:6.91},{g:1.5,p:7,spd:15.4,sl:7.2,t:6.8},{g:2,p:6,spd:16.0,sl:7.5,t:6.58},{g:2.5,p:5,spd:16.5,sl:7.4,t:6.24},{g:3,p:5,spd:16.6,sl:7.6,t:6.12},{g:3.5,p:5,spd:16.7,sl:7.6,t:6.03},{g:4,p:5,spd:17.0,sl:7.5,t:5.93},{g:4.5,p:4,spd:17.1,sl:7.6,t:5.89},{g:5,p:4,spd:17.1,sl:7.5,t:5.89},{g:5.5,p:4,spd:16.9,sl:7.5,t:5.95},{g:6,p:4,spd:17.0,sl:7.7,t:5.91},{g:6.5,p:4,spd:17.4,sl:7.6,t:5.8},{g:7,p:4,spd:17.7,sl:7.6,t:5.68},{g:7.5,p:5,spd:18.1,sl:7.9,t:5.59},{g:8,p:5,spd:18.5,sl:7.6,t:5.56},{g:8.5,p:5,spd:16.7,sl:6.7,t:6.02}]},
    {name:"Poster",postPos:7,finish:10,odds:22.6,gates:[{g:0,p:10,spd:14.2,sl:6.9,t:7.1},{g:0.5,p:10,spd:14.5,sl:6.8,t:6.92},{g:1,p:12,spd:14.4,sl:6.9,t:7.05},{g:1.5,p:11,spd:14.9,sl:6.9,t:6.89},{g:2,p:10,spd:15.4,sl:7.1,t:6.69},{g:2.5,p:10,spd:16.0,sl:7.2,t:6.43},{g:3,p:10,spd:16.6,sl:7.3,t:6.17},{g:3.5,p:10,spd:17.0,sl:7.4,t:5.97},{g:4,p:10,spd:17.2,sl:7.6,t:5.86},{g:4.5,p:10,spd:17.2,sl:7.5,t:5.86},{g:5,p:10,spd:17.5,sl:7.7,t:5.76},{g:5.5,p:10,spd:17.4,sl:7.5,t:5.78},{g:6,p:12,spd:16.9,sl:7.5,t:5.97},{g:6.5,p:10,spd:16.9,sl:7.4,t:5.99},{g:7,p:10,spd:17.6,sl:7.5,t:5.78},{g:7.5,p:10,spd:17.9,sl:7.4,t:5.69},{g:8,p:10,spd:18.0,sl:7.7,t:5.68},{g:8.5,p:11,spd:15.1,sl:6.2,t:6.69}]},
    {name:"Brotha Keny",postPos:11,finish:11,odds:64,gates:[{g:0,p:11,spd:14.0,sl:7.0,t:7.19},{g:0.5,p:11,spd:14.0,sl:7.2,t:7.18},{g:1,p:11,spd:14.8,sl:7.4,t:6.82},{g:1.5,p:12,spd:15.2,sl:7.3,t:6.73},{g:2,p:12,spd:16.0,sl:7.6,t:6.45},{g:2.5,p:11,spd:16.1,sl:7.6,t:6.44},{g:3,p:11,spd:16.2,sl:8.0,t:6.34},{g:3.5,p:11,spd:16.8,sl:8.1,t:6.03},{g:4,p:11,spd:17.3,sl:8.2,t:5.81},{g:4.5,p:11,spd:17.0,sl:8.1,t:5.91},{g:5,p:11,spd:17.1,sl:8.0,t:5.88},{g:5.5,p:11,spd:16.9,sl:8.0,t:5.94},{g:6,p:10,spd:17.4,sl:8.0,t:5.77},{g:6.5,p:12,spd:17.5,sl:8.0,t:5.76},{g:7,p:12,spd:17.6,sl:7.9,t:5.73},{g:7.5,p:12,spd:17.3,sl:8.0,t:5.81},{g:8,p:12,spd:17.5,sl:8.0,t:5.87},{g:8.5,p:12,spd:14.9,sl:6.8,t:6.76}]},
    {name:"Tappan Street",postPos:6,finish:12,odds:3.3,gates:[{g:0,p:12,spd:13.9,sl:6.6,t:7.26},{g:0.5,p:12,spd:13.5,sl:6.4,t:7.46},{g:1,p:10,spd:14.3,sl:6.7,t:7.1},{g:1.5,p:9,spd:14.9,sl:6.8,t:6.93},{g:2,p:9,spd:15.7,sl:7.0,t:6.59},{g:2.5,p:9,spd:16.3,sl:7.1,t:6.36},{g:3,p:7,spd:16.8,sl:7.2,t:6.13},{g:3.5,p:7,spd:17.0,sl:7.4,t:5.96},{g:4,p:8,spd:17.1,sl:7.6,t:5.89},{g:4.5,p:8,spd:17.1,sl:7.5,t:5.89},{g:5,p:7,spd:17.1,sl:7.3,t:5.89},{g:5.5,p:7,spd:17.1,sl:7.5,t:5.9},{g:6,p:7,spd:17.1,sl:7.4,t:5.9},{g:6.5,p:7,spd:16.9,sl:7.6,t:5.95},{g:7,p:7,spd:17.3,sl:7.5,t:5.83},{g:7.5,p:7,spd:17.6,sl:7.5,t:5.72},{g:8,p:6,spd:17.7,sl:7.5,t:5.77},{g:8.5,p:3,spd:16.9,sl:6.7,t:5.98}]},
  ],
};

export const RACE_FG_R12: RaceData = {
  track: "FG",
  date: "2026-03-21",
  raceNum: 12,
  distance: 9.5,
  surface: "D",
  purse: 1000000,
  raceType: "STK",
  horses: [
    {name:"Emerging Market",postPos:9,finish:1,odds:2,gates:[{g:0,p:1,spd:16.0,sl:7.3,t:6.29},{g:0.5,p:2,spd:16.2,sl:7.4,t:6.22},{g:1,p:2,spd:16.4,sl:7.5,t:6.13},{g:1.5,p:2,spd:16.3,sl:7.6,t:6.18},{g:2,p:2,spd:16.4,sl:7.4,t:6.17},{g:2.5,p:3,spd:15.9,sl:7.4,t:6.51},{g:3,p:4,spd:16.1,sl:7.5,t:6.52},{g:3.5,p:4,spd:16.4,sl:7.6,t:6.28},{g:4,p:5,spd:16.5,sl:7.7,t:6.1},{g:4.5,p:5,spd:16.6,sl:7.9,t:6.07},{g:5,p:5,spd:17.1,sl:7.9,t:5.9},{g:5.5,p:5,spd:16.8,sl:7.8,t:5.99},{g:6,p:5,spd:16.5,sl:7.7,t:6.28},{g:6.5,p:5,spd:16.8,sl:7.9,t:6.01},{g:7,p:5,spd:18.1,sl:8.2,t:5.55},{g:7.5,p:4,spd:18.9,sl:8.2,t:5.33},{g:8,p:4,spd:18.5,sl:7.7,t:5.44},{g:8.5,p:4,spd:18.3,sl:7.7,t:5.5},{g:9,p:3,spd:15.0,sl:6.2,t:6.72}]},
    {name:"Pavlovian",postPos:1,finish:2,odds:21.7,gates:[{g:0,p:2,spd:15.7,sl:6.8,t:6.41},{g:0.5,p:1,spd:16.2,sl:7.0,t:6.21},{g:1,p:1,spd:16.5,sl:7.0,t:6.1},{g:1.5,p:1,spd:16.2,sl:7.0,t:6.22},{g:2,p:1,spd:15.9,sl:7.1,t:6.31},{g:2.5,p:1,spd:15.6,sl:6.9,t:6.47},{g:3,p:1,spd:15.6,sl:7.0,t:6.61},{g:3.5,p:1,spd:16.3,sl:7.1,t:6.28},{g:4,p:1,spd:16.1,sl:7.3,t:6.25},{g:4.5,p:1,spd:16.4,sl:7.5,t:6.13},{g:5,p:1,spd:16.9,sl:7.5,t:5.96},{g:5.5,p:1,spd:17.1,sl:7.3,t:5.9},{g:6,p:1,spd:16.8,sl:7.3,t:6.12},{g:6.5,p:1,spd:16.6,sl:7.5,t:6.08},{g:7,p:1,spd:18.3,sl:7.7,t:5.5},{g:7.5,p:1,spd:18.9,sl:7.8,t:5.32},{g:8,p:1,spd:18.9,sl:7.7,t:5.33},{g:8.5,p:1,spd:18.2,sl:7.5,t:5.52},{g:9,p:1,spd:15.5,sl:6.2,t:6.49}]},
    {name:"Golden Tempo",postPos:5,finish:3,odds:3.1,gates:[{g:0,p:3,spd:16.3,sl:7.4,t:6.18},{g:0.5,p:3,spd:16.3,sl:7.6,t:6.19},{g:1,p:3,spd:16.5,sl:7.6,t:6.09},{g:1.5,p:4,spd:16.3,sl:7.5,t:6.19},{g:2,p:4,spd:16.2,sl:7.6,t:6.22},{g:2.5,p:5,spd:16.4,sl:7.4,t:6.31},{g:3,p:7,spd:16.4,sl:7.5,t:6.38},{g:3.5,p:7,spd:16.5,sl:7.6,t:6.23},{g:4,p:8,spd:16.9,sl:7.9,t:5.96},{g:4.5,p:8,spd:17.1,sl:7.9,t:5.89},{g:5,p:8,spd:17.0,sl:7.8,t:5.92},{g:5.5,p:8,spd:16.6,sl:7.9,t:6.06},{g:6,p:8,spd:16.3,sl:7.5,t:6.32},{g:6.5,p:8,spd:17.0,sl:7.9,t:5.94},{g:7,p:8,spd:18.2,sl:8.0,t:5.52},{g:7.5,p:8,spd:18.6,sl:8.0,t:5.4},{g:8,p:9,spd:18.2,sl:8.0,t:5.54},{g:8.5,p:9,spd:17.7,sl:7.8,t:5.69},{g:9,p:9,spd:13.7,sl:6.2,t:7.38}]},
    {name:"Universe",postPos:4,finish:4,odds:17.4,gates:[{g:0,p:4,spd:15.7,sl:7.5,t:6.42},{g:0.5,p:4,spd:16.2,sl:7.5,t:6.2},{g:1,p:5,spd:16.3,sl:7.5,t:6.18},{g:1.5,p:5,spd:16.1,sl:7.5,t:6.26},{g:2,p:6,spd:15.7,sl:7.3,t:6.5},{g:2.5,p:7,spd:15.8,sl:7.3,t:6.55},{g:3,p:6,spd:15.8,sl:7.3,t:6.58},{g:3.5,p:6,spd:16.1,sl:7.6,t:6.36},{g:4,p:6,spd:16.4,sl:7.6,t:6.12},{g:4.5,p:6,spd:17.1,sl:7.8,t:5.87},{g:5,p:6,spd:16.9,sl:7.7,t:5.96},{g:5.5,p:6,spd:16.7,sl:7.6,t:6.04},{g:6,p:6,spd:16.2,sl:7.5,t:6.38},{g:6.5,p:6,spd:16.9,sl:7.6,t:5.96},{g:7,p:6,spd:18.1,sl:8.0,t:5.55},{g:7.5,p:6,spd:18.3,sl:8.0,t:5.48},{g:8,p:6,spd:18.3,sl:8.0,t:5.5},{g:8.5,p:6,spd:17.9,sl:7.7,t:5.63},{g:9,p:5,spd:14.8,sl:6.0,t:6.79}]},
    {name:"Chip Honcho",postPos:3,finish:5,odds:2.1,gates:[{g:0,p:5,spd:14.4,sl:7.1,t:7},{g:0.5,p:5,spd:14.9,sl:7.2,t:6.76},{g:1,p:4,spd:15.3,sl:7.3,t:6.58},{g:1.5,p:3,spd:15.7,sl:7.4,t:6.41},{g:2,p:3,spd:15.9,sl:7.4,t:6.32},{g:2.5,p:2,spd:15.7,sl:7.3,t:6.54},{g:3,p:2,spd:16.0,sl:7.3,t:6.54},{g:3.5,p:3,spd:16.3,sl:7.6,t:6.29},{g:4,p:3,spd:16.6,sl:7.7,t:6.07},{g:4.5,p:3,spd:16.5,sl:7.7,t:6.1},{g:5,p:3,spd:16.8,sl:7.8,t:6},{g:5.5,p:3,spd:16.9,sl:7.7,t:5.94},{g:6,p:3,spd:16.5,sl:7.6,t:6.31},{g:6.5,p:3,spd:16.9,sl:7.7,t:5.96},{g:7,p:3,spd:18.0,sl:7.8,t:5.6},{g:7.5,p:3,spd:18.8,sl:8.0,t:5.36},{g:8,p:3,spd:19.0,sl:8.1,t:5.3},{g:8.5,p:2,spd:18.5,sl:7.9,t:5.43},{g:9,p:2,spd:15.1,sl:6.3,t:6.68}]},
    {name:"Blacksmith",postPos:7,finish:6,odds:6.4,gates:[{g:0,p:6,spd:15.1,sl:7.1,t:6.65},{g:0.5,p:6,spd:15.7,sl:7.3,t:6.42},{g:1,p:7,spd:15.9,sl:7.4,t:6.34},{g:1.5,p:7,spd:15.8,sl:7.3,t:6.38},{g:2,p:9,spd:15.7,sl:7.3,t:6.48},{g:2.5,p:8,spd:15.9,sl:7.2,t:6.52},{g:3,p:8,spd:15.7,sl:7.2,t:6.72},{g:3.5,p:8,spd:16.1,sl:7.4,t:6.4},{g:4,p:7,spd:16.4,sl:7.6,t:6.12},{g:4.5,p:7,spd:17.1,sl:7.7,t:5.89},{g:5,p:7,spd:16.9,sl:7.6,t:5.95},{g:5.5,p:7,spd:16.4,sl:7.5,t:6.12},{g:6,p:7,spd:16.2,sl:7.3,t:6.37},{g:6.5,p:7,spd:17.2,sl:7.6,t:5.87},{g:7,p:7,spd:18.2,sl:7.8,t:5.54},{g:7.5,p:7,spd:18.4,sl:8.0,t:5.45},{g:8,p:7,spd:18.4,sl:7.9,t:5.47},{g:8.5,p:7,spd:18.2,sl:7.6,t:5.52},{g:9,p:7,spd:13.9,sl:5.9,t:7.22}]},
    {name:"Spirit of Royal",postPos:6,finish:7,odds:82.6,gates:[{g:0,p:7,spd:14.8,sl:6.9,t:6.8},{g:0.5,p:7,spd:15.5,sl:6.9,t:6.5},{g:1,p:6,spd:15.6,sl:6.9,t:6.46},{g:1.5,p:6,spd:15.6,sl:7.1,t:6.45},{g:2,p:8,spd:16.1,sl:7.1,t:6.25},{g:2.5,p:9,spd:16.1,sl:7.0,t:6.29},{g:3,p:9,spd:16.3,sl:6.9,t:6.38},{g:3.5,p:9,spd:16.4,sl:7.2,t:6.29},{g:4,p:9,spd:16.5,sl:7.3,t:6.09},{g:4.5,p:9,spd:16.4,sl:7.2,t:6.13},{g:5,p:9,spd:16.5,sl:7.2,t:6.09},{g:5.5,p:9,spd:16.7,sl:7.3,t:6.04},{g:6,p:9,spd:16.4,sl:7.3,t:6.3},{g:6.5,p:9,spd:17.1,sl:7.3,t:5.89},{g:7,p:9,spd:18.0,sl:7.5,t:5.59},{g:7.5,p:9,spd:18.3,sl:7.6,t:5.48},{g:8,p:8,spd:17.9,sl:7.5,t:5.61},{g:8.5,p:8,spd:17.5,sl:7.4,t:5.76},{g:9,p:8,spd:13.9,sl:6.0,t:7.25}]},
    {name:"Easterly",postPos:8,finish:8,odds:18.4,gates:[{g:0,p:8,spd:13.9,sl:7.0,t:7.23},{g:0.5,p:8,spd:14.4,sl:7.2,t:6.99},{g:1,p:8,spd:15.1,sl:7.3,t:6.67},{g:1.5,p:9,spd:14.9,sl:7.2,t:6.74},{g:2,p:7,spd:15.0,sl:7.4,t:6.71},{g:2.5,p:6,spd:15.2,sl:7.4,t:6.77},{g:3,p:5,spd:15.7,sl:7.4,t:6.69},{g:3.5,p:5,spd:16.2,sl:7.6,t:6.36},{g:4,p:4,spd:16.2,sl:7.7,t:6.2},{g:4.5,p:4,spd:16.8,sl:7.7,t:5.99},{g:5,p:4,spd:16.9,sl:7.6,t:5.96},{g:5.5,p:4,spd:16.8,sl:7.7,t:5.98},{g:6,p:4,spd:16.2,sl:7.7,t:6.37},{g:6.5,p:4,spd:17.0,sl:7.8,t:5.93},{g:7,p:4,spd:18.6,sl:8.4,t:5.41},{g:7.5,p:5,spd:18.9,sl:8.0,t:5.32},{g:8,p:5,spd:18.6,sl:8.0,t:5.42},{g:8.5,p:5,spd:18.5,sl:7.6,t:5.44},{g:9,p:6,spd:14.6,sl:5.9,t:6.88}]},
    {name:"Autobahn",postPos:2,finish:9,odds:45.8,gates:[{g:0,p:9,spd:12.7,sl:6.3,t:7.95},{g:0.5,p:9,spd:13.3,sl:6.6,t:7.59},{g:1,p:9,spd:14.0,sl:6.7,t:7.18},{g:1.5,p:8,spd:14.3,sl:6.8,t:7.05},{g:2,p:5,spd:14.7,sl:7.0,t:6.84},{g:2.5,p:4,spd:15.4,sl:6.9,t:6.64},{g:3,p:3,spd:15.7,sl:7.2,t:6.62},{g:3.5,p:2,spd:16.4,sl:7.4,t:6.26},{g:4,p:2,spd:16.5,sl:7.3,t:6.1},{g:4.5,p:2,spd:16.4,sl:7.4,t:6.14},{g:5,p:2,spd:16.6,sl:7.5,t:6.05},{g:5.5,p:2,spd:17.0,sl:7.7,t:5.92},{g:6,p:2,spd:16.7,sl:7.5,t:6.17},{g:6.5,p:2,spd:16.8,sl:7.6,t:6},{g:7,p:2,spd:18.0,sl:8.0,t:5.59},{g:7.5,p:2,spd:18.8,sl:8.0,t:5.34},{g:8,p:2,spd:19.2,sl:7.9,t:5.24},{g:8.5,p:3,spd:18.6,sl:7.5,t:5.41},{g:9,p:4,spd:14.9,sl:6.1,t:6.76}]},
  ],
};

export const RACE_AQU_R10: RaceData = {
  track: "AQU",
  date: "2026-02-28",
  raceNum: 10,
  distance: 8,
  surface: "D",
  purse: 300000,
  raceType: "STK",
  horses: [
    {name:"Iron Honor",postPos:6,finish:1,odds:1.2,gates:[{g:0,p:1,spd:14.3,sl:6.7,t:7.02},{g:0.5,p:1,spd:15.1,sl:6.9,t:6.67},{g:1,p:1,spd:15.9,sl:7.1,t:6.33},{g:1.5,p:2,spd:15.9,sl:7.1,t:6.38},{g:2,p:2,spd:16.0,sl:7.1,t:6.42},{g:2.5,p:2,spd:16.1,sl:7.2,t:6.34},{g:3,p:2,spd:16.1,sl:7.2,t:6.32},{g:3.5,p:1,spd:16.4,sl:7.3,t:6.19},{g:4,p:1,spd:16.8,sl:7.5,t:5.98},{g:4.5,p:1,spd:17.1,sl:7.5,t:5.87},{g:5,p:1,spd:17.5,sl:7.6,t:5.76},{g:5.5,p:1,spd:17.9,sl:7.7,t:5.61},{g:6,p:1,spd:18.3,sl:7.6,t:5.5},{g:6.5,p:1,spd:18.6,sl:7.6,t:5.42},{g:7,p:1,spd:18.3,sl:7.5,t:5.5},{g:7.5,p:3,spd:15.1,sl:6.0,t:6.67}]},
    {name:"Crown the Buckeye",postPos:3,finish:2,odds:9.39,gates:[{g:0,p:2,spd:14.2,sl:6.4,t:7.09},{g:0.5,p:2,spd:14.9,sl:6.7,t:6.74},{g:1,p:2,spd:15.5,sl:6.9,t:6.51},{g:1.5,p:1,spd:15.9,sl:7.0,t:6.33},{g:2,p:1,spd:15.8,sl:7.1,t:6.38},{g:2.5,p:1,spd:16.0,sl:7.1,t:6.32},{g:3,p:1,spd:16.1,sl:7.3,t:6.25},{g:3.5,p:2,spd:16.4,sl:7.4,t:6.14},{g:4,p:2,spd:16.9,sl:7.7,t:5.95},{g:4.5,p:2,spd:17.1,sl:7.6,t:5.89},{g:5,p:2,spd:17.5,sl:7.7,t:5.74},{g:5.5,p:2,spd:18.1,sl:7.7,t:5.57},{g:6,p:2,spd:18.4,sl:7.8,t:5.48},{g:6.5,p:3,spd:18.3,sl:7.8,t:5.52},{g:7,p:3,spd:17.9,sl:7.5,t:5.63},{g:7.5,p:2,spd:15.3,sl:6.4,t:6.6}]},
    {name:"Right to Party",postPos:5,finish:3,odds:9.29,gates:[{g:0,p:3,spd:14.2,sl:7.0,t:7.07},{g:0.5,p:3,spd:15.2,sl:7.3,t:6.62},{g:1,p:4,spd:15.6,sl:7.2,t:6.43},{g:1.5,p:8,spd:15.7,sl:7.1,t:6.5},{g:2,p:8,spd:15.7,sl:7.5,t:6.52},{g:2.5,p:8,spd:16.1,sl:7.4,t:6.3},{g:3,p:8,spd:16.2,sl:7.6,t:6.21},{g:3.5,p:8,spd:16.4,sl:7.6,t:6.14},{g:4,p:8,spd:16.9,sl:7.9,t:5.95},{g:4.5,p:8,spd:17.4,sl:7.8,t:5.79},{g:5,p:8,spd:17.6,sl:7.9,t:5.73},{g:5.5,p:8,spd:17.9,sl:7.7,t:5.61},{g:6,p:8,spd:17.9,sl:7.8,t:5.61},{g:6.5,p:8,spd:17.8,sl:7.9,t:5.65},{g:7,p:8,spd:17.5,sl:7.7,t:5.74},{g:7.5,p:8,spd:13.6,sl:5.9,t:7.4}]},
    {name:"Exhibition Only",postPos:7,finish:4,odds:19.61,gates:[{g:0,p:4,spd:13.9,sl:6.3,t:7.24},{g:0.5,p:4,spd:14.4,sl:6.5,t:6.97},{g:1,p:3,spd:14.9,sl:6.6,t:6.77},{g:1.5,p:3,spd:15.2,sl:6.7,t:6.69},{g:2,p:3,spd:15.6,sl:6.9,t:6.55},{g:2.5,p:4,spd:16.0,sl:7.0,t:6.4},{g:3,p:4,spd:16.3,sl:7.1,t:6.29},{g:3.5,p:4,spd:16.6,sl:7.1,t:6.21},{g:4,p:4,spd:16.9,sl:7.3,t:5.97},{g:4.5,p:4,spd:17.1,sl:7.5,t:5.88},{g:5,p:4,spd:17.6,sl:7.5,t:5.73},{g:5.5,p:4,spd:18.0,sl:7.5,t:5.59},{g:6,p:4,spd:18.1,sl:7.6,t:5.55},{g:6.5,p:4,spd:18.3,sl:7.6,t:5.52},{g:7,p:4,spd:18.1,sl:7.5,t:5.56},{g:7.5,p:4,spd:15.0,sl:6.2,t:6.73}]},
    {name:"Balboa",postPos:1,finish:5,odds:2.87,gates:[{g:0,p:5,spd:14.1,sl:6.6,t:7.16},{g:0.5,p:5,spd:14.5,sl:6.7,t:6.93},{g:1,p:7,spd:15.2,sl:6.9,t:6.64},{g:1.5,p:6,spd:15.4,sl:7.0,t:6.58},{g:2,p:7,spd:15.3,sl:7.0,t:6.58},{g:2.5,p:7,spd:15.6,sl:7.2,t:6.46},{g:3,p:7,spd:16.0,sl:7.3,t:6.29},{g:3.5,p:7,spd:16.3,sl:7.4,t:6.22},{g:4,p:7,spd:17.0,sl:7.8,t:5.92},{g:4.5,p:7,spd:17.1,sl:7.8,t:5.89},{g:5,p:7,spd:17.3,sl:7.8,t:5.8},{g:5.5,p:7,spd:17.6,sl:7.7,t:5.72},{g:6,p:7,spd:18.1,sl:7.7,t:5.55},{g:6.5,p:7,spd:18.1,sl:7.6,t:5.58},{g:7,p:6,spd:17.6,sl:7.5,t:5.73},{g:7.5,p:5,spd:14.9,sl:6.2,t:6.74}]},
    {name:"Hammond",postPos:2,finish:6,odds:8.43,gates:[{g:0,p:6,spd:13.7,sl:6.2,t:7.36},{g:0.5,p:6,spd:14.3,sl:6.4,t:7.02},{g:1,p:5,spd:14.9,sl:6.6,t:6.75},{g:1.5,p:5,spd:15.0,sl:6.5,t:6.73},{g:2,p:5,spd:15.1,sl:6.6,t:6.67},{g:2.5,p:5,spd:15.8,sl:6.9,t:6.39},{g:3,p:5,spd:16.0,sl:7.0,t:6.29},{g:3.5,p:5,spd:16.5,sl:7.2,t:6.12},{g:4,p:5,spd:16.9,sl:7.5,t:5.95},{g:4.5,p:5,spd:17.0,sl:7.5,t:5.91},{g:5,p:5,spd:17.5,sl:7.5,t:5.75},{g:5.5,p:5,spd:17.9,sl:7.6,t:5.62},{g:6,p:5,spd:18.3,sl:7.7,t:5.5},{g:6.5,p:5,spd:18.2,sl:7.4,t:5.54},{g:7,p:5,spd:17.8,sl:7.2,t:5.64},{g:7.5,p:6,spd:14.8,sl:5.8,t:6.79}]},
    {name:"Dirty Rich",postPos:8,finish:7,odds:22.58,gates:[{g:0,p:7,spd:13.6,sl:6.5,t:7.41},{g:0.5,p:7,spd:14.3,sl:6.7,t:7.04},{g:1,p:6,spd:14.8,sl:6.8,t:6.81},{g:1.5,p:4,spd:14.8,sl:6.9,t:6.82},{g:2,p:4,spd:15.3,sl:7.4,t:6.65},{g:2.5,p:3,spd:15.9,sl:7.1,t:6.44},{g:3,p:3,spd:16.2,sl:7.0,t:6.29},{g:3.5,p:3,spd:16.4,sl:7.4,t:6.23},{g:4,p:3,spd:16.8,sl:7.6,t:5.99},{g:4.5,p:3,spd:17.2,sl:7.7,t:5.86},{g:5,p:3,spd:17.5,sl:7.7,t:5.75},{g:5.5,p:3,spd:17.9,sl:7.9,t:5.61},{g:6,p:3,spd:18.2,sl:7.9,t:5.52},{g:6.5,p:2,spd:18.2,sl:7.8,t:5.53},{g:7,p:2,spd:17.7,sl:7.6,t:5.69},{g:7.5,p:1,spd:15.5,sl:6.6,t:6.48}]},
    {name:"Fourth and One",postPos:4,finish:8,odds:34.4,gates:[{g:0,p:8,spd:13.4,sl:6.4,t:7.48},{g:0.5,p:8,spd:14.1,sl:6.6,t:7.12},{g:1,p:8,spd:14.9,sl:6.8,t:6.73},{g:1.5,p:7,spd:15.1,sl:6.9,t:6.72},{g:2,p:6,spd:15.3,sl:7.0,t:6.67},{g:2.5,p:6,spd:16.0,sl:7.3,t:6.42},{g:3,p:6,spd:16.3,sl:7.3,t:6.27},{g:3.5,p:6,spd:16.5,sl:7.3,t:6.26},{g:4,p:6,spd:16.8,sl:7.3,t:6},{g:4.5,p:6,spd:17.2,sl:7.4,t:5.84},{g:5,p:6,spd:17.5,sl:7.5,t:5.75},{g:5.5,p:6,spd:17.7,sl:7.5,t:5.67},{g:6,p:6,spd:18.2,sl:7.7,t:5.53},{g:6.5,p:6,spd:18.5,sl:7.6,t:5.46},{g:7,p:7,spd:17.9,sl:7.4,t:5.63},{g:7.5,p:7,spd:14.6,sl:6.0,t:6.9}]},
  ],
};

export const RACE_GP_R12: RaceData = {
  track: "GP",
  date: "2026-01-24",
  raceNum: 12,
  distance: 9,
  surface: "T",
  purse: 1000000,
  raceType: "STK",
  horses: [
    {name:"Test Score",postPos:1,finish:1,odds:7.6,gates:[{g:0,p:1,spd:16.9,sl:7.4,t:5.97},{g:0.5,p:1,spd:17.2,sl:7.5,t:5.86},{g:1,p:1,spd:16.7,sl:7.3,t:6.07},{g:1.5,p:2,spd:16.8,sl:7.4,t:6.08},{g:2,p:3,spd:16.5,sl:7.3,t:6.14},{g:2.5,p:4,spd:17.0,sl:7.4,t:5.96},{g:3,p:4,spd:17.0,sl:7.5,t:5.92},{g:3.5,p:4,spd:17.0,sl:7.4,t:5.91},{g:4,p:4,spd:17.1,sl:7.6,t:5.88},{g:4.5,p:4,spd:17.0,sl:7.4,t:5.93},{g:5,p:3,spd:16.9,sl:7.3,t:5.95},{g:5.5,p:2,spd:17.4,sl:7.6,t:5.77},{g:6,p:5,spd:17.4,sl:7.6,t:5.78},{g:6.5,p:5,spd:17.3,sl:7.4,t:5.82},{g:7,p:5,spd:17.7,sl:7.3,t:5.71},{g:7.5,p:6,spd:18.2,sl:7.6,t:5.52},{g:8,p:6,spd:17.8,sl:7.3,t:5.66},{g:8.5,p:7,spd:14.1,sl:5.7,t:7.13}]},
    {name:"One Stripe (SAF)",postPos:4,finish:2,odds:4.3,gates:[{g:0,p:2,spd:17.1,sl:7.6,t:5.9},{g:0.5,p:3,spd:17.5,sl:7.7,t:5.74},{g:1,p:6,spd:17.0,sl:7.3,t:5.98},{g:1.5,p:9,spd:17.0,sl:7.5,t:6.08},{g:2,p:10,spd:17.3,sl:7.4,t:5.92},{g:2.5,p:11,spd:16.9,sl:7.4,t:6.04},{g:3,p:10,spd:16.8,sl:7.5,t:6.01},{g:3.5,p:9,spd:17.0,sl:7.6,t:5.93},{g:4,p:8,spd:17.1,sl:7.5,t:5.87},{g:4.5,p:7,spd:17.1,sl:7.5,t:5.9},{g:5,p:7,spd:17.2,sl:7.5,t:5.86},{g:5.5,p:7,spd:17.1,sl:7.7,t:5.87},{g:6,p:8,spd:17.2,sl:7.6,t:5.86},{g:6.5,p:8,spd:17.2,sl:7.2,t:5.85},{g:7,p:8,spd:17.7,sl:7.3,t:5.71},{g:7.5,p:8,spd:17.7,sl:7.2,t:5.69},{g:8,p:7,spd:17.3,sl:6.9,t:5.83},{g:8.5,p:5,spd:14.2,sl:5.6,t:7.09}]},
    {name:"Almendares (GB)",postPos:5,finish:3,odds:37.7,gates:[{g:0,p:3,spd:16.6,sl:7.6,t:6.06},{g:0.5,p:2,spd:17.1,sl:7.6,t:5.88},{g:1,p:2,spd:17.0,sl:7.6,t:5.97},{g:1.5,p:4,spd:17.3,sl:7.4,t:6.03},{g:2,p:8,spd:17.6,sl:7.7,t:5.89},{g:2.5,p:10,spd:17.2,sl:7.7,t:5.92},{g:3,p:11,spd:17.1,sl:7.9,t:5.9},{g:3.5,p:11,spd:17.2,sl:8.0,t:5.84},{g:4,p:11,spd:17.3,sl:8.0,t:5.81},{g:4.5,p:11,spd:17.3,sl:8.0,t:5.83},{g:5,p:11,spd:17.2,sl:7.9,t:5.84},{g:5.5,p:11,spd:17.3,sl:8.0,t:5.83},{g:6,p:11,spd:17.3,sl:8.0,t:5.82},{g:6.5,p:11,spd:17.2,sl:8.0,t:5.86},{g:7,p:11,spd:17.4,sl:7.7,t:5.8},{g:7.5,p:11,spd:17.7,sl:7.9,t:5.69},{g:8,p:11,spd:16.9,sl:7.5,t:5.94},{g:8.5,p:10,spd:13.7,sl:5.8,t:7.35}]},
    {name:"Astronomer",postPos:11,finish:4,odds:40.2,gates:[{g:0,p:4,spd:16.7,sl:7.4,t:6.04},{g:0.5,p:4,spd:17.2,sl:7.5,t:5.84},{g:1,p:5,spd:16.9,sl:7.3,t:5.97},{g:1.5,p:6,spd:16.7,sl:7.4,t:6.17},{g:2,p:5,spd:16.7,sl:7.5,t:6.15},{g:2.5,p:5,spd:16.9,sl:7.7,t:6.05},{g:3,p:5,spd:17.0,sl:7.5,t:5.93},{g:3.5,p:5,spd:17.2,sl:7.7,t:5.86},{g:4,p:6,spd:17.3,sl:7.7,t:5.83},{g:4.5,p:6,spd:17.3,sl:7.7,t:5.82},{g:5,p:6,spd:17.2,sl:7.7,t:5.87},{g:5.5,p:6,spd:17.1,sl:7.7,t:5.9},{g:6,p:6,spd:17.1,sl:7.7,t:5.87},{g:6.5,p:7,spd:17.2,sl:7.6,t:5.86},{g:7,p:6,spd:17.4,sl:7.5,t:5.85},{g:7.5,p:5,spd:18.0,sl:7.6,t:5.6},{g:8,p:5,spd:18.0,sl:7.6,t:5.6},{g:8.5,p:3,spd:14.3,sl:6.1,t:7.05}]},
    {name:"Program Trading (GB)",postPos:2,finish:5,odds:1.3,gates:[{g:0,p:5,spd:16.7,sl:7.3,t:6.03},{g:0.5,p:5,spd:17.0,sl:7.2,t:5.91},{g:1,p:4,spd:16.8,sl:7.1,t:6.02},{g:1.5,p:3,spd:17.0,sl:7.3,t:6},{g:2,p:9,spd:16.8,sl:7.3,t:6.04},{g:2.5,p:8,spd:17.1,sl:7.2,t:5.92},{g:3,p:8,spd:17.2,sl:7.4,t:5.87},{g:3.5,p:10,spd:17.1,sl:7.3,t:5.88},{g:4,p:10,spd:17.1,sl:7.3,t:5.87},{g:4.5,p:9,spd:17.2,sl:7.3,t:5.85},{g:5,p:8,spd:17.1,sl:7.2,t:5.89},{g:5.5,p:8,spd:16.5,sl:7.2,t:6.09},{g:6,p:7,spd:16.9,sl:7.3,t:5.97},{g:6.5,p:6,spd:17.5,sl:7.4,t:5.76},{g:7,p:7,spd:17.8,sl:7.4,t:5.65},{g:7.5,p:7,spd:18.3,sl:7.4,t:5.51},{g:8,p:9,spd:17.5,sl:7.1,t:5.75},{g:8.5,p:9,spd:13.9,sl:5.8,t:7.26}]},
    {name:"Fort Washington",postPos:12,finish:6,odds:13.2,gates:[{g:0,p:6,spd:17.1,sl:7.6,t:5.89},{g:0.5,p:8,spd:17.5,sl:7.4,t:5.75},{g:1,p:10,spd:16.9,sl:7.2,t:6.02},{g:1.5,p:12,spd:17.2,sl:7.4,t:6.04},{g:2,p:12,spd:17.3,sl:7.4,t:6.02},{g:2.5,p:12,spd:17.0,sl:7.4,t:6.05},{g:3,p:12,spd:17.1,sl:7.7,t:5.88},{g:3.5,p:12,spd:17.2,sl:7.7,t:5.85},{g:4,p:12,spd:17.4,sl:7.6,t:5.79},{g:4.5,p:12,spd:17.5,sl:7.5,t:5.76},{g:5,p:12,spd:17.1,sl:7.5,t:5.87},{g:5.5,p:12,spd:17.3,sl:7.5,t:5.82},{g:6,p:12,spd:17.0,sl:7.5,t:5.91},{g:6.5,p:12,spd:17.3,sl:7.5,t:5.81},{g:7,p:12,spd:17.5,sl:7.4,t:5.78},{g:7.5,p:12,spd:17.6,sl:7.6,t:5.72},{g:8,p:12,spd:17.0,sl:7.3,t:5.92},{g:8.5,p:12,spd:13.3,sl:5.6,t:7.55}]},
    {name:"Chasing the Crown",postPos:9,finish:7,odds:42.8,gates:[{g:0,p:7,spd:16.7,sl:7.1,t:6.03},{g:0.5,p:6,spd:16.9,sl:7.0,t:5.94},{g:1,p:7,spd:16.5,sl:7.1,t:6.16},{g:1.5,p:5,spd:17.1,sl:6.9,t:6.14},{g:2,p:6,spd:17.3,sl:7.1,t:6.03},{g:2.5,p:7,spd:17.3,sl:7.2,t:5.94},{g:3,p:7,spd:17.1,sl:7.2,t:5.94},{g:3.5,p:7,spd:17.3,sl:7.3,t:5.82},{g:4,p:9,spd:17.3,sl:7.3,t:5.8},{g:4.5,p:10,spd:17.4,sl:7.3,t:5.77},{g:5,p:10,spd:17.2,sl:7.2,t:5.86},{g:5.5,p:9,spd:17.0,sl:7.1,t:5.92},{g:6,p:9,spd:16.9,sl:7.1,t:5.96},{g:6.5,p:9,spd:17.3,sl:7.2,t:5.84},{g:7,p:9,spd:17.6,sl:7.0,t:5.76},{g:7.5,p:9,spd:17.8,sl:7.1,t:5.65},{g:8,p:8,spd:17.4,sl:6.8,t:5.77},{g:8.5,p:8,spd:13.9,sl:5.5,t:7.22}]},
    {name:"Call Sign Seven",postPos:6,finish:8,odds:37.4,gates:[{g:0,p:8,spd:16.6,sl:7.0,t:6.05},{g:0.5,p:9,spd:17.1,sl:7.0,t:5.89},{g:1,p:9,spd:16.9,sl:7.2,t:5.98},{g:1.5,p:11,spd:16.7,sl:7.0,t:6.17},{g:2,p:11,spd:16.9,sl:7.1,t:6.15},{g:2.5,p:9,spd:17.1,sl:7.1,t:6.04},{g:3,p:9,spd:17.0,sl:7.1,t:5.93},{g:3.5,p:8,spd:17.0,sl:7.1,t:5.93},{g:4,p:7,spd:17.3,sl:7.2,t:5.83},{g:4.5,p:8,spd:17.4,sl:7.2,t:5.77},{g:5,p:9,spd:17.4,sl:7.2,t:5.79},{g:5.5,p:10,spd:17.0,sl:7.1,t:5.92},{g:6,p:10,spd:17.2,sl:7.2,t:5.85},{g:6.5,p:10,spd:17.3,sl:7.0,t:5.8},{g:7,p:10,spd:17.6,sl:7.1,t:5.71},{g:7.5,p:10,spd:18.0,sl:7.1,t:5.59},{g:8,p:10,spd:17.3,sl:6.9,t:5.82},{g:8.5,p:11,spd:13.5,sl:5.4,t:7.43}]},
    {name:"Cabo Spirit",postPos:8,finish:9,odds:12.6,gates:[{g:0,p:9,spd:15.7,sl:7.1,t:6.4},{g:0.5,p:7,spd:16.2,sl:7.1,t:6.2},{g:1,p:3,spd:16.3,sl:7.2,t:6.25},{g:1.5,p:1,spd:16.5,sl:7.3,t:6.29},{g:2,p:1,spd:16.6,sl:7.2,t:6.2},{g:2.5,p:1,spd:17.0,sl:7.3,t:6.01},{g:3,p:1,spd:17.2,sl:7.4,t:5.86},{g:3.5,p:2,spd:17.1,sl:7.5,t:5.88},{g:4,p:2,spd:17.3,sl:7.6,t:5.82},{g:4.5,p:2,spd:17.3,sl:7.7,t:5.8},{g:5,p:1,spd:16.9,sl:7.6,t:5.95},{g:5.5,p:1,spd:17.2,sl:7.7,t:5.86},{g:6,p:1,spd:17.1,sl:7.5,t:5.89},{g:6.5,p:1,spd:17.3,sl:7.4,t:5.81},{g:7,p:1,spd:17.9,sl:7.6,t:5.66},{g:7.5,p:1,spd:18.5,sl:7.9,t:5.45},{g:8,p:1,spd:17.8,sl:7.5,t:5.65},{g:8.5,p:2,spd:14.5,sl:6.0,t:6.96}]},
    {name:"Beach Gold",postPos:3,finish:10,odds:17.2,gates:[{g:0,p:10,spd:15.7,sl:7.4,t:6.42},{g:0.5,p:10,spd:16.3,sl:7.6,t:6.17},{g:1,p:8,spd:16.3,sl:7.4,t:6.21},{g:1.5,p:8,spd:16.7,sl:7.6,t:6.21},{g:2,p:7,spd:16.8,sl:7.8,t:6.11},{g:2.5,p:6,spd:16.8,sl:7.7,t:6.06},{g:3,p:6,spd:16.9,sl:7.6,t:5.96},{g:3.5,p:6,spd:17.0,sl:7.9,t:5.92},{g:4,p:5,spd:17.1,sl:7.7,t:5.9},{g:4.5,p:5,spd:17.2,sl:7.7,t:5.84},{g:5,p:5,spd:17.1,sl:7.7,t:5.91},{g:5.5,p:5,spd:16.6,sl:7.6,t:6.05},{g:6,p:3,spd:17.1,sl:7.7,t:5.88},{g:6.5,p:4,spd:17.6,sl:7.9,t:5.73},{g:7,p:4,spd:17.6,sl:7.9,t:5.72},{g:7.5,p:4,spd:18.1,sl:7.9,t:5.55},{g:8,p:4,spd:17.7,sl:7.7,t:5.68},{g:8.5,p:1,spd:14.5,sl:6.2,t:6.96}]},
    {name:"Cugino",postPos:10,finish:11,odds:6.2,gates:[{g:0,p:11,spd:14.9,sl:7.0,t:6.77},{g:0.5,p:11,spd:16.0,sl:7.2,t:6.3},{g:1,p:11,spd:15.8,sl:7.1,t:6.44},{g:1.5,p:10,spd:16.5,sl:7.2,t:6.33},{g:2,p:4,spd:16.7,sl:7.4,t:6.25},{g:2.5,p:3,spd:16.8,sl:7.4,t:6.14},{g:3,p:3,spd:17.1,sl:7.5,t:5.93},{g:3.5,p:3,spd:17.2,sl:7.6,t:5.85},{g:4,p:3,spd:17.1,sl:7.6,t:5.87},{g:4.5,p:3,spd:17.3,sl:7.6,t:5.8},{g:5,p:4,spd:17.2,sl:7.6,t:5.86},{g:5.5,p:4,spd:16.8,sl:7.5,t:5.98},{g:6,p:2,spd:17.1,sl:7.5,t:5.89},{g:6.5,p:2,spd:17.4,sl:7.5,t:5.8},{g:7,p:2,spd:17.6,sl:7.5,t:5.73},{g:7.5,p:2,spd:18.4,sl:7.7,t:5.46},{g:8,p:2,spd:18.1,sl:7.5,t:5.55},{g:8.5,p:4,spd:14.2,sl:5.9,t:7.08}]},
    {name:"Major Dude",postPos:7,finish:12,odds:19.4,gates:[{g:0,p:12,spd:13.6,sl:6.4,t:7.37},{g:0.5,p:12,spd:14.7,sl:6.7,t:6.85},{g:1,p:12,spd:15.2,sl:6.7,t:6.66},{g:1.5,p:7,spd:16.0,sl:6.9,t:6.45},{g:2,p:2,spd:16.5,sl:7.0,t:6.25},{g:2.5,p:2,spd:16.8,sl:7.0,t:6.1},{g:3,p:2,spd:17.1,sl:7.1,t:5.91},{g:3.5,p:1,spd:17.0,sl:7.2,t:5.91},{g:4,p:1,spd:17.3,sl:7.3,t:5.82},{g:4.5,p:1,spd:17.5,sl:7.3,t:5.75},{g:5,p:2,spd:17.3,sl:7.3,t:5.8},{g:5.5,p:3,spd:17.1,sl:7.2,t:5.89},{g:6,p:4,spd:17.0,sl:7.2,t:5.93},{g:6.5,p:3,spd:17.3,sl:7.3,t:5.81},{g:7,p:3,spd:17.8,sl:7.4,t:5.7},{g:7.5,p:3,spd:18.3,sl:7.3,t:5.5},{g:8,p:3,spd:18.2,sl:7.2,t:5.54},{g:8.5,p:6,spd:14.2,sl:5.7,t:7.1}]},
  ],
};

export const ALL_RACES: RaceData[] = [FEATURED_RACE, RACE_GP_R13, RACE_FG_R12, RACE_AQU_R10, RACE_GP_R12];