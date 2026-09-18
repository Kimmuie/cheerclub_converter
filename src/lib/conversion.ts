// src/lib/conversion.ts
// Turns an ImageAsset + Palette + PlateSize into one or more PlateGrid tables.
//
// Model: the source image's pixels ARE the "dots" (per the product brief,
// source artwork is expected to be low-pixel BMP/PNG/JPG). We read the full
// pixel grid once via <canvas>, then tile it into plates of `plateSize.rows x
// plateSize.columns` cells. Plates are labelled in reading order: row letters
// (A, B, C, ...) x column numbers (1, 2, 3, ...), matching the printed layout.

import type { ImageAsset, Palette, PlateGrid, PlateSize } from "@/types";
import { createPaletteMatcher, type RGB } from "./colorUtils";

export class ConversionError extends Error {}

function rowLetter(rowIndex: number): string {
  // 0 -> A, 1 -> B, ... 25 -> Z, 26 -> AA, ...
  let n = rowIndex;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ConversionError("Could not load image data for conversion."));
    img.src = src;
  });
}

/** Reads the full pixel grid of an image as RGB[][], rows first. */
export async function getPixelGrid(image: ImageAsset): Promise<RGB[][]> {
  const img = await loadImageElement(image.src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new ConversionError("Canvas 2D context is unavailable in this browser.");
  }
  ctx.drawImage(img, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const grid: RGB[][] = [];
  for (let y = 0; y < height; y++) {
    const row: RGB[] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      // Fully transparent pixels map to "no color" (index 0) downstream by
      // being pushed out of range; callers treat r=g=b=-1 as blank.
      if (alpha === 0) {
        row.push({ r: -1, g: -1, b: -1 });
      } else {
        row.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Splits a full pixel grid into plates of `plateSize` cells each, mapping
 * every cell to its nearest palette index (0 = blank / transparent).
 */
export function buildPlates(
  pixelGrid: RGB[][],
  palette: Palette,
  plateSize: PlateSize
): PlateGrid[] {
  if (plateSize.rows <= 0 || plateSize.columns <= 0) {
    throw new ConversionError("Plate rows and columns must be positive integers.");
  }
  const height = pixelGrid.length;
  const width = height > 0 ? pixelGrid[0].length : 0;
  if (width === 0 || height === 0) {
    throw new ConversionError("Source image has no readable pixel data.");
  }

  const matcher = createPaletteMatcher(palette.colors);
  const platesDown = Math.ceil(height / plateSize.rows);
  const platesAcross = Math.ceil(width / plateSize.columns);

  const plates: PlateGrid[] = [];

  for (let pr = 0; pr < platesDown; pr++) {
    for (let pc = 0; pc < platesAcross; pc++) {
      const cells: number[][] = [];
      for (let r = 0; r < plateSize.rows; r++) {
        const cellRow: number[] = [];
        const srcY = pr * plateSize.rows + r;
        for (let c = 0; c < plateSize.columns; c++) {
          const srcX = pc * plateSize.columns + c;
          if (srcY >= height || srcX >= width) {
            cellRow.push(0); // outside image bounds — blank cell, plate padded evenly
            continue;
          }
          const pixel = pixelGrid[srcY][srcX];
          if (pixel.r < 0) {
            cellRow.push(0); // transparent pixel — blank cell
            continue;
          }
          cellRow.push(matcher(pixel));
        }
        cells.push(cellRow);
      }
      plates.push({
        label: `${rowLetter(pr)}${pc + 1}`,
        cells,
      });
    }
  }

  return plates;
}

/** End-to-end: image -> pixels -> plates. Wraps errors as ConversionError. */
export async function convertImage(
  image: ImageAsset,
  palette: Palette,
  plateSize: PlateSize
): Promise<PlateGrid[]> {
  if (!palette || palette.colors.length === 0) {
    throw new ConversionError("No palette loaded — import an .aco file before converting.");
  }
  const pixelGrid = await getPixelGrid(image);
  return buildPlates(pixelGrid, palette, plateSize);
}
