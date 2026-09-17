"use client";

// src/components/PaletteUploader.tsx
// Handles .aco file selection, parsing, error display, and palette preview.

import { useRef, useState } from "react";
import { parseAco, AcoParseError } from "@/lib/acoParser";
import { useConverterStore } from "@/store/useConverterStore";
import type { Palette } from "@/types";
import { v4 as uuid } from "uuid";

export default function PaletteUploader({ groupId }: { groupId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const palette = useConverterStore((s) => s.getGroup(groupId)?.palette ?? null);
  const setPalette = useConverterStore((s) => s.setPalette);
  const clearPalette = useConverterStore((s) => s.clearPalette);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".aco")) {
      setError("Unsupported file type — please select an Adobe .aco swatch file.");
      return;
    }
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const colors = parseAco(buffer);
      const newPalette: Palette = {
        id: uuid(),
        fileName: file.name,
        colors,
        importedAt: new Date().toISOString(),
      };
      setPalette(groupId, newPalette);
    } catch (err) {
      setError(
        err instanceof AcoParseError
          ? err.message
          : "Could not read this .aco file. It may be corrupted or in an unsupported format."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">1. Color Palette (.ACO)</h2>
        {palette && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
            {palette.colors.length}/{palette.colors.length} Active
          </span>
        )}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className="cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 hover:border-red-300"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".aco"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {isLoading ? (
          <span>Parsing palette…</span>
        ) : (
          <>
            <div className="font-medium">Drop Adobe .ACO Swatch File or click to browse</div>
            {palette && (
              <div className="mt-1 text-xs text-gray-400">Active: {palette.fileName}</div>
            )}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {palette && palette.colors.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {palette.colors.slice(0, 16).map((c) => (
              <div key={c.index} className="flex items-center gap-2 rounded border border-gray-100 p-2 text-xs">
                <span
                  className="h-5 w-5 flex-shrink-0 rounded border border-gray-200"
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <div className="font-medium">
                    #{String(c.index).padStart(2, "0")} {c.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {palette.colors.length > 16 && (
            <p className="mt-2 text-xs text-gray-400">
              +{palette.colors.length - 16} more colors
            </p>
          )}
          <button
            onClick={() => clearPalette(groupId)}
            className="mt-3 text-xs text-gray-400 hover:text-red-600"
          >
            Remove palette
          </button>
        </>
      )}
    </section>
  );
}