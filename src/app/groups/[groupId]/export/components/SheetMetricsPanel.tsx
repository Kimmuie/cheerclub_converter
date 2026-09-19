"use client";

// src/components/SheetMetricsPanel.tsx
// Read-only summary of the current page size, sheet imposition, plate grid,
// and color indexing — all derived from real store data. The only bit that
// isn't in your store yet is the sheet imposition capacity (how many plate
// tables fit per printed sheet); that's a fixed layout constant, not a
// per-group setting, so it's defined once below rather than guessed per call.

import type { ExportOptions, PlateSize } from "@/types";

// Fixed print-sheet capacity: 5 tables across, 6 rows down = 30 per sheet.
// Adjust here if your actual print layout differs.
export const SHEET_TABLE_COLUMNS = 5;
export const SHEET_TABLE_ROWS = 6;
export const TABLES_PER_SHEET = SHEET_TABLE_COLUMNS * SHEET_TABLE_ROWS;

const PAGE_DIMENSIONS: Record<ExportOptions["pageSize"], string> = {
  A4: "210 × 297 mm",
  A3: "297 × 420 mm",
  Letter: "216 × 279 mm",
};

interface SheetMetricsPanelProps {
  pageSize: ExportOptions["pageSize"];
  plateSize?: PlateSize;
  paletteColorCount: number;
}

function MetricBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}

export default function SheetMetricsPanel({
  pageSize,
  plateSize,
  paletteColorCount,
}: SheetMetricsPanelProps) {
  const cellCount = plateSize ? plateSize.rows * plateSize.columns : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-900">
        Sheet &amp; Plate Metrics
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <MetricBox
          label="Sheet Format"
          value={`${pageSize} Portrait`}
          sub={PAGE_DIMENSIONS[pageSize]}
        />
        <MetricBox
          label="Sheet Imposition"
          value={`${SHEET_TABLE_COLUMNS} × ${SHEET_TABLE_ROWS} Tables`}
          sub={`${TABLES_PER_SHEET} Tables / Sheet`}
        />
        <MetricBox
          label="Table Grid"
          value={plateSize ? `${plateSize.rows} × ${plateSize.columns} Cells` : "Not set"}
          sub={`${cellCount} Dots / Table`}
        />
        <MetricBox
          label="Numeric Color"
          value="Zero Fill (B&W)"
          sub={`Indices 1–${paletteColorCount}`}
        />
      </div>
    </div>
  );
}
