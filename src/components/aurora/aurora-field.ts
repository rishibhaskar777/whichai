/**
 * The maths behind the aurora. Pure functions on typed arrays, so the engine
 * only has to turn intensities into pixels.
 *
 * Three families of light (accent blue, sky blue, deep indigo-blue) each make
 * a soft band plus a soft blob. Every family has its own speed and depth, and
 * the calm factor keeps the centre, behind the search, quieter than the edges.
 */

export const FAMILY_COUNT = 3;

export interface Grid {
  width: number;
  height: number;
  /** Position of each column and row across the screen, 0 to 1. */
  columns: Float32Array;
  rows: Float32Array;
  /** 0 behind the search, 1 at the edges. One value per pixel. */
  lively: Float32Array;
}

export interface Offset {
  x: number;
  y: number;
}

interface Family {
  waveX: number;
  waveY: number;
  speed: number;
  phase: number;
  blobX: number;
  blobY: number;
  /** How far the pointer moves this family; the far layers move least. */
  depth: number;
}

const FAMILIES: readonly Family[] = [
  {
    waveX: 6.4,
    waveY: 2.8,
    speed: 1,
    phase: 0,
    blobX: 0.45,
    blobY: 0.38,
    depth: 1,
  },
  {
    waveX: -4.2,
    waveY: 5.2,
    speed: 0.8,
    phase: 2.1,
    blobX: 0.64,
    blobY: 0.54,
    depth: 0.6,
  },
  {
    waveX: 3,
    waveY: -6,
    speed: 0.65,
    phase: 4.2,
    blobX: 0.34,
    blobY: 0.64,
    depth: 0.35,
  },
];

const CENTRE_X = 0.5;
const CENTRE_Y = 0.42;

function smoothstep(from: number, to: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function createGrid(width: number, height: number): Grid {
  const grid: Grid = {
    width,
    height,
    columns: new Float32Array(width),
    rows: new Float32Array(height),
    lively: new Float32Array(width * height),
  };
  for (let column = 0; column < width; column++) {
    grid.columns[column] = (column + 0.5) / width;
  }
  for (let row = 0; row < height; row++) {
    grid.rows[row] = (row + 0.5) / height;
  }
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const x = grid.columns[column] ?? 0;
      const y = grid.rows[row] ?? 0;
      const distance = Math.hypot((x - CENTRE_X) * 1.2, y - CENTRE_Y);
      grid.lively[row * width + column] = smoothstep(0.12, 0.85, distance);
    }
  }
  return grid;
}

export function createIntensities(grid: Grid): Float32Array[] {
  return Array.from(
    { length: FAMILY_COUNT },
    () => new Float32Array(grid.width * grid.height),
  );
}

/** A soft bell, 1 at zero and falling to 0, without a call to exp(). */
function bell(squared: number): number {
  const k = 1 / (1 + squared);
  return k * k;
}

/**
 * Fills `out[family][pixel]` with values from 0 to 1 for the given time in
 * seconds, and for any pixel they add up to at most 1. The centre keeps
 * about a third of the edge movement.
 *
 * The bend of the bands depends only on the row or only on the column, so it
 * is worked out once per row and column, not once per pixel.
 */
export function sampleField(
  grid: Grid,
  seconds: number,
  pointer: Offset,
  out: readonly Float32Array[],
): void {
  const { width, height } = grid;
  const size = width * height;
  const rowBend = new Float32Array(height);
  const columnBend = new Float32Array(width);

  for (let f = 0; f < FAMILY_COUNT; f++) {
    const family = FAMILIES[f];
    const target = out[f];
    if (!family || !target) continue;
    const t = seconds * family.speed;
    const shiftX = pointer.x * family.depth;
    const shiftY = pointer.y * family.depth;
    const breathe = 0.5 + 0.5 * Math.sin(t * 0.16 + family.phase * 0.7);
    const wanderX = Math.sin(t * 0.07 + family.phase);
    const wanderY = Math.cos(t * 0.06 + family.phase * 1.4);
    const drift = t * 0.12 + family.phase;

    for (let row = 0; row < height; row++) {
      const y = (grid.rows[row] ?? 0) - shiftY;
      rowBend[row] = Math.sin(y * 5 + t * 0.21 + family.phase);
    }
    for (let column = 0; column < width; column++) {
      const x = (grid.columns[column] ?? 0) - shiftX;
      columnBend[column] = Math.sin(x * 4 - t * 0.17 + family.phase * 1.3);
    }

    for (let row = 0; row < height; row++) {
      const y = (grid.rows[row] ?? 0) - shiftY;
      const bendOfRow = rowBend[row] ?? 0;
      for (let column = 0; column < width; column++) {
        const i = row * width + column;
        const x = (grid.columns[column] ?? 0) - shiftX;
        const lively = grid.lively[i] ?? 0;
        const motion = 0.3 + 0.7 * lively;

        const bendX = motion * 0.1 * bendOfRow;
        const bendY = motion * 0.08 * (columnBend[column] ?? 0);
        const wave = Math.sin(
          (x + bendX) * family.waveX + (y + bendY) * family.waveY + drift,
        );
        const band = bell(4 * wave * wave);

        const dx = x - (family.blobX + motion * 0.14 * wanderX);
        const dy = y - (family.blobY + motion * 0.1 * wanderY);
        const blob = bell(9 * (dx * dx + dy * dy));

        const level = 1 - 0.24 * (0.4 + 0.6 * lively) * breathe;
        target[i] = Math.min(1, (0.5 * band + 0.75 * blob) * level);
      }
    }
  }

  // The families share one budget per pixel. Text on top is checked against
  // each glow at full strength, so together they may never add up to more.
  for (let i = 0; i < size; i++) {
    let total = 0;
    for (const family of out) total += family[i] ?? 0;
    if (total <= 1) continue;
    for (const family of out) family[i] = (family[i] ?? 0) / total;
  }
}
