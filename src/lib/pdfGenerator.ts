// src/lib/pdfGenerator.ts
//
// Builds downloadable PDFs from ConversionResults, mirroring PreviewPane.tsx
// pixel-for-pixel in intent (colors, fills, labels, and pagination logic —
// not literal px-to-mm scaling, since print units and CSS px don't map 1:1).
//
// Two layout modes, matching the preview's two branches exactly:
//  - "merge" ("Compact Matrix"): one page per plate-index; every selected
//    image's plate at that index is laid out side by side, wrapping like the
//    preview's flex-wrap row. Always A4, same as the preview locks it.
//  - "separate" ("Dense Pack"): each image gets its own run of pages, built
//    from the SAME row/column pagination algorithm as the preview
//    (Image order / By row / By column), using page capacity computed from
//    the real plate dimensions.
//
// Color rendering also mirrors MiniPlateTable exactly:
//  - "color":   cell fill = palette hex (white if unmapped), light-gray grid
//               lines (Tailwind border-gray-200), black value text.
//  - "outline": transparent fill, solid black grid lines, black value text.
//
// NOTE ON TYPES: this assumes `ExportOptions` (in @/types) has been extended
// with the two fields the preview already tracks in component state:
//   colorMode?: "color" | "outline";   // defaults to "outline" below
//   sortMode?: "image" | "row" | "column"; // defaults to "image", separate-mode only
// so the export call site can pass `group.exportOptions` straight through,
// the same options object the preview itself reads from. `generatePdf` also
// now takes `groupId`, needed to build the same "Batch ID: CHR-XXXXXXXX"
// label the preview shows in Dense Pack mode.
//
// Kept isolated from React so the layout math (how many tables fit per page,
// how pages are chunked per sort mode) can be unit tested without a
// DOM/jsPDF instance.

import { jsPDF } from "jspdf";
import type { ConversionResult, ExportOptions, Palette, PlateGrid } from "@/types";

export type ColorMode = "color" | "outline";
export type SeparateSortMode = "image" | "row" | "column";

export interface GeneratePdfOptions extends ExportOptions {
  colorMode?: ColorMode;
  sortMode?: SeparateSortMode;
}

const PAGE_SIZES: Record<ExportOptions["pageSize"], [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  Letter: [215.9, 279.4],
};

const MARGIN_MM = 12;
const TABLE_GAP_MM = 2.5;
const CELL_MM = 7; // size of one printed dot/cell, in mm
const LABEL_HEIGHT_MM = 6; // per-plate label row, mirrors PLATE_LABEL_HEIGHT in the preview
const HEADER_HEIGHT_MM = 28; // brand strip + title + sub-label, mirrors PAGE_HEADER_HEIGHT

// Tailwind colors used by PreviewPane, as RGB triples.
const COLOR = {
  red700: [185, 28, 28] as const,
  gray900: [17, 24, 39] as const,
  gray700: [55, 65, 81] as const,
  gray600: [75, 85, 99] as const,
  gray500: [107, 114, 128] as const,
  gray400: [156, 163, 175] as const,
  gray300: [209, 213, 219] as const,
  gray200: [229, 231, 235] as const,
  black: [0, 0, 0] as const,
};

export class PdfGenerationError extends Error {}

interface TableFootprint {
  widthMm: number;
  heightMm: number;
}

function footprintForPlate(plate: PlateGrid): TableFootprint {
  const cols = plate.cells[0]?.length ?? 0;
  const rows = plate.cells.length;
  return {
    widthMm: cols * CELL_MM,
    heightMm: rows * CELL_MM + LABEL_HEIGHT_MM,
  };
}

