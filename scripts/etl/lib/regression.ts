/**
 * Pure-TypeScript matrix operations and ridge regression.
 * No external dependencies. Works for small feature matrices (< 50 features).
 */

export type Matrix = number[][];
export type Vector = number[];

/** Create an NxN identity matrix */
export function eye(n: number): Matrix {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

/** Transpose a matrix */
export function transpose(A: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0].length;
  const result: Matrix = Array.from({ length: cols }, () => new Array(rows));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

/** Multiply two matrices */
export function matMul(A: Matrix, B: Matrix): Matrix {
  const aRows = A.length;
  const aCols = A[0].length;
  const bCols = B[0].length;
  const result: Matrix = Array.from({ length: aRows }, () => new Array(bCols).fill(0));
  for (let i = 0; i < aRows; i++) {
    for (let k = 0; k < aCols; k++) {
      if (A[i][k] === 0) continue;
      for (let j = 0; j < bCols; j++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

/** Multiply matrix by vector: A * v */
export function matVecMul(A: Matrix, v: Vector): Vector {
  return A.map((row) => row.reduce((s, val, j) => s + val * v[j], 0));
}

/** Invert a square matrix using Gauss-Jordan elimination */
export function invert(A: Matrix): Matrix {
  const n = A.length;
  // Augment with identity
  const aug: Matrix = A.map((row, i) => [
    ...row.map((v) => v),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) {
      // Singular — add small regularization
      aug[col][col] += 1e-8;
    }

    // Scale pivot row
    const scale = 1 / aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] *= scale;

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Extract inverse (right half of augmented matrix)
  return aug.map((row) => row.slice(n));
}

/** Add two matrices */
export function matAdd(A: Matrix, B: Matrix): Matrix {
  return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

/** Scale a matrix by a scalar */
export function matScale(A: Matrix, s: number): Matrix {
  return A.map((row) => row.map((val) => val * s));
}

// ── Standardization ──────────────────────────────────────────────────────

export interface StandardizeResult {
  data: Matrix;
  means: Vector;
  stdevs: Vector;
}

/** Standardize features: z = (x - mean) / stdev */
export function standardize(X: Matrix): StandardizeResult {
  const n = X.length;
  const p = X[0].length;
  const means: Vector = new Array(p).fill(0);
  const stdevs: Vector = new Array(p).fill(0);

  // Compute means
  for (let j = 0; j < p; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += X[i][j];
    means[j] = sum / n;
  }

  // Compute stdevs
  for (let j = 0; j < p; j++) {
    let sumSq = 0;
    for (let i = 0; i < n; i++) sumSq += (X[i][j] - means[j]) ** 2;
    stdevs[j] = Math.sqrt(sumSq / n) || 1; // prevent div by zero
  }

  // Standardize
  const data: Matrix = X.map((row) =>
    row.map((val, j) => (val - means[j]) / stdevs[j])
  );

  return { data, means, stdevs };
}

/** Apply existing standardization to new data */
export function applyStandardize(X: Matrix, means: Vector, stdevs: Vector): Matrix {
  return X.map((row) => row.map((val, j) => (val - means[j]) / stdevs[j]));
}

// ── Ridge Regression ─────────────────────────────────────────────────────

export interface RidgeFitResult {
  weights: Vector;
  bias: number;
}

/**
 * Fit ridge regression: w = (X^T X + λI)^{-1} X^T y
 * X should already be standardized. y is centered internally.
 */
export function ridgeFit(X: Matrix, y: Vector, lambda: number = 0.01): RidgeFitResult {
  const n = X.length;
  const p = X[0].length;

  // Center y
  const yMean = y.reduce((s, v) => s + v, 0) / n;
  const yc = y.map((v) => v - yMean);

  // X^T X + λI
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const reg = matAdd(XtX, matScale(eye(p), lambda));

  // Invert
  const regInv = invert(reg);

  // X^T y
  const Xty: Vector = new Array(p).fill(0);
  for (let j = 0; j < p; j++) {
    for (let i = 0; i < n; i++) {
      Xty[j] += X[i][j] * yc[i];
    }
  }

  // w = (X^T X + λI)^{-1} X^T y
  const weights = matVecMul(regInv, Xty);
  const bias = yMean;

  return { weights, bias };
}

/** Predict using ridge weights on standardized features */
export function ridgePredict(X: Matrix, weights: Vector, bias: number): Vector {
  return X.map((row) => {
    let pred = bias;
    for (let j = 0; j < weights.length; j++) {
      pred += row[j] * weights[j];
    }
    return pred;
  });
}

// ── Metrics ──────────────────────────────────────────────────────────────

/** R-squared */
export function r2Score(actual: Vector, predicted: Vector): number {
  const n = actual.length;
  const mean = actual.reduce((s, v) => s + v, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (actual[i] - predicted[i]) ** 2;
    ssTot += (actual[i] - mean) ** 2;
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

/** Mean absolute error */
export function mae(actual: Vector, predicted: Vector): number {
  const n = actual.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(actual[i] - predicted[i]);
  return sum / n;
}
