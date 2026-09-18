// src/lib/pdfGenerator.ts
// Builds downloadable PDFs from ConversionResults.
//
// Two layout modes:
//  - "separate": every plate gets its own page, with a header showing the
//    source image name and plate label.
//  - "merge": plates are packed as many-per-page as will legibly fit, in a
//    simple grid flow, to minimize page count across the whole batch.
//
// Kept isolated from React so the layout math (how many tables fit per page)
// can be unit tested without a DOM/jsPDF instance.

import { jsPDF } from "jspdf";
import type { ConversionResult, ExportOptions, Palette, PlateGrid } from "@/types";

const PAGE_SIZES: Record<ExportOptions["pageSize"], [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  Letter: [215.9, 279.4],
};

const MARGIN_MM = 12;
const TABLE_GAP_MM = 8;
const CELL_MM = 7; // size of one printed dot/cell, in mm
const LABEL_HEIGHT_MM = 6;

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

function drawPlate(
  doc: jsPDF,
  plate: PlateGrid,
  originX: number,
  originY: number,
  headerText: string
) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(headerText, originX, originY);

  const gridTop = originY + 2;
  plate.cells.forEach((row, r) => {
    row.forEach((value, c) => {
      const x = originX + c * CELL_MM;
      const y = gridTop + r * CELL_MM;
      doc.setDrawColor(180);
      doc.rect(x, y, CELL_MM, CELL_MM);
      if (value > 0) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), x + CELL_MM / 2, y + CELL_MM / 2 + 1, {
          align: "center",
        });
      }
    });
  });
}

/**
 * Generates a single PDF covering the given results in "separate" mode:
 * one plate per page.
 */
function generateSeparate(results: ConversionResult[], pageSize: ExportOptions["pageSize"]): jsPDF {
  const [w, h] = PAGE_SIZES[pageSize];
  const doc = new jsPDF({ unit: "mm", format: [w, h] });

  let firstPage = true;
  for (const result of results) {
    for (const plate of result.plates) {
      if (!firstPage) doc.addPage([w, h]);
      firstPage = false;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Image: ${result.imageFileName}`, MARGIN_MM, MARGIN_MM);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Plate ${plate.label}`, MARGIN_MM, MARGIN_MM + 6);

      drawPlate(doc, plate, MARGIN_MM, MARGIN_MM + 14, `Plate ${plate.label}`);
    }
  }

  if (firstPage) {
    throw new PdfGenerationError("Nothing to export — no converted plates were found.");
  }

  return doc;
}

/**
 * Generates a single PDF covering the given results in "merge" mode:
 * tables are packed left-to-right, top-to-bottom, flowing onto new pages
 * only when the current page is full. Works even for a single image.
 */
function generateMerge(results: ConversionResult[], pageSize: ExportOptions["pageSize"]): jsPDF {
  const [w, h] = PAGE_SIZES[pageSize];
  const doc = new jsPDF({ unit: "mm", format: [w, h] });

  const usableWidth = w - MARGIN_MM * 2;
  const usableHeight = h - MARGIN_MM * 2;

  let cursorX = MARGIN_MM;
  let cursorY = MARGIN_MM;
  let rowMaxHeight = 0;
  let placedAny = false;

  const allPlates = results.flatMap((result) =>
    result.plates.map((plate) => ({ plate, imageFileName: result.imageFileName }))
  );

  for (const { plate, imageFileName } of allPlates) {
    const footprint = footprintForPlate(plate);

    if (footprint.widthMm > usableWidth || footprint.heightMm > usableHeight) {
      throw new PdfGenerationError(
        `Plate ${plate.label} from "${imageFileName}" is too large to fit on a ${pageSize} page. Choose a smaller plate size or a larger page size.`
      );
    }

    // Wrap to next row if it doesn't fit horizontally
    if (cursorX + footprint.widthMm > MARGIN_MM + usableWidth) {
      cursorX = MARGIN_MM;
      cursorY += rowMaxHeight + TABLE_GAP_MM;
      rowMaxHeight = 0;
    }

    // New page if it doesn't fit vertically
    if (cursorY + footprint.heightMm > MARGIN_MM + usableHeight) {
      doc.addPage([w, h]);
      cursorX = MARGIN_MM;
      cursorY = MARGIN_MM;
      rowMaxHeight = 0;
    }

    drawPlate(doc, plate, cursorX, cursorY, `${imageFileName} — ${plate.label}`);
    placedAny = true;

    cursorX += footprint.widthMm + TABLE_GAP_MM;
    rowMaxHeight = Math.max(rowMaxHeight, footprint.heightMm);
  }

  if (!placedAny) {
    throw new PdfGenerationError("Nothing to export — no converted plates were found.");
  }

  return doc;
}

/**
 * Builds the export PDF(s) for the given options. Returns one jsPDF doc per
 * output file: "merge" always returns exactly one; "separate" also returns
 * one combined doc (per-image splitting/zipping is handled by the caller if
 * multiple downloadable files are desired).
 */
export function generatePdf(
  results: ConversionResult[],
  options: ExportOptions,
  _palette: Palette | null
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

  return options.mode === "merge"
    ? generateMerge(selected, options.pageSize)
    : generateSeparate(selected, options.pageSize);
}

/** Triggers a browser download of the generated PDF. */
export function downloadPdf(doc: jsPDF, fileName: string) {
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}