// Mirrors PreviewPane's splitLabel exactly: leading letters = row, trailing
// digits = column.
function splitLabel(label: string) {
  const row = label.match(/^[A-Za-z]+/)?.[0] ?? label;
  const column = Number(label.match(/\d+$/)?.[0] ?? "0");
  return { row, column };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return items.length ? [items] : [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Mirrors PreviewPane's getPageCapacity, in mm against the actual selected
// page size instead of a fixed A4 preview box.
function getPageCapacityMm(
  cells: number[][] | undefined,
  pageSize: ExportOptions["pageSize"]
) {
  const [w, h] = PAGE_SIZES[pageSize];
  const plateRows = Math.max(cells?.length ?? 1, 1);
  const plateColumns = Math.max(cells?.[0]?.length ?? 1, 1);
  const plateWidth = plateColumns * CELL_MM;
  const plateHeight = plateRows * CELL_MM + LABEL_HEIGHT_MM;
  const availableWidth = w - MARGIN_MM * 2;
  const availableHeight = h - MARGIN_MM * 2 - HEADER_HEIGHT_MM;

  return {
    rows: Math.max(1, Math.floor((availableHeight + TABLE_GAP_MM) / (plateHeight + TABLE_GAP_MM))),
    columns: Math.max(1, Math.floor((availableWidth + TABLE_GAP_MM) / (plateWidth + TABLE_GAP_MM))),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [255, 255, 255];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function setTextColor(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

// The small red brand strip at the top of every printed page — mirrors the
// "CheerClub Generator" line shown above both preview branches.
function drawBrandStrip(doc: jsPDF, originX: number, originY: number) {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, COLOR.red700);
  doc.text("CHEERCLUB GENERATOR", originX, originY);
}

/**
 * Draws just the plate's grid of cells (no label) at the given origin.
 * Mirrors MiniPlateTable's two color states exactly.
 */
function drawPlateGrid(
  doc: jsPDF,
  plate: PlateGrid,
  palette: Palette | null,
  colorMode: ColorMode,
  originX: number,
  originY: number
) {
  plate.cells.forEach((row, r) => {
    row.forEach((value, c) => {
      const x = originX + c * CELL_MM;
      const y = originY + r * CELL_MM;
      const color = palette?.colors.find((pc) => pc.index === value);

      if (colorMode === "color") {
        const [red, green, blue] = color ? hexToRgb(color.hex) : [255, 255, 255];
        doc.setFillColor(red, green, blue);
        doc.setDrawColor(...COLOR.gray200);
        doc.rect(x, y, CELL_MM, CELL_MM, "FD");
      } else {
        doc.setDrawColor(...COLOR.black);
        doc.rect(x, y, CELL_MM, CELL_MM);
      }

      if (value > 0) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        setTextColor(doc, COLOR.black);
        doc.text(String(value), x + CELL_MM / 2, y + CELL_MM / 2 + 1, {
          align: "center",
        });
      }
    });
  });
}

interface PositionedPlate {
  plate: PlateGrid;
  row: string;
  column: number;
}

interface SeparatePage {
  rows: string[];
  columns: number[];
  plates: PositionedPlate[];
}

/**
 * Builds the paginated plate order for a single image under a given sort
 * mode. This is a direct port of PreviewPane's `separatePages` memo — same
 * chunking, same "finish the row/column before moving on" behavior.
 */
function buildSeparatePages(
  plates: PlateGrid[],
  sortMode: SeparateSortMode,
  pageCapacity: { rows: number; columns: number }
): SeparatePage[] {
  const platesWithPosition: PositionedPlate[] = plates.map((plate) => {
    const { row, column } = splitLabel(plate.label);
    return { plate, row, column };
  });

  const uniqueRows = Array.from(new Set(platesWithPosition.map((p) => p.row))).sort();
  const uniqueColumns = Array.from(new Set(platesWithPosition.map((p) => p.column))).sort(
    (a, b) => a - b
  );
  if (uniqueRows.length === 0 || uniqueColumns.length === 0) return [];

  const findPlate = (row: string, col: number) =>
    platesWithPosition.find((p) => p.row === row && p.column === col);

  const pages: SeparatePage[] = [];
  const platesPerPage = pageCapacity.rows * pageCapacity.columns;

  if (sortMode === "row") {
    // Finish one logical row before moving to the next.
    for (const row of uniqueRows) {
      const rowPlates = platesWithPosition
        .filter((p) => p.row === row)
        .sort((a, b) => a.column - b.column);
      for (const chunk of chunkArray(rowPlates, platesPerPage)) {
        pages.push({ rows: [row], columns: chunk.map((p) => p.column), plates: chunk });
      }
    }
  } else if (sortMode === "column") {
    // Mirror of row mode: finish one logical column before moving on.
    for (const column of uniqueColumns) {
      const columnPlates = platesWithPosition
        .filter((p) => p.column === column)
        .sort((a, b) => a.row.localeCompare(b.row));
      for (const chunk of chunkArray(columnPlates, platesPerPage)) {
        pages.push({ rows: chunk.map((p) => p.row), columns: [column], plates: chunk });
      }
    }
  } else {
    // Image order: fill the page in normal reading order.
    for (const cols of chunkArray(uniqueColumns, pageCapacity.columns)) {
      for (const rows of chunkArray(uniqueRows, pageCapacity.rows)) {
        const pagePlates: PositionedPlate[] = [];
        for (const row of rows) {
          for (const col of cols) {
            const found = findPlate(row, col);
            if (found) pagePlates.push(found);
          }
        }
        if (pagePlates.length > 0) pages.push({ rows, columns: cols, plates: pagePlates });
      }
    }
  }

  return pages;
}

/**
 * "Compact Matrix" / merge mode: one page per plate-index, every selected
 * image's plate at that index laid out side by side. Mirrors the preview's
 * merge branch — title = plate label, "Row X · Column Y" sub-label, then a
 * flex-wrap row of {filename, mini table} per image.
 */
function generateMerge(
  results: ConversionResult[],
  palette: Palette | null,
  colorMode: ColorMode
): jsPDF {
  const [w, h] = PAGE_SIZES.A4; // Compact Matrix is always locked to A4, like the preview.
  const doc = new jsPDF({ unit: "mm", format: [w, h] });
  const usableRight = w - MARGIN_MM;
  const usableBottom = h - MARGIN_MM;

  const sheetCount = Math.max(0, ...results.map((r) => r.totalPlates));
  if (sheetCount === 0) {
    throw new PdfGenerationError("Nothing to export — no converted plates were found.");
  }

  for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex++) {
    if (sheetIndex > 0) doc.addPage([w, h]);

    drawBrandStrip(doc, MARGIN_MM, MARGIN_MM);

    const label = results[0]?.plates[sheetIndex]?.label ?? null;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    setTextColor(doc, COLOR.gray900);
    doc.text(label ?? "—", MARGIN_MM, MARGIN_MM + 10);

    if (label) {
      const { row, column } = splitLabel(label);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      setTextColor(doc, COLOR.gray400);
      doc.text(`Row ${row} \u00b7 Column ${column}`, MARGIN_MM, MARGIN_MM + 15);
    }

    let cursorX = MARGIN_MM;
    let cursorY = MARGIN_MM + HEADER_HEIGHT_MM;
    let rowMaxHeight = 0;

    for (const result of results) {
      const plate = result.plates[sheetIndex];
      const footprint = plate ? footprintForPlate(plate) : { widthMm: 32, heightMm: LABEL_HEIGHT_MM + 4 };

      if (cursorX + footprint.widthMm > usableRight) {
        cursorX = MARGIN_MM;
        cursorY += rowMaxHeight + TABLE_GAP_MM;
        rowMaxHeight = 0;
      }
      if (cursorY + footprint.heightMm > usableBottom) {
        doc.addPage([w, h]);
        cursorX = MARGIN_MM;
        cursorY = MARGIN_MM;
        rowMaxHeight = 0;
      }

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      setTextColor(doc, COLOR.gray700);
      doc.text(result.imageFileName, cursorX, cursorY);

      if (plate) {
        drawPlateGrid(doc, plate, palette, colorMode, cursorX, cursorY + LABEL_HEIGHT_MM);
      } else {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        setTextColor(doc, COLOR.gray300);
        doc.text("No plate at this sheet", cursorX, cursorY + LABEL_HEIGHT_MM + 3);
      }

      cursorX += footprint.widthMm + TABLE_GAP_MM;
      rowMaxHeight = Math.max(rowMaxHeight, footprint.heightMm);
    }
  }

  return doc;
}

/**
 * "Dense Pack" / separate mode: each image gets its own run of pages, built
 * with the exact same sort-mode pagination as the preview (Image order / By
 * row / By column), including the "Sheet NN (N Tables) · Row/Column …"
 * sub-label and the "Batch ID: CHR-XXXXXXXX" tag.
 */
function generateSeparate(
  results: ConversionResult[],
  palette: Palette | null,
  colorMode: ColorMode,
  sortMode: SeparateSortMode,
  pageSize: ExportOptions["pageSize"],
  groupId?: string
): jsPDF {
  const [w, h] = PAGE_SIZES[pageSize];
  const doc = new jsPDF({ unit: "mm", format: [w, h] });
  // groupId is only used for this cosmetic tag, so a missing/empty value
  // (e.g. called before the group has settled, or from a context that never
  // had one) shouldn't crash the whole export.
  const batchId = groupId ? `CHR-${groupId.slice(0, 8).toUpperCase()}` : "CHR-UNKNOWN";

  let placedAnyPage = false;

  for (const result of results) {
    if (result.plates.length === 0) continue;

    const pageCapacity = getPageCapacityMm(result.plates[0]?.cells, pageSize);
    const pages = buildSeparatePages(result.plates, sortMode, pageCapacity);

    pages.forEach((page, pageIndex) => {
      if (placedAnyPage) doc.addPage([w, h]);
      placedAnyPage = true;

      drawBrandStrip(doc, MARGIN_MM, MARGIN_MM);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      setTextColor(doc, COLOR.gray900);
      doc.text(`${result.imageFileName} \u00b7 Dense Pack`, MARGIN_MM, MARGIN_MM + 8);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      setTextColor(doc, COLOR.gray500);
      doc.text(`Batch ID: ${batchId}`, w - MARGIN_MM, MARGIN_MM + 8, { align: "right" });

      let subLabel = `SHEET ${String(pageIndex + 1).padStart(2, "0")} (${page.plates.length} TABLES)`;
      if (sortMode === "row" && page.rows[0]) subLabel += ` \u00b7 ROW ${page.rows[0]}`;
      if (sortMode === "column" && page.columns[0] !== undefined) {
        subLabel += ` \u00b7 COLUMN ${page.columns[0]}`;
      }
      doc.setFontSize(7.5);
      setTextColor(doc, COLOR.gray400);
      doc.text(subLabel, MARGIN_MM, MARGIN_MM + 14);

      if (page.plates.length === 0) return;

      // Column count for the wrap grid: row/column modes always use the
      // page's full column capacity (a short row/column still wraps at the
      // same width); image-order mode uses however many columns are on this
      // page — same as the preview's gridTemplateColumns logic.
      const gridColumns =
        sortMode === "column" || sortMode === "row" ? pageCapacity.columns : page.columns.length;

      const footprint = footprintForPlate(page.plates[0].plate);
      const colStrideMm = footprint.widthMm + TABLE_GAP_MM;
      const rowStrideMm = footprint.heightMm + TABLE_GAP_MM;
      const gridOriginY = MARGIN_MM + HEADER_HEIGHT_MM;

      page.plates.forEach((p, i) => {
        const col = i % Math.max(gridColumns, 1);
        const row = Math.floor(i / Math.max(gridColumns, 1));
        const x = MARGIN_MM + col * colStrideMm;
        const y = gridOriginY + row * rowStrideMm;

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        setTextColor(doc, COLOR.gray600);
        doc.text(`Plate ${p.plate.label}`, x, y);

        drawPlateGrid(doc, p.plate, palette, colorMode, x, y + LABEL_HEIGHT_MM - 2);
      });
    });
  }

  if (!placedAnyPage) {
    throw new PdfGenerationError("Nothing to export — no converted plates were found.");
  }

  return doc;
}

/**
 * Builds the export PDF for the given options, matching the live preview
 * exactly: same color/outline rendering, same merge vs. separate layout,
 * and — in separate mode — the same Image order / By row / By column
 * pagination the preview lets the user pick between.
 *
 * `groupId` is only used to build the "Batch ID" label shown in Dense Pack
 * mode, matching PreviewPane's `CHR-${groupId.slice(0, 8).toUpperCase()}`.
 */
export function generatePdf(
  results: ConversionResult[],
  options: GeneratePdfOptions,
  palette: Palette | null,
  groupId?: string
): jsPDF {
  const selected = results.filter((r) => options.imageIds.includes(r.imageId));
  if (selected.length === 0) {
    throw new PdfGenerationError("Select at least one converted image to export.");
  }
  const withErrors = selected.filter((r) => r.status !== "ready");
  if (withErrors.length > 0) {
    throw new PdfGenerationError(
      `Cannot export — ${withErrors.length} selected image(s) have not finished converting successfully.`
    );
  }

  const colorMode = options.colorMode ?? "outline";
  const sortMode = options.sortMode ?? "image";

  return options.mode === "merge"
    ? generateMerge(selected, palette, colorMode)
    : generateSeparate(selected, palette, colorMode, sortMode, options.pageSize, groupId);
}

/** Triggers a browser download of the generated PDF. */
export function downloadPdf(doc: jsPDF, fileName: string) {
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}