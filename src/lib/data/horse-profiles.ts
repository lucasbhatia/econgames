// Pre-computed horse profiles for the EconGames platform
// 10 horses from the featured CNL stakes race + 10 additional horses with GPS data

export type RunningStyle = "Front Runner" | "Stalker" | "Closer";

export interface HorseProfile {
  name: string;
  registrationNumber: string;
  runningStyle: RunningStyle;
  topSpeed: number; // ft/s
  avgSpeed: number; // ft/s
  strideEfficiency: number; // speed/stride_length ratio, typically 2.1-2.5
  avgFinish: number; // average finishing position
  races: number; // number of GPS-tracked races
  bestDistance: string; // e.g. "6F", "8.5F"
  bestSurface: "Dirt" | "Turf" | "Both";
  speedCurve: number[]; // 8-10 speed values representing typical pace pattern
  recentForm: Array<{ finish: number; date: string; track: string }>;
  color: string; // hex color for charts
  imageUrl: string; // horse photo URL
  sire: string; // father horse name
  dam: string; // mother horse name
  age: number; // years old
  weight: number; // lbs
  trainer: string; // trainer name
  jockey: string; // primary jockey
  earnings: number; // career earnings in dollars
  wins: number; // career wins
  personality: string; // 2-3 sentence fun personality description written like a sports announcer
  funFacts: string[]; // 2-3 fun facts about the horse
  strengths: string[]; // 2-3 key strengths
  weaknesses: string[]; // 1-2 weaknesses
}

// ── Featured Race Horses (CNL Stakes, March 14, 2026) ──────────────────────

const incredibolt: HorseProfile = {
  name: "Incredibolt",
  registrationNumber: "KY-2022-04817",
  runningStyle: "Closer",
  topSpeed: 18.6,
  avgSpeed: 16.8,
  strideEfficiency: 2.22,
  avgFinish: 3.2,
  races: 14,
  bestDistance: "9F",
  bestSurface: "Dirt",
  speedCurve: [16.9, 16.7, 16.7, 16.6, 16.7, 16.8, 17.4, 18.1, 18.5, 13.9],
  recentForm: [
    { finish: 1, date: "2026-03-14", track: "CNL" },
    { finish: 3, date: "2026-02-22", track: "GP" },
    { finish: 2, date: "2026-01-18", track: "AQU" },
    { finish: 5, date: "2025-12-28", track: "GP" },
    { finish: 1, date: "2025-12-06", track: "AQU" },
  ],
  color: "#c9a84c",
  imageUrl: "/horses/Incrediboltselfie.png",
  sire: "Into Mischief",
  dam: "Lightning Belle",
  age: 4,
  weight: 1185,
  trainer: "Chad Brown",
  jockey: "Irad Ortiz Jr",
  earnings: 1_245_000,
  wins: 6,
  personality: "Incredibolt is the ultimate closer — the kind of horse that makes you think the race is over, then storms home from nowhere. He's got a gear no one sees coming, and when he hits it in the final furlong, the roar from the crowd tells you everything you need to know.",
  funFacts: [
    "Has won at 4 different tracks across 3 states",
    "Named after his sire's tendency to bolt from the gate",
    "His final-furlong GPS speed of 18.5 ft/s is top-3 in the entire database",
  ],
  strengths: [
    "Devastating late kick — accelerates 1.7 ft/s from the 6th to 9th furlong",
    "Maintains stride length above 7.8ft in the final 2 furlongs",
    "Handles pace scenarios well; faster early fractions actually improve his closing speed",
  ],
  weaknesses: [
    "Can get too far back in short-field races and run out of real estate",
    "GPS data shows a 0.3 ft/s speed drop on wet/sloppy tracks",
  ],
};

const grittiness: HorseProfile = {
  name: "Grittiness",
  registrationNumber: "KY-2022-03291",
  runningStyle: "Closer",
  topSpeed: 18.0,
  avgSpeed: 16.7,
  strideEfficiency: 2.21,
  avgFinish: 4.8,
  races: 11,
  bestDistance: "8.5F",
  bestSurface: "Dirt",
  speedCurve: [16.6, 16.6, 16.8, 16.3, 16.8, 16.8, 17.3, 18.0, 17.7, 13.6],
  recentForm: [
    { finish: 2, date: "2026-03-14", track: "CNL" },
    { finish: 6, date: "2026-02-08", track: "GP" },
    { finish: 4, date: "2026-01-11", track: "GP" },
    { finish: 7, date: "2025-12-21", track: "AQU" },
    { finish: 3, date: "2025-11-29", track: "CD" },
  ],
  color: "#1a3a2a",
  imageUrl: "/horses/gritty.png",
  sire: "Curlin",
  dam: "Iron Maiden Miss",
  age: 4,
  weight: 1210,
  trainer: "Todd Pletcher",
  jockey: "Joel Rosario",
  earnings: 487_500,
  wins: 3,
  personality: "Grittiness is the blue-collar horse of this field — he doesn't have the flashiest numbers, but he shows up every single time and gives you absolutely everything he's got. You'll never see him quit. The name says it all, folks.",
  funFacts: [
    "Has hit the board in 7 of his 11 starts despite inconsistent trip luck",
    "His stride frequency increases by 8% in the stretch — pure determination",
    "Was purchased for just $35,000 as a yearling",
  ],
  strengths: [
    "Extremely consistent stride frequency of 2.21 across all race conditions",
    "GPS acceleration data shows strong 1.2 ft/s pickup from 7th to 8th furlong",
    "Runs his best races when stalking a fast pace — loves chaos in front of him",
  ],
  weaknesses: [
    "Top speed ceiling of 18.0 ft/s limits him against the very best closers",
    "Speed figures flatten out beyond 9 furlongs — stamina is a question mark at classic distance",
  ],
};

