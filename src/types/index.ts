// src/types/index.ts
// Core domain types for CheerClub Converter.
// Kept separate from components/logic so they can be imported anywhere
// without pulling in browser-only code.

export interface PaletteColor {
  /** 1-based index as used in the generated plate grids (matches ACO order) */
  index: number;
  /** Human readable name from the ACO swatch, e.g. "Crimson" */
  name: string;
  /** Hex color, e.g. "#8B0000" */
  hex: string;
}

export interface Palette {
  id: string;
  fileName: string;
  colors: PaletteColor[];
  /** ISO timestamp of import */
  importedAt: string;
}

export type ImageFormat = "bmp" | "png" | "jpg" | "jpeg";

export interface ImageAsset {
  id: string;
  fileName: string;
  name?: string;
  format: ImageFormat;
  /** Object URL or data URL used for <img> / canvas loading */
  src: string;
  width: number;
  height: number;
  /** Size in bytes, for display */
  size: number;
}

export interface PlateSize {
  rows: number;
  columns: number;
}

/** A single generated table (one plate) — rows x columns of palette indices */
export interface PlateGrid {
  /** e.g. "A1", "B3" — row letter + column number, matches export layout */
  label: string;
  /** grid[row][col] = palette index (1-based), or 0 if unmapped/empty */
  cells: number[][];
}

export type ConversionStatus = "idle" | "processing" | "ready" | "error";

export interface ConversionResult {
  id: string;
  imageId: string;
  imageFileName: string;
  status: ConversionStatus;
  /** One plate per Row/Col "sheet position" required to cover the image */
  plates: PlateGrid[];
  /** Total individual plates (rows*cols of the *sheet* matrix, not cell matrix) */
  totalPlates: number;
  errorMessage?: string;
}

export type ExportMode = "merge" | "separate";

export interface ExportOptions {
  mode: ExportMode;
  pageSize: "A4" | "A3" | "Letter";
  /** Which conversion results (by ImageAsset id) to include */
  imageIds: string[];
}

export type ExportStatus = "idle" | "generating" | "success" | "error";

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  palette: Palette | null;
  images: ImageAsset[];
  plateSize: PlateSize;
  results: ConversionResult[];
  exportOptions: ExportOptions;
}
