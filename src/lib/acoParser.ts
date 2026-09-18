// src/lib/acoParser.ts
// Parses Adobe .aco color swatch files into PaletteColor[].
// Pure function, no DOM/browser dependencies beyond ArrayBuffer/DataView,
// so it is unit-testable in isolation.

import type { PaletteColor } from "@/types";

export class AcoParseError extends Error {}

const COLOR_SPACE = {
  RGB: 0,
  HSB: 1,
  CMYK: 2,
  LAB: 7,
  GRAYSCALE: 8,
} as const;

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => clamp255(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function hsbToRgb(h: number, s: number, v: number): [number, number, number] {
  // h, s, v are 0..1 here (ACO stores them as 16-bit fractions of 1)
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0,
    g = 0,
    b = 0;
  switch (i % 6) {
    case 0:
      r = v; g = t; b = p; break;
    case 1:
      r = q; g = v; b = p; break;
    case 2:
      r = p; g = v; b = t; break;
    case 3:
      r = p; g = q; b = v; break;
    case 4:
      r = t; g = p; b = v; break;
    case 5:
      r = v; g = p; b = q; break;
  }
  return [r * 255, g * 255, b * 255];
}

function cmykToRgb(c: number, m: number, y: number, k: number): [number, number, number] {
  // ACO stores CMYK as 16-bit fractions of 1, inverted (0 = full ink)
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return [r, g, b];
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  // Standard CIE-Lab -> sRGB conversion (D65 illuminant)
  const y = (L + 16) / 116;
  const x = a / 500 + y;
  const z = y - b / 200;

  const f = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);

  const X = 95.047 * f(x);
  const Y = 100.0 * f(y);
  const Z = 108.883 * f(z);

  let R = X * 0.032406 + Y * -0.015372 + Z * -0.004986;
  let G = X * -0.009689 + Y * 0.018758 + Z * 0.000415;
  let B = X * 0.000557 + Y * -0.00204 + Z * 0.010570;

  const gammaCorrect = (c: number) => {
    c = c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c;
    return clamp255(c * 255);
  };

  R = gammaCorrect(R);
  G = gammaCorrect(G);
  B = gammaCorrect(B);
  return [R, G, B];
}

interface RawEntry {
  colorSpace: number;
  w: number;
  x: number;
  y: number;
  z: number;
  name: string;
}

function readEntriesForVersion(
  view: DataView,
  offset: number,
  count: number,
  version: 1 | 2
): { entries: RawEntry[]; nextOffset: number } {
  const entries: RawEntry[] = [];
  let o = offset;

  for (let i = 0; i < count; i++) {
    if (o + 10 > view.byteLength) {
      throw new AcoParseError("Unexpected end of file while reading color entry.");
    }
    const colorSpace = view.getUint16(o); o += 2;
    const w = view.getUint16(o); o += 2;
    const x = view.getUint16(o); o += 2;
    const y = view.getUint16(o); o += 2;
    const z = view.getUint16(o); o += 2;

    let name = "";
    if (version === 2) {
      if (o + 4 > view.byteLength) {
        throw new AcoParseError("Unexpected end of file while reading color name.");
      }
      // 4 bytes: 2 unused (should be 0) + string length (including trailing null), UTF-16BE
      o += 2; // unused
      const nameLen = view.getUint16(o); o += 2;
      const chars: number[] = [];
      for (let c = 0; c < nameLen; c++) {
        if (o + 2 > view.byteLength) {
          throw new AcoParseError("Unexpected end of file while reading color name characters.");
        }
        chars.push(view.getUint16(o));
        o += 2;
      }
      // Drop trailing null terminator if present
      if (chars.length && chars[chars.length - 1] === 0) chars.pop();
      name = String.fromCharCode(...chars);
    }

    entries.push({ colorSpace, w, x, y, z, name });
  }

  return { entries, nextOffset: o };
}

function rawEntryToHex(entry: RawEntry): string {
  const frac = (n: number) => n / 65535;
  switch (entry.colorSpace) {
    case COLOR_SPACE.RGB: {
      // Stored as 16-bit values 0..65535 representing 0..255
      const r = entry.w / 257;
      const g = entry.x / 257;
      const b = entry.y / 257;
      return toHex(r, g, b);
    }
    case COLOR_SPACE.HSB: {
      const [r, g, b] = hsbToRgb(frac(entry.w), frac(entry.x), frac(entry.y));
      return toHex(r, g, b);
    }
    case COLOR_SPACE.CMYK: {
      const [r, g, b] = cmykToRgb(frac(entry.w), frac(entry.x), frac(entry.y), frac(entry.z));
      return toHex(r, g, b);
    }
    case COLOR_SPACE.GRAYSCALE: {
      const gray = (entry.w / 10000) * 255;
      return toHex(gray, gray, gray);
    }
    case COLOR_SPACE.LAB: {
      // Lab stored as signed 16-bit-ish fractions; ACO stores L in 0..10000, a/b in -12800..12700
      const L = entry.w / 100;
      const a = entry.x > 32767 ? (entry.x - 65536) / 100 : entry.x / 100;
      const b = entry.y > 32767 ? (entry.y - 65536) / 100 : entry.y / 100;
      const [r, g, bl] = labToRgb(L, a, b);
      return toHex(r, g, bl);
    }
    default:
      throw new AcoParseError(
        `Unsupported ACO color space (${entry.colorSpace}). Supported: RGB, HSB, CMYK, Grayscale, Lab.`
      );
  }
}

/**
 * Parses an .aco file's raw bytes into a flat, ordered PaletteColor list.
 * Supports both v1-only files and v1+v2 combined files (Photoshop writes both
 * blocks back-to-back; v2 carries names, so we prefer it when present).
 */
export function parseAco(buffer: ArrayBuffer): PaletteColor[] {
  if (buffer.byteLength < 4) {
    throw new AcoParseError("File is too small to be a valid .aco swatch file.");
  }
  const view = new DataView(buffer);

  const version1 = view.getUint16(0);
  if (version1 !== 1 && version1 !== 2) {
    throw new AcoParseError(
      "Unrecognized .aco file — expected version marker 1 or 2 at the start of the file."
    );
  }
  const count1 = view.getUint16(2);
  const { entries: v1Entries, nextOffset } = readEntriesForVersion(
    view,
    4,
    count1,
    version1 as 1 | 2
  );

  let finalEntries = v1Entries;

  // Check for a trailing version-2 block (adds names) — common in real Photoshop exports
  if (nextOffset + 4 <= view.byteLength) {
    const version2 = view.getUint16(nextOffset);
    if (version2 === 2) {
      const count2 = view.getUint16(nextOffset + 2);
      if (count2 === count1) {
        const { entries: v2Entries } = readEntriesForVersion(view, nextOffset + 4, count2, 2);
        finalEntries = v2Entries;
      }
    }
  }

  if (finalEntries.length === 0) {
    throw new AcoParseError("No colors found in this .aco file.");
  }

  return finalEntries.map((entry, i) => ({
    index: i + 1,
    name: entry.name || `Color ${i + 1}`,
    hex: rawEntryToHex(entry),
  }));
}