const confessional: HorseProfile = {
  name: "Confessional",
  registrationNumber: "KY-2022-05103",
  runningStyle: "Stalker",
  topSpeed: 18.5,
  avgSpeed: 16.8,
  strideEfficiency: 2.19,
  avgFinish: 3.6,
  races: 16,
  bestDistance: "9F",
  bestSurface: "Both",
  speedCurve: [16.4, 16.5, 16.6, 16.4, 16.6, 16.8, 17.3, 17.9, 18.4, 14.2],
  recentForm: [
    { finish: 3, date: "2026-03-14", track: "CNL" },
    { finish: 1, date: "2026-02-15", track: "GP" },
    { finish: 2, date: "2026-01-04", track: "SA" },
    { finish: 4, date: "2025-12-14", track: "GP" },
    { finish: 1, date: "2025-11-22", track: "CD" },
  ],
  color: "#5b3e8a",
  imageUrl: "/horses/Confessional.png",
  sire: "Gun Runner",
  dam: "Sacred Whisper",
  age: 4,
  weight: 1170,
  trainer: "Brad Cox",
  jockey: "Flavien Prat",
  earnings: 1_680_000,
  wins: 7,
  personality: "Confessional is the tactician of the group — a horse that reads the race like a chess grandmaster. He sits just off the pace, waits for the perfect moment, and pounces. His jockeys rave about his intelligence; this horse knows where every rival is at all times.",
  funFacts: [
    "Won on both dirt and turf at Gulfstream Park in back-to-back starts",
    "His GPS tracking shows he runs the straightaways 0.4 ft/s faster than the turns — a geometry specialist",
    "Sired by Kentucky Derby and Breeders' Cup Classic winner Gun Runner",
  ],
  strengths: [
    "Versatile surface ability — GPS speed differential between dirt and turf is only 0.2 ft/s",
    "Exceptional tactical speed; can sit 2nd, 3rd, or 4th and still fire his best late kick",
    "Stride efficiency of 2.19 means maximum ground covered per stride cycle",
  ],
  weaknesses: [
    "Can be slightly flat-footed in the first quarter-mile, losing early position",
    "GPS data reveals a 0.5 ft/s deceleration pattern when racing without cover on the backstretch",
  ],
};

const buetane: HorseProfile = {
  name: "Buetane",
  registrationNumber: "KY-2021-07445",
  runningStyle: "Closer",
  topSpeed: 18.6,
  avgSpeed: 16.7,
  strideEfficiency: 2.24,
  avgFinish: 2.9,
  races: 19,
  bestDistance: "8.5F",
  bestSurface: "Dirt",
  speedCurve: [16.0, 16.3, 16.4, 16.7, 16.5, 16.6, 17.1, 17.9, 18.6, 13.3],
  recentForm: [
    { finish: 4, date: "2026-03-14", track: "CNL" },
    { finish: 1, date: "2026-02-01", track: "GP" },
    { finish: 1, date: "2026-01-11", track: "GP" },
    { finish: 2, date: "2025-12-20", track: "AQU" },
    { finish: 3, date: "2025-11-29", track: "CD" },
  ],
  color: "#c41e3a",
  imageUrl: "https://images.unsplash.com/photo-1636909032868-e385ef406f73?w=400&h=400&fit=crop&auto=format",
  sire: "Quality Road",
  dam: "Explosive Charm",
  age: 5,
  weight: 1195,
  trainer: "Steve Asmussen",
  jockey: "Luis Saez",
  earnings: 2_130_000,
  wins: 9,
  personality: "Buetane is a stone-cold professional. Nineteen starts, nine wins, and an average finish of 2.9 — you simply cannot keep this horse out of the money. He's the kind of runner that handicappers love and bettors trust. Steady as they come, but don't mistake consistency for a lack of explosiveness — his 18.6 top speed says otherwise.",
  funFacts: [
    "Has the longest stride length in the GPS database at 8.3 feet",
    "Won back-to-back races at Gulfstream in January and February 2026",
    "His 19-race sample size makes him one of the most GPS-profiled horses in the dataset",
  ],
  strengths: [
    "Elite top-end speed of 18.6 ft/s combined with a massive 8.3ft stride length",
    "GPS data shows he covers the final 2 furlongs faster than any other horse in the database",
    "Remarkably consistent — standard deviation of only 0.8 positions across 19 starts",
  ],
  weaknesses: [
    "Early speed figures of 16.0-16.3 ft/s in the first 2 furlongs can leave him too far back in wire-to-wire races",
    "Has not won beyond 9 furlongs — untested at true route distances",
  ],
};

const lockstocknpharoah: HorseProfile = {
  name: "Lockstocknpharoah",
  registrationNumber: "KY-2022-02688",
  runningStyle: "Front Runner",
  topSpeed: 18.4,
  avgSpeed: 16.7,
  strideEfficiency: 2.25,
  avgFinish: 3.4,
  races: 12,
  bestDistance: "8F",
  bestSurface: "Dirt",
  speedCurve: [15.1, 16.4, 16.7, 16.7, 16.7, 16.8, 17.4, 17.8, 18.4, 14.6],
  recentForm: [
    { finish: 5, date: "2026-03-14", track: "CNL" },
    { finish: 1, date: "2026-02-22", track: "GP" },
    { finish: 2, date: "2026-01-25", track: "AQU" },
    { finish: 1, date: "2025-12-27", track: "GP" },
    { finish: 4, date: "2025-12-06", track: "AQU" },
  ],
  color: "#3a7cc9",
  imageUrl: "/horses/LockStockPharaoh.png",
  sire: "American Pharoah",
  dam: "Lock and Load Lady",
  age: 4,
  weight: 1165,
  trainer: "Bob Baffert",
  jockey: "John Velazquez",
  earnings: 892_000,
  wins: 5,
  personality: "Lockstocknpharoah is a front-running warrior who dares anyone to come get him. When he gets loose on the lead, good luck catching him. He's got that Triple Crown sire bloodline swagger — ears pricked, head high, running like he owns the place. The problem? When they do catch him, it can get ugly late.",
  funFacts: [
    "Named as a play on his sire American Pharoah and the movie 'Lock, Stock and Two Smoking Barrels'",
    "Broke his maiden on debut at Churchill Downs by 6 lengths",
    "His GPS breakaway speed from the gate (15.1 ft/s first furlong) is actually the slowest of any front runner in the database — he builds into his lead rather than sprinting for it",
  ],
  strengths: [
    "Unusual front-runner profile — accelerates throughout the race, peaking at 18.4 ft/s in the 9th furlong",
    "GPS stride data shows incredibly even pacing through the middle furlongs (16.7 ft/s for three consecutive furlongs)",
    "Excels on fast, dry dirt surfaces — speed figures jump 1.2 ft/s on 'fast' rated tracks vs. 'good'",
  ],
  weaknesses: [
    "Vulnerable when pressured early; GPS data shows a 1.1 ft/s late-speed drop when contested on the lead",
    "Has never won going two turns on turf",
  ],
};

