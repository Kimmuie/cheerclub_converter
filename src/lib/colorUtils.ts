// src/lib/colorUtils.ts
// Pure color-math helpers used by the pixel-to-palette conversion step.

import type { PaletteColor } from "@/types";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/** Squared Euclidean distance in RGB space — cheaper than sqrt, same ordering. */
function distanceSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * Finds the closest palette entry to a sampled RGB pixel value.
 * Returns the palette color's 1-based `index`, or 0 if the palette is empty.
 */
export function nearestPaletteIndex(pixel: RGB, palette: PaletteColor[]): number {
  if (palette.length === 0) return 0;

  let bestIndex = palette[0].index;
  let bestDist = Infinity;

  for (const color of palette) {
    const rgb = hexToRgb(color.hex);
    const d = distanceSq(pixel, rgb);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = color.index;
    }
  }

  return bestIndex;
}

/** Builds a memoized lookup so repeated pixel colors within one image are cheap. */
export function createPaletteMatcher(palette: PaletteColor[]) {
  const cache = new Map<string, number>();
  return (pixel: RGB): number => {
    const key = `${pixel.r},${pixel.g},${pixel.b}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const result = nearestPaletteIndex(pixel, palette);
    cache.set(key, result);
    return result;
  };
}
