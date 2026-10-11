import { describe, expect, it } from "vitest";
import {
  FAMILY_COUNT,
  createGrid,
  createIntensities,
  sampleField,
} from "./aurora-field";

const grid = createGrid(48, 27);
const still = { x: 0, y: 0 };

function sampleAt(seconds: number, pointer = still) {
  const out = createIntensities(grid);
  sampleField(grid, seconds, pointer, out);
  return out;
}

/** How much one pixel's brightness changes over a minute, summed by family. */
function movement(pixel: number): number {
  let total = 0;
  let previous = sampleAt(0).map((family) => family[pixel] ?? 0);
  for (let second = 1; second <= 60; second++) {
    const current = sampleAt(second).map((family) => family[pixel] ?? 0);
    current.forEach((value, f) => {
      total += Math.abs(value - (previous[f] ?? 0));
    });
    previous = current;
  }
  return total;
}

describe("aurora field", () => {
  it("keeps every intensity between 0 and 1", () => {
    for (const seconds of [0, 7.5, 60, 600, 3600]) {
      for (const family of sampleAt(seconds)) {
        for (const value of family) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("never lets the three families add up to more than one", () => {
    for (const seconds of [0, 13, 90, 1000]) {
      const out = sampleAt(seconds);
      for (let i = 0; i < grid.width * grid.height; i++) {
        const total = out.reduce((sum, family) => sum + (family[i] ?? 0), 0);
        expect(total).toBeLessThanOrEqual(1 + 1e-6);
      }
    }
  });

  it("fills one array per family", () => {
    expect(sampleAt(1)).toHaveLength(FAMILY_COUNT);
  });

  it("moves less behind the search than at the edges", () => {
    const row = Math.round(grid.height * 0.42);
    const centre = row * grid.width + Math.round(grid.width * 0.5);
    const edge = row * grid.width + 1;
    expect(grid.lively[centre]).toBeLessThan(0.1);
    expect(grid.lively[edge]).toBeGreaterThan(0.5);
    expect(movement(centre)).toBeLessThan(movement(edge));
  });

  it("changes slowly from one moment to the next", () => {
    const first = sampleAt(10);
    const second = sampleAt(10.5);
    for (let f = 0; f < FAMILY_COUNT; f++) {
      const a = first[f] ?? new Float32Array();
      const b = second[f] ?? new Float32Array();
      for (let i = 0; i < a.length; i++) {
        expect(Math.abs((a[i] ?? 0) - (b[i] ?? 0))).toBeLessThan(0.1);
      }
    }
  });

  it("shifts with the pointer, far layers least", () => {
    const base = sampleAt(5);
    const moved = sampleAt(5, { x: 0.03, y: 0 });
    const difference = (family: number) => {
      const a = base[family] ?? new Float32Array();
      const b = moved[family] ?? new Float32Array();
      return a.reduce(
        (sum, value, i) => sum + Math.abs(value - (b[i] ?? 0)),
        0,
      );
    };
    expect(difference(0)).toBeGreaterThan(0);
    expect(difference(2)).toBeLessThan(difference(0));
  });
});
