"use client";

// src/components/PreviewPane.tsx (or your local components/ folder)
//
// Changes from the last version:
//  1. colorMode now defaults to "outline" instead of "color".
//  2. Merge/"Compact Matrix" mode is now locked to A4 — no more cycle
//     button. If exportOptions.pageSize is ever something else while in
//     merge mode, an effect snaps it back to "A4".
//  3. Separate mode pagination was wrong: it was slicing the raw `plates`
//     array in whatever order convertImage returned it, which doesn't
//     necessarily match reading order. It now parses every plate's real
//     label into {row, column} (row = leading letters, column = trailing
//     digits — same convention as before), builds the true set of rows and
//     columns present, and pages through in fixed-size COLUMN windows while
//     showing every row each page. So page 1 = A1-A5, B1-B5, ... F1-F5 and
//     page 2 = A6-A10, B6-B10, ... F6-F10, matching real reading order
//     instead of array order.

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, FileText, Palette as PaletteIcon, RefreshCw, Square } from "lucide-react";
import { useConverterStore } from "@/store/useConverterStore";
import { convertImage, ConversionError } from "@/lib/conversion";
import type { ConversionResult, Palette } from "@/types";
import { SHEET_TABLE_COLUMNS } from "./SheetMetricsPanel";

interface PreviewPaneProps {
  groupId: string;
}

type ColorMode = "color" | "outline";

// Splits a plate label like "A4" into its leading letters (row) and
// trailing digits (column) — letters = row, digits = column.
function splitLabel(label: string) {
  const row = label.match(/^[A-Za-z]+/)?.[0] ?? label;
  const column = Number(label.match(/\d+$/)?.[0] ?? "0");
  return { row, column };
}

