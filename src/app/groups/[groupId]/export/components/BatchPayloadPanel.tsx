"use client";

// src/components/BatchPayloadPanel.tsx
// CHANGED: no longer filters by exportOptions.imageIds. That list was only
// ever populated by a useEffect on the page component — if that effect
// wasn't wired up (or hadn't run yet), imageIds stayed empty, selectedResults
// was empty, and both buttons sat disabled. Since there's no per-image
// checkbox UI in this design anyway, this panel now always targets every
// ready result directly — no external sync required for it to work.

import { useState } from "react";
import { Download, FileArchive } from "lucide-react";
import { generatePdf, PdfGenerationError, downloadPdf } from "@/lib/pdfGenerator";
import type { ConversionResult, ExportOptions, Palette, ExportStatus } from "@/types";

interface BatchPayloadPanelProps {
  groupName: string;
  readyResults: ConversionResult[];
  exportOptions: ExportOptions;
  palette: Palette | null;
  groupId: string;
}

export default function BatchPayloadPanel({
  groupName,
  readyResults,
  exportOptions,
  palette,
  groupId,
}: BatchPayloadPanelProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [zipStatus, setZipStatus] = useState<ExportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Always all ready results — see note above.
  const selectedResults = readyResults;

  // generatePdf validates internally against exportOptions.imageIds, not
  // just the results array — so build it fresh from selectedResults every
  // time instead of trusting whatever's already in the store.
  const exportOptionsForCall = {
    ...exportOptions,
    imageIds: selectedResults.map((r) => r.imageId),
  };

  const handleDownloadPage = async () => {
    setStatus("generating");
    setErrorMessage(null);
    try {
      const doc = generatePdf(selectedResults, exportOptionsForCall, palette, groupId);
      downloadPdf(doc, `${groupName.replace(/\s+/g, "_")}_${exportOptions.mode}`);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof PdfGenerationError ? err.message : "PDF generation failed unexpectedly."
      );
      // Surface the real error in dev tools too, since PdfGenerationError
      // is the only error type this UI can label — anything else just says
      // "failed unexpectedly", so check the console for the actual cause.
      console.error("generatePdf/downloadPdf failed:", err);
    }
  };

  const handleDownloadZip = async () => {
    setZipStatus("generating");
    setErrorMessage(null);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      for (const result of selectedResults) {
        const doc = generatePdf([result], { ...exportOptions, imageIds: [result.imageId] }, palette, groupId);
        // Assumes a jsPDF-compatible doc — adjust if generatePdf returns
        // something else (e.g. doc.output("arraybuffer") or a raw Buffer).
        const blob: Blob = doc.output("blob");
        zip.file(`${result.imageFileName.replace(/\.[^./]+$/, "")}.pdf`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${groupName.replace(/\s+/g, "_")}_all_pages.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setZipStatus("success");
    } catch (err) {
      setZipStatus("error");
      setErrorMessage(
        err instanceof PdfGenerationError ? err.message : "ZIP generation failed unexpectedly."
      );
      console.error("ZIP export failed:", err);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-900">
          Batch Payload
        </h2>
        <span className="text-xs font-semibold text-red-700">
          {selectedResults.length} PDF Documents
        </span>
      </div>

      <button
        onClick={handleDownloadPage}
        disabled={selectedResults.length === 0 || status === "generating"}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Download className="h-4 w-4" />
        {status === "generating" ? "Generating PDF…" : "Download (PDF)"}
      </button>

      <button
        onClick={handleDownloadZip}
        disabled={0 === 0}
        // disabled={selectedResults.length === 0 || zipStatus === "generating"}
        className="disabled:opacity-40 disabled:cursor-not-allowed flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-3 text-sm font-bold text-white hover:bg-black cursor-pointer"
      >
        <FileArchive className="h-4 w-4" />
        {zipStatus === "generating"
          ? "Zipping…"
          : `Download All Pages as ZIP (${selectedResults.length} Files)`}
      </button>

      {(status === "success" || zipStatus === "success") && (
        <p className="mt-2 text-xs text-green-600">Download complete.</p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}