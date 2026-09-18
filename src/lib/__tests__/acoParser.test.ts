// src/lib/__tests__/acoParser.test.ts
import { describe, it, expect } from "vitest";
import { parseAco, AcoParseError } from "../acoParser";

function buildV1AcoBuffer(colors: [number, number, number][]): ArrayBuffer {
  // version(2) + count(2) + colors * (colorSpace(2)+w(2)+x(2)+y(2)+z(2))
  const buf = new ArrayBuffer(4 + colors.length * 10);
  const view = new DataView(buf);
  view.setUint16(0, 1); // version 1
  view.setUint16(2, colors.length);
  let o = 4;
  for (const [r, g, b] of colors) {
    view.setUint16(o, 0); o += 2; // RGB color space
    view.setUint16(o, r * 257); o += 2;
    view.setUint16(o, g * 257); o += 2;
    view.setUint16(o, b * 257); o += 2;
    view.setUint16(o, 0); o += 2; // unused z
  }
  return buf;
}

describe("parseAco", () => {
  it("parses a simple v1 RGB swatch file", () => {
    const buf = buildV1AcoBuffer([
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
    ]);
    const colors = parseAco(buf);
    expect(colors).toHaveLength(3);
    expect(colors[0].hex).toBe("#FF0000");
    expect(colors[1].hex).toBe("#00FF00");
    expect(colors[2].hex).toBe("#0000FF");
    expect(colors[0].index).toBe(1);
  });

  it("throws AcoParseError for a file that is too small", () => {
    expect(() => parseAco(new ArrayBuffer(2))).toThrow(AcoParseError);
  });

  it("throws AcoParseError for an unrecognized version marker", () => {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setUint16(0, 99);
    expect(() => parseAco(buf)).toThrow(AcoParseError);
  });

  it("throws AcoParseError when there are zero colors", () => {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setUint16(0, 1);
    view.setUint16(2, 0);
    expect(() => parseAco(buf)).toThrow(AcoParseError);
  });
});
