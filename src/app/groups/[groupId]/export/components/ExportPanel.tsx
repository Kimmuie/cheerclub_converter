"use client";

// src/components/ExportPanel.tsx
// Lets the user pick which converted images to export, Merge vs Separate
// layout, page size, then generates and downloads the PDF with clear
// progress/success/error feedback.

import { useState } from "react";
import { useConverterStore } from "@/store/useConverterStore";
import { generatePdf, downloadPdf, PdfGenerationError } from "@/lib/pdfGenerator";
import type { ExportStatus } from "@/types";

export default function ExportPanel({ groupId }: { groupId: string }) {
  const group = useConverterStore((s) => s.getGroup(groupId));
  const setExportOptions = useConverterStore((s) => s.setExportOptions);

  const [status, setStatus] = useState<ExportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!group) return null;

  const readyResults = group.results.filter((r) => r.status === "ready");
  const { exportOptions } = group;

  const toggleImage = (imageId: string) => {
    const set = new Set(exportOptions.imageIds);
    set.has(imageId) ? set.delete(imageId) : set.add(imageId);
    setExportOptions(groupId, { imageIds: Array.from(set) });
  };

  const selectAll = () => {
    setExportOptions(groupId, { imageIds: readyResults.map((r) => r.imageId) });
  };

  const handleExport = async () => {
    setStatus("generating");
    setErrorMessage(null);
    try {
      const doc = generatePdf(group.results, exportOptions, group.palette);
      downloadPdf(doc, `${group.name.replace(/\s+/g, "_")}_${exportOptions.mode}`);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof PdfGenerationError ? err.message : "PDF generation failed unexpectedly."
      );
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 font-semibold">5. Export</h2>

      {readyResults.length === 0 ? (
        <p className="text-xs text-gray-400">Convert at least one image before exporting.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-4">
            <fieldset>
              <legend className="mb-1 text-xs uppercase tracking-wide text-gray-500">Mode</legend>
              <div className="flex gap-2">
                {(["merge", "separate"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setExportOptions(groupId, { mode })}
                    className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${
                      exportOptions.mode === mode
                        ? "bg-red-600 text-white"
                        : "border border-gray-300 text-gray-600"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-xs uppercase tracking-wide text-gray-500">
                Page size
              </legend>
              <select
                value={exportOptions.pageSize}
                onChange={(e) =>
                  setExportOptions(groupId, {
                    pageSize: e.target.value as typeof exportOptions.pageSize,
                  })
                }
                className="rounded border border-gray-300 px-2 py-1.5 text-xs"
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
              </select>
            </fieldset>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Images to include
              </span>
              <button onClick={selectAll} className="text-xs text-red-600 hover:underline">
                Select all
              </button>
            </div>
            <ul className="space-y-1">
              {readyResults.map((r) => (
                <li key={r.imageId} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={exportOptions.imageIds.includes(r.imageId)}
                    onChange={() => toggleImage(r.imageId)}
                  />
                  <span>{r.imageFileName}</span>
                  <span className="text-gray-400">({r.totalPlates} plates)</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleExport}
            disabled={exportOptions.imageIds.length === 0 || status === "generating"}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {status === "generating" ? "Generating PDF…" : "Export PDF"}
          </button>

          {status === "success" && (
            <p className="mt-2 text-xs text-green-600">PDF downloaded successfully.</p>
          )}
          {status === "error" && errorMessage && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {errorMessage}
            </p>
          )}
        </>
      )}
    </section>
  );
}