const ocelli: HorseProfile = {
  name: "Ocelli",
  registrationNumber: "KY-2022-06312",
  runningStyle: "Stalker",
  topSpeed: 17.9,
  avgSpeed: 16.5,
  strideEfficiency: 2.23,
  avgFinish: 4.5,
  races: 9,
  bestDistance: "9F",
  bestSurface: "Dirt",
  speedCurve: [16.2, 16.3, 16.5, 16.5, 16.5, 16.5, 17.0, 17.4, 17.8, 13.8],
  recentForm: [
    { finish: 6, date: "2026-03-14", track: "CNL" },
    { finish: 3, date: "2026-02-15", track: "GP" },
    { finish: 5, date: "2026-01-18", track: "AQU" },
    { finish: 2, date: "2025-12-28", track: "GP" },
    { finish: 4, date: "2025-12-06", track: "AQU" },
  ],
  color: "#d4763a",
  imageUrl: "/horses/Ocelli.png",
  sire: "Tapit",
  dam: "Spotted Vision",
  age: 4,
  weight: 1155,
  trainer: "Chad Brown",
  jockey: "Jose Ortiz",
  earnings: 341_200,
  wins: 2,
  personality: "Ocelli is the dark horse that everyone keeps sleeping on. She's still figuring it out — only 9 starts under her belt — but the raw GPS numbers suggest there's a monster lurking. Watch for her in the spring; Chad Brown horses tend to wake up when the flowers bloom.",
  funFacts: [
    "Named after the simple eyes found on insect heads — fitting for a horse with exceptional vision of the track",
    "Only filly in the featured CNL stakes field",
    "Has improved her Beyer Speed Figure in 6 consecutive races",
  ],
  strengths: [
    "Remarkably smooth stride pattern — GPS shows only 0.3 ft/s variance across furlongs 2-6, the steadiest in the field",
    "Late acceleration from 16.5 to 17.8 ft/s shows developing closing ability",
    "Young horse still on the improve — each race GPS profile is faster than the last",
  ],
  weaknesses: [
    "Top speed of 17.9 ft/s is below the field average, limiting her ceiling against top-class closers",
    "Small sample size of 9 races makes her GPS profile less reliable for modeling",
  ],
};

const clockerSpecial: HorseProfile = {
  name: "Clocker Special",
  registrationNumber: "KY-2022-01947",
  runningStyle: "Front Runner",
  topSpeed: 17.0,
  avgSpeed: 16.4,
  strideEfficiency: 2.26,
  avgFinish: 5.1,
  races: 13,
  bestDistance: "7F",
  bestSurface: "Dirt",
  speedCurve: [16.8, 17.0, 16.8, 16.4, 16.3, 16.3, 16.6, 16.9, 17.0, 13.1],
  recentForm: [
    { finish: 7, date: "2026-03-14", track: "CNL" },
    { finish: 3, date: "2026-02-08", track: "GP" },
    { finish: 2, date: "2026-01-04", track: "SA" },
    { finish: 5, date: "2025-12-21", track: "AQU" },
    { finish: 1, date: "2025-11-15", track: "CD" },
  ],
  color: "#2aa198",
  imageUrl: "https://images.pexels.com/photos/7340798/pexels-photo-7340798.jpeg?auto=compress&cs=tinysrgb&w=400",
  sire: "Nyquist",
  dam: "Morning Workout",
  age: 4,
  weight: 1140,
  trainer: "Steve Asmussen",
  jockey: "Tyler Gaffalione",
  earnings: 268_000,
  wins: 3,
  personality: "Clocker Special is the horse that looks like a world-beater in the mornings and a head-scratcher in the afternoons. The clockers at the track swear he's the fastest thing they've ever timed in workouts, but when the gates open on race day, he sometimes forgets to bring that same fire. He's the ultimate 'what if' horse.",
  funFacts: [
    "Named because he consistently posts bullet workouts that make clockers' jaws drop",
    "Has the highest stride efficiency (2.26) of any front runner in the CNL stakes field",
    "His dam, Morning Workout, was also famous for training brilliantly but underperforming on race day",
  ],
  strengths: [
    "GPS stride efficiency of 2.26 is elite — gets maximum output from minimum effort",
    "Consistent early speed of 16.8-17.0 ft/s makes him a reliable pace presence",
    "Best suited at 7 furlongs where his speed curve perfectly matches the distance",
  ],
  weaknesses: [
    "Pronounced deceleration pattern — drops from 17.0 to 16.3 ft/s through the middle furlongs",
    "Speed figures drop 1.4 ft/s when stretched beyond 8 furlongs, exposing stamina limitations",
  ],
};

const work: HorseProfile = {
  name: "Work",
  registrationNumber: "KY-2022-08534",
  runningStyle: "Stalker",
  topSpeed: 17.1,
  avgSpeed: 16.3,
  strideEfficiency: 2.24,
  avgFinish: 5.6,
  races: 8,
  bestDistance: "8F",
  bestSurface: "Dirt",
  speedCurve: [15.8, 16.1, 16.4, 16.2, 16.3, 16.4, 16.7, 16.9, 17.1, 13.2],
  recentForm: [
    { finish: 8, date: "2026-03-14", track: "CNL" },
    { finish: 4, date: "2026-02-01", track: "GP" },
    { finish: 6, date: "2026-01-11", track: "GP" },
    { finish: 3, date: "2025-12-14", track: "GP" },
    { finish: 5, date: "2025-11-22", track: "CD" },
  ],
  color: "#b55dba",
  imageUrl: "https://images.pexels.com/photos/20175279/pexels-photo-20175279.jpeg?auto=compress&cs=tinysrgb&w=400",
  sire: "Hard Spun",
  dam: "Overtime Pay",
  age: 4,
  weight: 1200,
  trainer: "Bill Mott",
  jockey: "Junior Alvarado",
  earnings: 156_800,
  wins: 1,
  personality: "Work is the lunch-pail horse. No flash, no sizzle, just a grinder who punches the clock every day. He's the kind of horse that connections believe in more than the public does — and honestly? The GPS data says they might not be crazy. His numbers are quietly improving every time out.",
  funFacts: [
    "His one-word name is the shortest in the entire GPS database",
    "Has finished in the exact same position (4th) in morning workouts 11 times in a row — the ultimate metronome",
    "Trainer Bill Mott calls him 'the most honest horse in the barn'",
  ],
  strengths: [
    "GPS speed curve shows steady, linear acceleration — no wasted energy throughout the race",
    "Stride efficiency of 2.24 means he's mechanically sound and unlikely to break down",
    "Improving trajectory — each of his last 4 GPS speed profiles shows a 0.15 ft/s overall increase",
  ],
  weaknesses: [
    "Top speed of 17.1 ft/s is the lowest among stalkers in the CNL field — lacks a killer gear",
    "Has only won once in 8 starts, suggesting he may be a perpetual also-ran at the stakes level",
  ],
};

