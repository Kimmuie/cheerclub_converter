// src/lib/__tests__/colorUtils.test.ts
import { describe, it, expect } from "vitest";
import { hexToRgb, nearestPaletteIndex, createPaletteMatcher } from "../colorUtils";
import type { PaletteColor } from "@/types";

const palette: PaletteColor[] = [
  { index: 1, name: "Red", hex: "#FF0000" },
  { index: 2, name: "Green", hex: "#00FF00" },
  { index: 3, name: "Blue", hex: "#0000FF" },
];

describe("hexToRgb", () => {
  it("converts hex to rgb components", () => {
    expect(hexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
  });
});

describe("nearestPaletteIndex", () => {
  it("returns the exact match when a color exists in the palette", () => {
    expect(nearestPaletteIndex({ r: 0, g: 255, b: 0 }, palette)).toBe(2);
  });

  it("returns the closest color when there is no exact match", () => {
    // Slightly off-red should still match Red
    expect(nearestPaletteIndex({ r: 250, g: 10, b: 10 }, palette)).toBe(1);
  });

  it("returns 0 for an empty palette", () => {
    expect(nearestPaletteIndex({ r: 0, g: 0, b: 0 }, [])).toBe(0);
  });
});

describe("createPaletteMatcher", () => {
  it("caches repeated lookups and returns consistent results", () => {
    const matcher = createPaletteMatcher(palette);
    const first = matcher({ r: 0, g: 0, b: 255 });
    const second = matcher({ r: 0, g: 0, b: 255 });
    expect(first).toBe(3);
    expect(second).toBe(3);
  });
});
