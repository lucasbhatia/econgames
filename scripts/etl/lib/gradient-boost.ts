/**
 * Pure-TypeScript gradient boosted decision stumps (depth-1 trees).
 * Simple, interpretable, and effective for small-medium datasets.
 */

import type { Vector, Matrix } from "./regression";

export interface Stump {
  featureIndex: number;
  threshold: number;
  leftValue: number;   // prediction if feature <= threshold
  rightValue: number;  // prediction if feature > threshold
  gain: number;        // reduction in MSE from this split
}

export interface GBMConfig {
  numRounds: number;       // number of boosting rounds (default 80)
  learningRate: number;    // shrinkage factor (default 0.1)
  minSamplesLeaf: number;  // minimum samples per leaf (default 5)
}

const DEFAULT_CONFIG: GBMConfig = {
  numRounds: 80,
  learningRate: 0.1,
  minSamplesLeaf: 5,
};

/** Find the best single-feature split (decision stump) for the current residuals */
function findBestStump(X: Matrix, residuals: Vector, minLeaf: number): Stump | null {
  const n = X.length;
  const p = X[0].length;
  let bestStump: Stump | null = null;
  let bestGain = -Infinity;

  for (let j = 0; j < p; j++) {
    // Get unique sorted values for this feature
    const values = X.map((row) => row[j]);
    const sorted = [...new Set(values)].sort((a, b) => a - b);
    if (sorted.length < 2) continue;

    // Try midpoints between consecutive unique values
    for (let k = 0; k < sorted.length - 1; k++) {
      const threshold = (sorted[k] + sorted[k + 1]) / 2;

      // Split residuals
      let leftSum = 0, leftCount = 0;
      let rightSum = 0, rightCount = 0;
      for (let i = 0; i < n; i++) {
        if (X[i][j] <= threshold) {
          leftSum += residuals[i];
          leftCount++;
        } else {
          rightSum += residuals[i];
          rightCount++;
        }
      }

      if (leftCount < minLeaf || rightCount < minLeaf) continue;

      const leftMean = leftSum / leftCount;
      const rightMean = rightSum / rightCount;

      // Compute gain: reduction in MSE
      let mseBeforeSplit = 0;
      const totalMean = (leftSum + rightSum) / n;
      for (let i = 0; i < n; i++) {
        mseBeforeSplit += (residuals[i] - totalMean) ** 2;
      }

      let mseAfterSplit = 0;
      for (let i = 0; i < n; i++) {
        const pred = X[i][j] <= threshold ? leftMean : rightMean;
        mseAfterSplit += (residuals[i] - pred) ** 2;
      }

      const gain = mseBeforeSplit - mseAfterSplit;
      if (gain > bestGain) {
        bestGain = gain;
        bestStump = {
          featureIndex: j,
          threshold,
          leftValue: leftMean,
          rightValue: rightMean,
          gain,
        };
      }
    }
  }

  return bestStump;
}

/** Predict using a single stump */
function predictStump(X: Matrix, stump: Stump): Vector {
  return X.map((row) =>
    row[stump.featureIndex] <= stump.threshold ? stump.leftValue : stump.rightValue
  );
}

/** Train a gradient boosted model */
export function trainGBM(
  X: Matrix,
  y: Vector,
  config: Partial<GBMConfig> = {}
): { stumps: Stump[]; initialPrediction: number; learningRate: number } {
  const { numRounds, learningRate, minSamplesLeaf } = { ...DEFAULT_CONFIG, ...config };
  const n = X.length;

  // Initial prediction: mean of y
  const initialPrediction = y.reduce((s, v) => s + v, 0) / n;

  // Current predictions
  const predictions = new Array(n).fill(initialPrediction);
  const stumps: Stump[] = [];

  for (let round = 0; round < numRounds; round++) {
    // Compute residuals
    const residuals = y.map((yi, i) => yi - predictions[i]);

    // Fit a stump to the residuals
    const stump = findBestStump(X, residuals, minSamplesLeaf);
    if (!stump || stump.gain < 1e-10) break;

    // Update predictions with learning rate
    const stumpPreds = predictStump(X, stump);
    for (let i = 0; i < n; i++) {
      predictions[i] += learningRate * stumpPreds[i];
    }

    stumps.push(stump);
  }

  return { stumps, initialPrediction, learningRate };
}

/** Predict using a trained GBM model */
export function predictGBM(
  X: Matrix,
  model: { stumps: Stump[]; initialPrediction: number; learningRate: number }
): Vector {
  const n = X.length;
  const predictions = new Array(n).fill(model.initialPrediction);

  for (const stump of model.stumps) {
    const stumpPreds = predictStump(X, stump);
    for (let i = 0; i < n; i++) {
      predictions[i] += model.learningRate * stumpPreds[i];
    }
  }

  return predictions;
}

/** Compute feature importance from GBM (sum of gains per feature) */
export function gbmFeatureImportance(stumps: Stump[], featureNames: string[]): Record<string, number> {
  const importance: Record<string, number> = {};
  for (const name of featureNames) importance[name] = 0;

  const totalGain = stumps.reduce((s, st) => s + st.gain, 0) || 1;
  for (const stump of stumps) {
    const name = featureNames[stump.featureIndex] ?? `feature_${stump.featureIndex}`;
    importance[name] += stump.gain / totalGain;
  }

  // Normalize to sum to 1
  const sum = Object.values(importance).reduce((s, v) => s + v, 0) || 1;
  for (const name of Object.keys(importance)) {
    importance[name] = Math.round((importance[name] / sum) * 1000) / 1000;
  }

  return importance;
}