const epicDesire: HorseProfile = {
  name: "Epic Desire",
  registrationNumber: "KY-2021-09871",
  runningStyle: "Closer",
  topSpeed: 16.4,
  avgSpeed: 16.0,
  strideEfficiency: 2.27,
  avgFinish: 6.8,
  races: 7,
  bestDistance: "10F",
  bestSurface: "Turf",
  speedCurve: [15.4, 15.9, 16.1, 16.3, 16.3, 16.2, 16.3, 16.4, 16.1, 12.4],
  recentForm: [
    { finish: 9, date: "2026-03-14", track: "CNL" },
    { finish: 5, date: "2026-02-08", track: "GP" },
    { finish: 7, date: "2026-01-18", track: "AQU" },
    { finish: 4, date: "2025-12-28", track: "GP" },
    { finish: 8, date: "2025-12-06", track: "AQU" },
  ],
  color: "#8b7355",
  imageUrl: "https://images.pexels.com/photos/17815510/pexels-photo-17815510.jpeg?auto=compress&cs=tinysrgb&w=400",
  sire: "English Channel",
  dam: "Desire's Dream",
  age: 5,
  weight: 1175,
  trainer: "Christophe Clement",
  jockey: "Manny Franco",
  earnings: 112_400,
  wins: 1,
  personality: "Epic Desire is the turf romantic stuck in a dirt world. Put him on the green stuff at a mile and a quarter, and he transforms into a completely different animal. On dirt? He's a tourist. This horse is the ultimate argument for surface specificity — you're watching two different horses depending on what's under his hooves.",
  funFacts: [
    "His sire English Channel is a Hall of Fame turf horse, which explains everything",
    "His one career win came on turf at Belmont Park by 4 widening lengths",
    "GPS stride data on turf shows a 0.6 ft/s improvement vs. dirt — the biggest surface gap in the database",
  ],
  strengths: [
    "Exceptional stride efficiency of 2.27 — moves like a machine on grass surfaces",
    "GPS data on turf shows sustained 16.8+ ft/s through the final 3 furlongs vs. 16.1 on dirt",
    "Handles distance well; speed curve stays flat even at 10 furlongs on turf",
  ],
  weaknesses: [
    "Speed figures drop a dramatic 1.2 ft/s on dirt vs. turf — a confirmed surface specialist",
    "Top speed of 16.4 ft/s on dirt is the lowest in the entire 20-horse database",
  ],
};

const highCamp: HorseProfile = {
  name: "High Camp",
  registrationNumber: "KY-2022-00493",
  runningStyle: "Closer",
  topSpeed: 17.2,
  avgSpeed: 16.1,
  strideEfficiency: 2.26,
  avgFinish: 6.2,
  races: 10,
  bestDistance: "9F",
  bestSurface: "Dirt",
  speedCurve: [15.2, 15.8, 16.1, 16.5, 16.3, 16.1, 17.2, 17.0, 16.6, 12.7],
  recentForm: [
    { finish: 10, date: "2026-03-14", track: "CNL" },
    { finish: 3, date: "2026-02-15", track: "GP" },
    { finish: 6, date: "2026-01-25", track: "AQU" },
    { finish: 2, date: "2025-12-20", track: "AQU" },
    { finish: 7, date: "2025-11-29", track: "CD" },
  ],
  color: "#6c8c3c",
  imageUrl: "/horses/HighCamp.png",
  sire: "Medaglia d'Oro",
  dam: "Alpine Retreat",
  age: 4,
  weight: 1220,
  trainer: "Shug McGaughey",
  jockey: "Ricardo Santana Jr",
  earnings: 198_600,
  wins: 2,
  personality: "High Camp is the enigma. One day he fires a huge rally from the clouds that makes you think you're watching a future champion. The next? Dead last. He's the horse that haunts bettors' dreams — always capable of the big one, never reliable enough to trust. That 7th furlong GPS spike of 17.2 ft/s tells you the talent is in there somewhere.",
  funFacts: [
    "Has the widest finishing position range in the database — 2nd to 10th",
    "His GPS speed spike in the 7th furlong (17.2 ft/s) comes a full furlong earlier than other closers",
    "Named after a high-altitude mountain campsite — and his running style is equally unpredictable as mountain weather",
  ],
  strengths: [
    "Unique early-closing move — GPS shows his acceleration starts at the 7th furlong, a full furlong before other closers",
    "At 1,220 lbs, he's the heaviest horse in the database, giving him power advantage on heavy/muddy tracks",
    "Stride efficiency of 2.26 is strong for his size — moves efficiently despite his frame",
  ],
  weaknesses: [
    "Wildly inconsistent GPS profiles — standard deviation of 1.8 ft/s across races, the highest in the field",
    "Tends to fire his closing kick too early and flatten out, as shown by deceleration from 17.2 to 16.6 ft/s in the final 2 furlongs",
  ],
};

// ── Additional GPS-Profiled Horses ─────────────────────────────────────────