function MiniPlateTable({
  cells,
  palette,
  colorMode,
}: {
  cells: number[][];
  palette: Palette | null;
  colorMode: ColorMode;
}) {
  return (
    <table className="border-collapse">
      <tbody>
        {cells.map((row, r) => (
          <tr key={r}>
            {row.map((value, c) => {
              const color = palette?.colors.find((pc) => pc.index === value);
              const style =
                colorMode === "color"
                  ? { backgroundColor: color?.hex ?? "#fff" }
                  : { backgroundColor: "transparent" };
              return (
                <td
                  key={c}
                  className={`h-5 w-5 text-center text-[9px] leading-none ${
                    colorMode === "outline"
                      ? "border border-black text-black"
                      : "border border-gray-200"
                  }`}
                  style={style}
                  title={color ? `${color.index} ${color.name}` : "blank"}
                >
                  {value > 0 ? value : ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const STATUS_STYLES: Record<ConversionResult["status"], string> = {
  idle: "bg-gray-100 text-gray-500",
  processing: "bg-amber-50 text-amber-700",
  ready: "bg-green-50 text-green-700",
  error: "bg-red-50 text-red-700",
};

export default function PreviewPane({ groupId }: PreviewPaneProps) {
  const group = useConverterStore((s) => s.getGroup(groupId));
  const setConversionResults = useConverterStore((s) => s.setConversionResults);
  const upsertConversionResult = useConverterStore((s) => s.upsertConversionResult);
  const setExportOptions = useConverterStore((s) => s.setExportOptions);

  const [isConverting, setIsConverting] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("outline");
  const [mergeSheetIndex, setMergeSheetIndex] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [separateSheetIndex, setSeparateSheetIndex] = useState(0);

  const results = group?.results ?? [];
  const readyResults = useMemo(
    () => results.filter((r) => r.status === "ready"),
    [results]
  );

  const canConvert =
    !!group?.palette && group.palette.colors.length > 0 && (group?.images.length ?? 0) > 0;

  const mode = group?.exportOptions.mode;
  const pageSize = group?.exportOptions.pageSize;

  // Compact Matrix is always A4 — snap it back if it's ever anything else.
  useEffect(() => {
    if (group && mode === "merge" && pageSize !== "A4") {
      setExportOptions(groupId, { pageSize: "A4" });
    }
  }, [group, mode, pageSize, groupId, setExportOptions]);

  const handleConvertAll = async () => {
    if (!group || !group.palette) return;
    setIsConverting(true);

    const processingResults: ConversionResult[] = group.images.map((img) => ({
      id: img.id,
      imageId: img.id,
      imageFileName: img.name ?? img.fileName,
      status: "processing",
      plates: [],
      totalPlates: 0,
    }));
    setConversionResults(groupId, processingResults);

    for (const image of group.images) {
      try {
        const plates = await convertImage(image, group.palette, group.plateSize);
        upsertConversionResult(groupId, {
          id: image.id,
          imageId: image.id,
          imageFileName: image.name ?? image.fileName,
          status: "ready",
          plates,
          totalPlates: plates.length,
        });
      } catch (err) {
        upsertConversionResult(groupId, {
          id: image.id,
          imageId: image.id,
          imageFileName: image.name ?? image.fileName,
          status: "error",
          plates: [],
          totalPlates: 0,
          errorMessage:
            err instanceof ConversionError ? err.message : "Conversion failed unexpectedly.",
        });
      }
    }

    setIsConverting(false);
  };

  const mergeSheetCount = useMemo(
    () => Math.max(0, ...readyResults.map((r) => r.totalPlates)),
    [readyResults]
  );

  const selectedResult =
    readyResults.find((r) => r.imageId === selectedImageId) ?? readyResults[0] ?? null;

  // Parse every plate's real label into {row, column} once per selected image.
  const platesWithPosition = useMemo(() => {
    if (!selectedResult) return [];
    return selectedResult.plates.map((plate) => {
      const { row, column } = splitLabel(plate.label);
      return { plate, row, column };
    });
  }, [selectedResult]);

  const uniqueRows = useMemo(() => {
    const set = new Set(platesWithPosition.map((p) => p.row));
    return Array.from(set).sort();
  }, [platesWithPosition]);

  const uniqueColumns = useMemo(() => {
    const set = new Set(platesWithPosition.map((p) => p.column));
    return Array.from(set).sort((a, b) => a - b);
  }, [platesWithPosition]);

  const separateSheetCount = Math.max(
    1,
    Math.ceil(uniqueColumns.length / SHEET_TABLE_COLUMNS)
  );

  const columnsThisPage = uniqueColumns.slice(
    separateSheetIndex * SHEET_TABLE_COLUMNS,
    separateSheetIndex * SHEET_TABLE_COLUMNS + SHEET_TABLE_COLUMNS
  );

  // Row-major, column-window order: every row for the current column slice,
  // e.g. A1-A5, B1-B5, ... on page 1, then A6-A10, B6-B10, ... on page 2.
  const separatePagePlates = useMemo(() => {
    const list: typeof platesWithPosition = [];
    for (const row of uniqueRows) {
      for (const col of columnsThisPage) {
        const found = platesWithPosition.find((p) => p.row === row && p.column === col);
        if (found) list.push(found);
      }
    }
    return list;
  }, [uniqueRows, columnsThisPage, platesWithPosition]);

  if (!group) return null;

  const palette = group.palette;

  const batchId = `CHR-${groupId.slice(0, 8).toUpperCase()}`;

  const currentMergeLabel = readyResults[0]?.plates[mergeSheetIndex]?.label ?? null;
  const currentMergeSplit = currentMergeLabel ? splitLabel(currentMergeLabel) : null;

  const convertButton = (
    <button
      onClick={handleConvertAll}
      disabled={!canConvert || isConverting}
      className="flex items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-40"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isConverting ? "animate-spin" : ""}`} />
      {isConverting
        ? "Converting…"
        : results.length > 0
          ? "Re-convert All"
          : "Convert All Images"}
    </button>
  );

  const colorToggleButton = (
    <button
      onClick={() => setColorMode((m) => (m === "color" ? "outline" : "color"))}
      className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      title="Toggle between colored fills and a transparent black-grid outline"
    >
      {colorMode === "color" ? (
        <>
          <PaletteIcon className="h-3.5 w-3.5" />
          Color
        </>
      ) : (
        <>
          <Square className="h-3.5 w-3.5" />
          Outline
        </>
      )}
    </button>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-700" />
          <h2 className="text-sm font-bold text-gray-900">Preview</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {convertButton}
          {colorToggleButton}

          {readyResults.length > 0 &&
            (mode === "merge" ? (
              <>
                <SheetNav
                  index={mergeSheetIndex}
                  count={mergeSheetCount}
                  onPrev={() => setMergeSheetIndex((i) => Math.max(0, i - 1))}
                  onNext={() =>
                    setMergeSheetIndex((i) => Math.min(mergeSheetCount - 1, i + 1))
                  }
                />
                <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-400">
                  Page: A4
                </span>
              </>
            ) : (
              <>
                <SheetNav
                  index={separateSheetIndex}
                  count={separateSheetCount}
                  onPrev={() => setSeparateSheetIndex((i) => Math.max(0, i - 1))}
                  onNext={() =>
                    setSeparateSheetIndex((i) => Math.min(separateSheetCount - 1, i + 1))
                  }
                />
                <select
                  value={selectedResult?.imageId ?? ""}
                  onChange={(e) => {
                    setSelectedImageId(e.target.value);
                    setSeparateSheetIndex(0);
                  }}
                  className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  {readyResults.map((r) => (
                    <option key={r.imageId} value={r.imageId}>
                      {r.imageFileName}
                    </option>
                  ))}
                </select>
              </>
            ))}
        </div>
      </div>

      {!canConvert && (
        <p className="mb-4 text-xs text-gray-400">
          Import a palette and at least one image (on the Upload &amp; Palette page)
          to enable conversion.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {results.map((r) => (
            <li key={r.imageId} className="flex items-center gap-1.5 text-xs">
              <span className="max-w-[10rem] truncate text-gray-500">{r.imageFileName}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[r.status]}`}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {readyResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 p-12 text-center">
          <FileText className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">
            {results.length > 0
              ? "No plates are ready yet — fix any errors above and re-convert."
              : "No preview yet — convert your images to see the print sheets here."}
          </p>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg bg-gray-50 p-6">
          <div
            className={
              mode === "merge"
                ? "mx-auto max-w-full bg-white p-8 shadow-sm"
                : "mx-auto min-h-[600px] w-fit max-w-full bg-white p-8 shadow-sm"
            }
            style={
              mode === "merge"
                ? { width: 595, aspectRatio: "210 / 297" }
                : undefined
            }
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
              CheerClub Generator
            </p>

            {mode === "merge" ? (
              <>
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {currentMergeLabel ?? "—"}
                    </h3>
                    {currentMergeSplit && (
                      <p className="text-xs text-gray-400">
                        Row {currentMergeSplit.row} · Column {currentMergeSplit.column}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-8">
                  {readyResults.map((result) => {
                    const cells = result.plates[mergeSheetIndex]?.cells;
                    return (
                      <div key={result.imageId}>
                        <div className="mb-1 text-[11px] font-semibold text-gray-700">
                          {result.imageFileName}
                        </div>
                        {cells ? (
                          <MiniPlateTable cells={cells} palette={palette} colorMode={colorMode} />
                        ) : (
                          <div className="text-[10px] text-gray-300">No plate at this sheet</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              selectedResult && (
                <>
                  <div className="mb-1 flex items-center justify-between gap-4">
                    <h3 className="text-sm font-bold text-gray-900">
                      {selectedResult.imageFileName} · Dense Pack
                    </h3>
                    <span className="whitespace-nowrap rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500">
                      Batch ID: {batchId}
                    </span>
                  </div>
                  <p className="mb-4 text-[10px] uppercase tracking-wide text-gray-400">
                    Sheet {String(separateSheetIndex + 1).padStart(2, "0")} (
                    {separatePagePlates.length} Tables)
                  </p>

                  <div
                    className="grid gap-x-8 gap-y-4"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(columnsThisPage.length, 1)}, max-content)`,
                    }}
                  >
                    {separatePagePlates.map(({ plate }, i) => (
                      <div key={plate.label ?? i}>
                        <div className="mb-1 text-[10px] font-semibold text-gray-600">
                          Plate {plate.label}
                        </div>
                        <MiniPlateTable
                          cells={plate.cells}
                          palette={palette}
                          colorMode={colorMode}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SheetNav({
  index,
  count,
  onPrev,
  onNext,
}: {
  index: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <button onClick={onPrev} disabled={index === 0} className="disabled:opacity-30">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span>
        Sheet {count === 0 ? 0 : index + 1} / {count}
      </span>
      <button onClick={onNext} disabled={index >= count - 1} className="disabled:opacity-30">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
} 