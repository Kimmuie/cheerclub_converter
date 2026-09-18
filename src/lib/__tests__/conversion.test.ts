// src/lib/__tests__/conversion.test.ts
import { describe, it, expect } from "vitest";
import { buildPlates, ConversionError } from "../conversion";
import type { Palette } from "@/types";
import type { RGB } from "../colorUtils";

const palette: Palette = {
  id: "p1",
  fileName: "test.aco",
  importedAt: new Date().toISOString(),
  colors: [
    { index: 1, name: "Red", hex: "#FF0000" },
    { index: 2, name: "Blue", hex: "#0000FF" },
  ],
};

function solidGrid(width: number, height: number, color: RGB): RGB[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => ({ ...color })));
}

describe("buildPlates", () => {
  it("produces a single plate when image fits exactly in one plate size", () => {
    const grid = solidGrid(5, 4, { r: 255, g: 0, b: 0 });
    const plates = buildPlates(grid, palette, { rows: 4, columns: 5 });
    expect(plates).toHaveLength(1);
    expect(plates[0].label).toBe("A1");
    expect(plates[0].cells).toHaveLength(4);
    expect(plates[0].cells[0]).toHaveLength(5);
    expect(plates[0].cells[0][0]).toBe(1); // matched to Red
  });

  it("tiles multiple plates and pads out-of-bounds cells with 0", () => {
    const grid = solidGrid(7, 5, { r: 0, g: 0, b: 255 }); // needs 2x2 plates of 4x5
    const plates = buildPlates(grid, palette, { rows: 4, columns: 5 });
    // ceil(5/4)=2 rows of plates, ceil(7/5)=2 cols of plates => 4 plates
    expect(plates).toHaveLength(4);
    const labels = plates.map((p) => p.label);
    expect(labels).toEqual(["A1", "A2", "B1", "B2"]);
  });

  it("marks fully transparent pixels as blank (index 0)", () => {
    const grid = solidGrid(2, 2, { r: -1, g: -1, b: -1 });
    const plates = buildPlates(grid, palette, { rows: 2, columns: 2 });
    expect(plates[0].cells.flat().every((v) => v === 0)).toBe(true);
  });

  it("throws ConversionError for non-positive plate dimensions", () => {
    const grid = solidGrid(2, 2, { r: 0, g: 0, b: 0 });
    expect(() => buildPlates(grid, palette, { rows: 0, columns: 2 })).toThrow(ConversionError);
  });

  it("throws ConversionError for an empty pixel grid", () => {
    expect(() => buildPlates([], palette, { rows: 2, columns: 2 })).toThrow(ConversionError);
  });
});