const firestormKing: HorseProfile = {
  name: "Firestorm King",
  registrationNumber: "KY-2022-01134",
  runningStyle: "Front Runner",
  topSpeed: 18.9,
  avgSpeed: 16.8,
  strideEfficiency: 2.37,
  avgFinish: 2.8,
  races: 17,
  bestDistance: "6F",
  bestSurface: "Dirt",
  speedCurve: [17.2, 17.8, 18.1, 17.6, 17.0, 16.5, 16.2, 15.8],
  recentForm: [
    { finish: 1, date: "2026-03-15", track: "GP" },
    { finish: 2, date: "2026-02-22", track: "GP" },
    { finish: 1, date: "2026-01-31", track: "AQU" },
    { finish: 4, date: "2026-01-04", track: "AQU" },
    { finish: 1, date: "2025-12-13", track: "GP" },
  ],
  color: "#e74c3c",
  imageUrl: "/horses/FirestormKing.png",
  sire: "Into Mischief",
  dam: "Flame Dancer",
  age: 4,
  weight: 1150,
  trainer: "Bob Baffert",
  jockey: "Irad Ortiz Jr",
  earnings: 1_890_000,
  wins: 10,
  personality: "Firestorm King is pure, unadulterated speed. He comes out of the gate like his tail is on fire and asks the rest of the field a very simple question: can you keep up? Spoiler alert — most of them can't. At 6 furlongs, this horse is borderline unbeatable. The only question is whether he can carry that blinding speed around two turns.",
  funFacts: [
    "His GPS clocking of 18.9 ft/s is the second-fastest top speed in the entire database",
    "Has won 10 of 17 starts — a .588 win rate that puts him among the elite",
    "His sire Into Mischief is the same as Incredibolt, making them half-brothers",
  ],
  strengths: [
    "Devastating early speed — 17.2 ft/s out of the gate is the fastest first-furlong GPS reading in the database",
    "Stride efficiency of 2.37 is the best among front runners, meaning he's not just fast, he's efficient about it",
    "At 6 furlongs, his speed curve never dips below 15.8 ft/s — total domination from wire to wire",
  ],
  weaknesses: [
    "Speed curve shows a dramatic 2.3 ft/s deceleration from peak to final furlong — he empties the tank",
    "Has never won beyond 7 furlongs — one-dimensional sprint specialist",
  ],
};

const silkAndSteel: HorseProfile = {
  name: "Silk and Steel",
  registrationNumber: "KY-2022-04210",
  runningStyle: "Stalker",
  topSpeed: 18.4,
  avgSpeed: 16.9,
  strideEfficiency: 2.31,
  avgFinish: 3.1,
  races: 15,
  bestDistance: "8F",
  bestSurface: "Both",
  speedCurve: [16.2, 16.5, 16.8, 16.9, 17.0, 17.2, 17.6, 18.0, 17.4],
  recentForm: [
    { finish: 2, date: "2026-03-08", track: "SA" },
    { finish: 1, date: "2026-02-14", track: "SA" },
    { finish: 3, date: "2026-01-18", track: "SA" },
    { finish: 1, date: "2025-12-26", track: "SA" },
    { finish: 2, date: "2025-12-07", track: "SA" },
  ],
  color: "#9b59b6",
  imageUrl: "/horses/SilkandSteel.png",
  sire: "Quality Road",
  dam: "Velvet Saber",
  age: 4,
  weight: 1180,
  trainer: "John Sadler",
  jockey: "Flavien Prat",
  earnings: 1_420_000,
  wins: 7,
  personality: "Silk and Steel is the California dreamer — smooth as silk through the first six furlongs, then tough as steel when it's time to throw down in the stretch. He's the horse that West Coast racing fans point to when someone says 'there are no good horses out here.' Santa Anita is his kingdom, and he rules it with class.",
  funFacts: [
    "Has raced exclusively at Santa Anita — 15 starts, all at the same track",
    "His GPS speed curve is the smoothest of any stalker — a textbook acceleration arc",
    "Named by his owner's daughter who said he was 'soft and strong at the same time'",
  ],
  strengths: [
    "Perfectly calibrated acceleration — GPS shows a smooth, linear 0.2-0.4 ft/s increase per furlong from start to peak",
    "Surface versatility — GPS readings on dirt (16.9 avg) vs. turf (16.8 avg) are nearly identical",
    "Consistent finishing — has hit the top 3 in 11 of 15 starts",
  ],
  weaknesses: [
    "Has never raced outside Santa Anita — shipping to an unfamiliar track is a major unknown",
    "Late-race deceleration from 18.0 to 17.4 ft/s suggests he may not sustain his kick beyond one mile",
  ],
};

const copperBullet: HorseProfile = {
  name: "Copper Bullet",
  registrationNumber: "KY-2021-06789",
  runningStyle: "Front Runner",
  topSpeed: 19.1,
  avgSpeed: 17.1,
  strideEfficiency: 2.41,
  avgFinish: 3.5,
  races: 22,
  bestDistance: "6F",
  bestSurface: "Dirt",
  speedCurve: [17.5, 18.2, 18.6, 18.0, 17.3, 16.8, 16.3, 15.6],
  recentForm: [
    { finish: 1, date: "2026-03-22", track: "GP" },
    { finish: 5, date: "2026-02-28", track: "GP" },
    { finish: 1, date: "2026-02-01", track: "AQU" },
    { finish: 2, date: "2026-01-11", track: "AQU" },
    { finish: 3, date: "2025-12-20", track: "GP" },
  ],
  color: "#d35400",
  imageUrl: "/horses/CopperBullethorse.png",
  sire: "Speightstown",
  dam: "Penny Ante",
  age: 5,
  weight: 1160,
  trainer: "Todd Pletcher",
  jockey: "Luis Saez",
  earnings: 2_670_000,
  wins: 11,
  personality: "Copper Bullet owns the title of fastest horse in the database — 19.1 ft/s, a GPS reading that made the data team double-check their equipment. He is a sprinting missile. At 6 furlongs, the only horse who can stay with him is Firestorm King, and their eventual showdown is the race everyone in the game wants to see.",
  funFacts: [
    "Holds the GPS database record for top speed at 19.1 ft/s",
    "His 22-race career is the most experienced in the database",
    "Named after his copper-colored coat and his sire Speightstown's bullet-like speed",
  ],
  strengths: [
    "Fastest recorded top speed in the entire GPS database at 19.1 ft/s — no one else is close",
    "Stride efficiency of 2.41 is the highest of any horse profiled, meaning peak biomechanical output",
    "22 races of GPS data make his profile the most statistically reliable in the database",
  ],
  weaknesses: [
    "Dramatic 3.0 ft/s speed drop from peak (18.6) to final furlong (15.6) — the steepest fade in the database",
    "Average finish of 3.5 despite elite speed suggests he gets caught when he can't wire the field",
  ],
};

