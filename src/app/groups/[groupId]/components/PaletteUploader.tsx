"use client";

// src/components/PaletteUploader.tsx
// Handles .aco file selection, parsing, error display, and palette preview.
// Logic is unchanged from your working version — only the markup/classes
// were restyled to match the new panel design.

import { useRef, useState } from "react";
import { Palette, UploadCloud } from "lucide-react";
import { parseAco, AcoParseError } from "@/lib/acoParser";
import { useConverterStore } from "@/store/useConverterStore";
import type { Palette as PaletteType } from "@/types";
import { v4 as uuid } from "uuid";
import SectionCard from "@/components/SectionCard";

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
      const newPalette: PaletteType = {
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
    <SectionCard
      icon={Palette}
      title="Color Palette (.aco)"
      right={
        palette && (
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {palette.colors.length}/{palette.colors.length} Active
          </span>
        )
      }
    >
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 py-6 text-center hover:border-red-300"
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
        <UploadCloud className="mb-1 h-5 w-5 text-gray-400" />
        {isLoading ? (
          <span className="text-sm text-gray-500">Parsing palette…</span>
        ) : (
          <>
            <span className="text-sm text-gray-700">
              Drop Adobe .ACO Swatch File{" "}
              <span className="text-gray-400">or click to browse</span>
            </span>
            {palette ? (
              <span className="text-xs uppercase tracking-wide text-gray-400">
                Active: {palette.fileName}
              </span>
            ) : 
            <span className="text-xs uppercase tracking-wide text-gray-400">
              Example: (.ACO)
            </span>}
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 text-xs text-red-600">
          {error}
        </p>
      )}

      {palette && palette.colors.length > 0 && (
        <>
          <div className="my-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-gray-400">
            <span>Index Grid Reference</span>
            <span>Direct Plate Token Mapping</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {palette.colors.slice(0, palette.colors.length ).map((c) => (
              <div
                key={c.index}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5"
              >
                <span
                  className="h-6 w-6 shrink-0 rounded border border-gray-200"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="min-w-0 leading-tight">
                  <div className="text-[11px] font-semibold text-gray-900">
                    #{String(c.index).padStart(2, "0")}
                  </div>
                  <div className="truncate text-[11px] text-gray-500">{c.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* {palette.colors.length > 16 && (
            <p className="mt-2 text-xs text-gray-400">
              +{palette.colors.length - 16} more colors
            </p>
          )} */}

          <button
            onClick={() => clearPalette(groupId)}
            className="mt-3 text-xs text-gray-400 hover:text-red-700"
          >
            Remove palette
          </button>
        </>
      )}
    </SectionCard>
  );
}
