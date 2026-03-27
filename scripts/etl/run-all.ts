/**
 * run-all.ts — Orchestrate the full ETL pipeline
 *
 * Runs all 6 steps in sequence:
 *   01-ingest → 02-speed-figures → 03-train-model → 04-transfer-model → 05-predict-upcoming → 06-value-odds
 *
 * Run: npm run etl
 */

import { execSync } from "child_process";
import * as path from "path";

const SCRIPTS_DIR = path.resolve(__dirname);

const steps = [
  { file: "01-ingest.ts", name: "Ingest Excel Data", heap: 4096 },
  { file: "02-speed-figures.ts", name: "Compute Speed Figures", heap: 512 },
  { file: "03-train-model.ts", name: "Train Prediction Model", heap: 512 },
  { file: "04-transfer-model.ts", name: "Train Transfer Model", heap: 512 },
  { file: "05-predict-upcoming.ts", name: "Score Upcoming Races", heap: 512 },
  { file: "06-value-odds.ts", name: "Compute Value Odds", heap: 256 },
];

const startTime = Date.now();

console.log("╔══════════════════════════════════════════════════╗");
console.log("║  EconGames Quantitative Pipeline — Full Run      ║");
console.log("╚══════════════════════════════════════════════════╝\n");

for (let i = 0; i < steps.length; i++) {
  const step = steps[i];
  const stepStart = Date.now();
  console.log(`\n${"═".repeat(50)}`);
  console.log(`Step ${i + 1}/${steps.length}: ${step.name}`);
  console.log(`${"═".repeat(50)}\n`);

  try {
    execSync(
      `npx tsx --max-old-space-size=${step.heap} ${path.join(SCRIPTS_DIR, step.file)}`,
      {
        stdio: "inherit",
        cwd: path.resolve(SCRIPTS_DIR, "../.."),
        env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${step.heap}` },
      }
    );
    const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1);
    console.log(`  ✓ ${step.name} completed in ${elapsed}s`);
  } catch (err) {
    console.error(`\n  ✗ ${step.name} FAILED`);
    console.error(err);
    process.exit(1);
  }
}

const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n${"═".repeat(50)}`);
console.log(`✓ Full pipeline completed in ${totalElapsed}s`);
console.log(`${"═".repeat(50)}\n`);