const dawnPatrol: HorseProfile = {
  name: "Dawn Patrol",
  registrationNumber: "KY-2022-07821",
  runningStyle: "Closer",
  topSpeed: 18.7,
  avgSpeed: 16.6,
  strideEfficiency: 2.18,
  avgFinish: 3.9,
  races: 11,
  bestDistance: "10F",
  bestSurface: "Turf",
  speedCurve: [15.4, 15.8, 16.0, 16.2, 16.4, 16.8, 17.4, 18.0, 18.5, 14.0],
  recentForm: [
    { finish: 1, date: "2026-03-15", track: "GP" },
    { finish: 4, date: "2026-02-15", track: "GP" },
    { finish: 2, date: "2026-01-25", track: "GP" },
    { finish: 1, date: "2025-12-28", track: "GP" },
    { finish: 6, date: "2025-12-06", track: "CD" },
  ],
  color: "#2980b9",
  imageUrl: "/horses/DawnPatrol.png",
  sire: "War Front",
  dam: "First Light",
  age: 4,
  weight: 1145,
  trainer: "Chad Brown",
  jockey: "Joel Rosario",
  earnings: 985_000,
  wins: 5,
  personality: "Dawn Patrol is a turf monster who runs his best when the sun is coming up and the dew is still on the grass. Okay, he runs great in the afternoon too — but there's something poetic about this horse. He glides over the turf like he's floating, and when he uncorks that closing kick, it's the most beautiful 3 furlongs of acceleration you'll ever see on GPS.",
  funFacts: [
    "His GPS acceleration from furlong 6 to furlong 9 (16.8 to 18.5 ft/s) is a 1.7 ft/s gain — the best sustained close in the database",
    "Sired by War Front, one of the greatest turf sires in racing history",
    "Trained by Chad Brown, the undisputed king of American turf racing",
  ],
  strengths: [
    "Elite closing speed — 18.5 ft/s in the 9th furlong is matched only by Incredibolt in the database",
    "GPS data shows he maintains stride length of 7.9ft even at the end of 10-furlong races — no fatigue",
    "Turf specialist with a 4-for-7 record on grass and a 16.9 ft/s average on that surface",
  ],
  weaknesses: [
    "Dirt speed figures are 1.0 ft/s below his turf numbers — surface dependent",
    "Stride efficiency of 2.18 is the lowest in the database, meaning he needs a longer stride to generate his speed",
  ],
};

const lastTycoon: HorseProfile = {
  name: "Last Tycoon",
  registrationNumber: "KY-2021-05567",
  runningStyle: "Front Runner",
  topSpeed: 18.3,
  avgSpeed: 16.7,
  strideEfficiency: 2.35,
  avgFinish: 4.1,
  races: 20,
  bestDistance: "7F",
  bestSurface: "Dirt",
  speedCurve: [17.0, 17.4, 17.8, 17.3, 16.9, 16.5, 16.2, 15.9, 15.4],
  recentForm: [
    { finish: 3, date: "2026-03-08", track: "AQU" },
    { finish: 1, date: "2026-02-14", track: "AQU" },
    { finish: 6, date: "2026-01-25", track: "AQU" },
    { finish: 2, date: "2025-12-27", track: "AQU" },
    { finish: 4, date: "2025-12-06", track: "AQU" },
  ],
  color: "#f39c12",
  imageUrl: "/horses/LastTycoon.png",
  sire: "Uncle Mo",
  dam: "Corporate Raider",
  age: 5,
  weight: 1190,
  trainer: "Linda Rice",
  jockey: "Dylan Davis",
  earnings: 1_050_000,
  wins: 7,
  personality: "Last Tycoon is the king of Aqueduct — the big fish in the cold pond. He's raced there so many times that the regulars in the grandstand call him by name. He's a gritty New York warrior who thrives on the inner track, and while he may not have the raw talent to compete at the highest graded level, he absolutely owns his home turf.",
  funFacts: [
    "Has raced at Aqueduct 16 out of 20 starts — a true hometown hero",
    "Named after the legendary European racehorse Last Tycoon who won the 1986 Breeders' Cup Mile",
    "His owner is a Wall Street executive, hence the dam name 'Corporate Raider'",
  ],
  strengths: [
    "GPS data at Aqueduct shows 0.5 ft/s faster average speed than at any other track — a huge home-field advantage",
    "Stride efficiency of 2.35 makes him biomechanically suited for Aqueduct's tight turns",
    "Extremely experienced at 20 starts — his GPS profile is one of the most reliable for modeling",
  ],
  weaknesses: [
    "Steep deceleration from 17.8 to 15.4 ft/s over the final 5 furlongs — the classic one-run front runner",
    "GPS speed figures at tracks other than Aqueduct drop by 0.8 ft/s on average — track dependent",
  ],
};

const moonOverMiami: HorseProfile = {
  name: "Moon Over Miami",
  registrationNumber: "FL-2022-01456",
  runningStyle: "Stalker",
  topSpeed: 18.2,
  avgSpeed: 16.8,
  strideEfficiency: 2.29,
  avgFinish: 3.3,
  races: 13,
  bestDistance: "8.5F",
  bestSurface: "Dirt",
  speedCurve: [16.0, 16.4, 16.7, 16.8, 16.9, 17.0, 17.4, 17.8, 17.2],
  recentForm: [
    { finish: 2, date: "2026-03-22", track: "GP" },
    { finish: 1, date: "2026-03-01", track: "GP" },
    { finish: 3, date: "2026-02-08", track: "GP" },
    { finish: 2, date: "2026-01-18", track: "GP" },
    { finish: 5, date: "2025-12-28", track: "GP" },
  ],
  color: "#1abc9c",
  imageUrl: "/horses/moonovermiami.png",
  sire: "Candy Ride",
  dam: "Moonlit Bay",
  age: 4,
  weight: 1175,
  trainer: "Saffie Joseph Jr",
  jockey: "Edgard Zayas",
  earnings: 745_000,
  wins: 5,
  personality: "Moon Over Miami is the Gulfstream Park darling — a Florida-bred who's been tearing up the South Florida circuit like he was born for it. And he was, literally. Saffie Joseph has him dialed in perfectly for the GP surface, and his stalking style is tailor-made for the long homestretch. He's the local kid who made good.",
  funFacts: [
    "Florida-bred — one of only 2 non-Kentucky-breds in the entire GPS database",
    "Has never raced outside the state of Florida",
    "His GPS tracking shows he runs the Gulfstream Park homestretch 0.6 ft/s faster than any other segment — he loves that stretch",
  ],
  strengths: [
    "Peak acceleration from 17.0 to 17.8 ft/s in the 6th-8th furlongs is perfectly timed for Gulfstream's stretch run",
    "Consistent stalking position — GPS positional data shows he runs 2nd-4th at every call in 11 of 13 races",
    "Stride efficiency of 2.29 is above average for stalkers, giving him a mechanical edge in sustained battles",
  ],
  weaknesses: [
    "Late deceleration from 17.8 to 17.2 ft/s suggests he can't sustain his best for the full stretch drive",
    "Untested outside Florida — no GPS data on Northern tracks or against graded-stakes fields",
  ],
};

const steelReserve: HorseProfile = {
  name: "Steel Reserve",
  registrationNumber: "KY-2021-08903",
  runningStyle: "Stalker",
  topSpeed: 18.1,
  avgSpeed: 16.5,
  strideEfficiency: 2.25,
  avgFinish: 4.4,
  races: 18,
  bestDistance: "8F",
  bestSurface: "Both",
  speedCurve: [16.1, 16.3, 16.5, 16.5, 16.6, 16.7, 17.0, 17.5, 17.0],
  recentForm: [
    { finish: 4, date: "2026-03-15", track: "GP" },
    { finish: 2, date: "2026-02-22", track: "GP" },
    { finish: 5, date: "2026-01-31", track: "AQU" },
    { finish: 3, date: "2026-01-11", track: "AQU" },
    { finish: 1, date: "2025-12-20", track: "GP" },
  ],
  color: "#7f8c8d",
  imageUrl: "/horses/SteelReserve.png",
  sire: "Curlin",
  dam: "Iron Fortress",
  age: 5,
  weight: 1215,
  trainer: "Todd Pletcher",
  jockey: "Jose Ortiz",
  earnings: 1_180_000,
  wins: 6,
  personality: "Steel Reserve is the anvil. He doesn't break. He doesn't bend. He just grinds and grinds and grinds until the flashy horses in front of him start to tire, and then he picks them off one by one. He's never going to blow you away with a highlight-reel move, but he's the horse you want in a war of attrition.",
  funFacts: [
    "Has raced on 6 different surfaces (fast dirt, good dirt, sloppy dirt, firm turf, good turf, yielding turf) and won on all of them",
    "His Curlin bloodline shows in his build — 1,215 lbs of solid muscle",
    "Has the most consistent GPS stride frequency in the database — 0.1 variation across entire races",
  ],
  strengths: [
    "Surface versatility is unmatched — GPS speed differential between dirt and turf is only 0.15 ft/s",
    "18-race GPS sample provides the second-most reliable profile in the database behind Copper Bullet",
    "At 1,215 lbs, handles any track condition — GPS speed actually improves by 0.3 ft/s on sloppy tracks",
  ],
  weaknesses: [
    "Late-race deceleration from 17.5 to 17.0 ft/s means he can't sustain his best when it matters most",
    "Average finish of 4.4 suggests he's a solid horse but not a true Grade 1 contender",
  ],
};

const blazingGlory: HorseProfile = {
  name: "Blazing Glory",
  registrationNumber: "CA-2022-02178",
  runningStyle: "Front Runner",
  topSpeed: 18.8,
  avgSpeed: 16.9,
  strideEfficiency: 2.38,
  avgFinish: 3.7,
  races: 14,
  bestDistance: "6.5F",
  bestSurface: "Dirt",
  speedCurve: [17.3, 17.9, 18.3, 17.7, 17.1, 16.6, 16.1, 15.5],
  recentForm: [
    { finish: 1, date: "2026-03-08", track: "SA" },
    { finish: 3, date: "2026-02-14", track: "SA" },
    { finish: 1, date: "2026-01-25", track: "SA" },
    { finish: 6, date: "2026-01-04", track: "SA" },
    { finish: 2, date: "2025-12-14", track: "SA" },
  ],
  color: "#e67e22",
  imageUrl: "/horses/BlazingGlory.png",
  sire: "Goldencents",
  dam: "Blaze of Light",
  age: 4,
  weight: 1135,
  trainer: "Doug O'Neill",
  jockey: "Mike Smith",
  earnings: 1_320_000,
  wins: 7,
  personality: "Blazing Glory is the California speedball with a flair for the dramatic. He doesn't just win — he wins with style. Hall of Fame jockey Mike Smith says he's the most naturally fast horse he's sat on in years, and when that golden coat catches the Santa Anita sunshine as he pulls away from the field? It's a postcard moment, folks.",
  funFacts: [
    "At 1,135 lbs, he's the lightest horse in the GPS database — all speed, no excess",
    "His California-bred registration (CA-2022) makes him eligible for lucrative Cal-bred bonuses",
    "Mike Smith, who rode Justify to the Triple Crown, compares his early speed to Justify's",
  ],
  strengths: [
    "Peak speed of 18.3 ft/s by the 3rd furlong is the fastest early-race GPS reading among all 20 horses",
    "Stride efficiency of 2.38 is elite — the lightest horse in the database is also one of the most mechanically efficient",
    "At 6.5 furlongs, his GPS profile shows zero deceleration through the wire — a perfect distance match",
  ],
  weaknesses: [
    "2.8 ft/s speed drop from peak to final furlong is the second-steepest fade behind Copper Bullet",
    "Has never raced outside of California — untested against East Coast competition",
  ],
};

const quietStorm: HorseProfile = {
  name: "Quiet Storm",
  registrationNumber: "KY-2022-09045",
  runningStyle: "Closer",
  topSpeed: 18.8,
  avgSpeed: 16.7,
  strideEfficiency: 2.20,
  avgFinish: 3.4,
  races: 10,
  bestDistance: "9F",
  bestSurface: "Dirt",
  speedCurve: [15.6, 15.9, 16.2, 16.4, 16.6, 16.9, 17.5, 18.2, 18.6, 14.1],
  recentForm: [
    { finish: 1, date: "2026-03-15", track: "AQU" },
    { finish: 3, date: "2026-02-22", track: "AQU" },
    { finish: 2, date: "2026-01-31", track: "AQU" },
    { finish: 1, date: "2026-01-11", track: "GP" },
    { finish: 4, date: "2025-12-20", track: "GP" },
  ],
  color: "#34495e",
  imageUrl: "https://images.unsplash.com/photo-1636909032868-e385ef406f73?w=400&h=400&fit=crop&auto=format",
  sire: "Gun Runner",
  dam: "Silent Thunder",
  age: 4,
  weight: 1170,
  trainer: "Bill Mott",
  jockey: "John Velazquez",
  earnings: 1_560_000,
  wins: 6,
  personality: "Quiet Storm is the assassin. He sits dead last for six furlongs, so far back that the camera barely catches him, and then — like a thunderclap out of a clear sky — he explodes. His GPS acceleration from the 6th to 9th furlong is the stuff of legend. Bill Mott calls him 'the quietest loud horse I've ever trained.'",
  funFacts: [
    "Has come from last place to win twice in his 10-race career — both times by a combined 8 lengths",
    "His GPS acceleration of 1.7 ft/s from furlongs 6-9 matches Incredibolt for the best in the database",
    "Sired by Gun Runner, same as Confessional — making them half-brothers with wildly different running styles",
  ],
  strengths: [
    "GPS acceleration from 16.9 to 18.6 ft/s over the final 3 furlongs is tied for the best sustained close in the database",
    "Peak speed of 18.8 ft/s in the 9th furlong is matched only by Firestorm King's early speed and Copper Bullet's raw top end",
    "Young and improving — his last 4 GPS profiles each show incrementally higher peak speeds",
  ],
  weaknesses: [
    "Early speed of 15.6 ft/s in the first furlong is the second-slowest in the database — can get hopelessly far back",
    "One-dimensional running style; GPS data shows he cannot rate or stalk, only close from far behind",
  ],
};

const regalPrince: HorseProfile = {
  name: "Regal Prince",
  registrationNumber: "KY-2021-11234",
  runningStyle: "Stalker",
  topSpeed: 18.3,
  avgSpeed: 16.9,
  strideEfficiency: 2.32,
  avgFinish: 2.6,
  races: 21,
  bestDistance: "8F",
  bestSurface: "Both",
  speedCurve: [16.3, 16.6, 16.8, 16.9, 17.0, 17.1, 17.5, 18.0, 17.6],
  recentForm: [
    { finish: 1, date: "2026-03-22", track: "KEE" },
    { finish: 2, date: "2026-03-01", track: "GP" },
    { finish: 1, date: "2026-02-08", track: "GP" },
    { finish: 1, date: "2026-01-18", track: "GP" },
    { finish: 3, date: "2025-12-28", track: "GP" },
  ],
  color: "#8e44ad",
  imageUrl: "/horses/RegalPrince.png",
  sire: "Tapit",
  dam: "Royal Duchess",
  age: 5,
  weight: 1195,
  trainer: "Chad Brown",
  jockey: "Irad Ortiz Jr",
  earnings: 3_210_000,
  wins: 12,
  personality: "Regal Prince is the best horse in this database, and his numbers prove it. Average finish of 2.6, twelve wins from twenty-one starts, earnings over $3 million — this is the horse everyone else is chasing. He does everything well, nothing badly, and his GPS profile reads like a textbook on how to win races. The prince doesn't need a crown. The results speak for themselves.",
  funFacts: [
    "His $3.21 million in earnings is the highest of any horse in the GPS database",
    "Has won at 5 different tracks — GP, AQU, SA, CD, and KEE — a true all-surface, all-track runner",
    "His average finishing position of 2.6 is the best in the entire 20-horse database",
  ],
  strengths: [
    "Highest average speed in the database at 16.9 ft/s — elite baseline velocity throughout every race",
    "GPS profile shows smooth, controlled acceleration with no wasteful speed spikes — textbook pacing",
    "21-race sample with a 2.6 average finish proves this is not a fluke — statistically the best horse profiled",
  ],
  weaknesses: [
    "Late-race deceleration from 18.0 to 17.6 ft/s — even the best horse in the database can't fully sustain peak speed",
    "At age 5 with 21 starts, workload is a concern — GPS stride frequency has dipped 2% in last 3 races",
  ],
};

// ── Exports ────────────────────────────────────────────────────────────────

import { ALL_RACES } from "./race-data";
import { deriveAllMissingProfiles } from "./derive-profiles";

export const FEATURED_RACE_PROFILES: HorseProfile[] = [
  incredibolt,
  grittiness,
  confessional,
  buetane,
  lockstocknpharoah,
  ocelli,
  clockerSpecial,
  work,
  epicDesire,
  highCamp,
];

export const ADDITIONAL_PROFILES: HorseProfile[] = [
  firestormKing,
  silkAndSteel,
  copperBullet,
  dawnPatrol,
  lastTycoon,
  moonOverMiami,
  steelReserve,
  blazingGlory,
  quietStorm,
  regalPrince,
];

/** Handcrafted profiles (featured + additional) */
export const HANDCRAFTED_PROFILES: HorseProfile[] = [
  ...FEATURED_RACE_PROFILES,
  ...ADDITIONAL_PROFILES,
];

/** Auto-derived profiles for XRay horses that don't have handcrafted profiles */
const _existingNames = new Set(HANDCRAFTED_PROFILES.map((p) => p.name.toLowerCase()));
export const GPS_DERIVED_PROFILES: HorseProfile[] = deriveAllMissingProfiles(ALL_RACES, _existingNames);

/** All profiles: handcrafted + GPS-derived (every XRay horse is included) */
export const ALL_PROFILES: HorseProfile[] = [
  ...HANDCRAFTED_PROFILES,
  ...GPS_DERIVED_PROFILES,
];

/** Look up a profile by horse name (case-insensitive) */
export function getProfile(name: string): HorseProfile | undefined {
  return ALL_PROFILES.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}
