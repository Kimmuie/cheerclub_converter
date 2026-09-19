"use client";

// src/components/ConversionPreview.tsx
// Runs conversion for every source image against the loaded palette/plate
// size, shows per-image progress/error state, and previews generated tables
// with navigation between plates.
// Logic is unchanged from your working version — only the markup/classes
// were restyled to match the new panel design.

import { useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { useConverterStore } from "@/store/useConverterStore";
import { convertImage, ConversionError } from "@/lib/conversion";
import type { ConversionResult } from "@/types";
import SectionCard from "@/components/SectionCard";

export default function ConversionPreview({ groupId }: { groupId: string }) {
  const group = useConverterStore((s) => s.getGroup(groupId));
  const setConversionResults = useConverterStore((s) => s.setConversionResults);
  const upsertConversionResult = useConverterStore((s) => s.upsertConversionResult);

  const [isConverting, setIsConverting] = useState(false);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activePlateIndex, setActivePlateIndex] = useState(0);

  const canConvert =
    !!group?.palette && group.palette.colors.length > 0 && (group?.images.length ?? 0) > 0;

  const handleConvertAll = async () => {
    if (!group || !group.palette) return;
    setIsConverting(true);

    // Seed "processing" state immediately so the UI shows progress per image.
    const processingResults: ConversionResult[] = group.images.map((img) => ({
      id: img.id,
      imageId: img.id,
      imageFileName: img.fileName,
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
          imageFileName: image.fileName,
          status: "ready",
          plates,
          totalPlates: plates.length,
        });
      } catch (err) {
        upsertConversionResult(groupId, {
          id: image.id,
          imageId: image.id,
          imageFileName: image.fileName,
          status: "error",
          plates: [],
          totalPlates: 0,
          errorMessage:
            err instanceof ConversionError ? err.message : "Conversion failed unexpectedly.",
        });
      }
    }

    setIsConverting(false);
    if (!activeImageId && group.images[0]) setActiveImageId(group.images[0].id);
  };

  const activeResult = useMemo(
    () => group?.results.find((r) => r.imageId === activeImageId),
    [group, activeImageId]
  );
  const activePlate = activeResult?.plates[activePlateIndex];

  if (!group) return null;

  return (
    <SectionCard
      icon={ListChecks}
      title="Queued Pre-Press Batches"
      right={
        <button
          onClick={handleConvertAll}
          disabled={!canConvert || isConverting}
          className="rounded-md bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-40"
        >
          {isConverting ? "Converting…" : "Convert All Images"}
        </button>
      }
    >
      {!canConvert && (
        <p className="text-xs text-gray-400">
          Import a palette and at least one image to enable conversion.
        </p>
      )}

      {group.results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <ul className="space-y-1">
            {group.results.map((result) => (
              <li key={result.imageId}>
                <button
                  onClick={() => {
                    setActiveImageId(result.imageId);
                    setActivePlateIndex(0);
                  }}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-xs ${
                    activeImageId === result.imageId
                      ? "bg-red-50 font-medium text-red-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{result.imageFileName}</span>
                    <StatusBadge status={result.status} />
                  </div>
                  {result.status === "error" && (
                    <p className="mt-1 text-[11px] text-red-500">{result.errorMessage}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <div>
            {activeResult?.status === "ready" && activePlate ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                  <button
                    onClick={() => setActivePlateIndex((i) => Math.max(0, i - 1))}
                    disabled={activePlateIndex === 0}
                    className="disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <span>
                    Plate {activePlate.label} — {activePlateIndex + 1} / {activeResult.plates.length}
                  </span>
                  <button
                    onClick={() =>
                      setActivePlateIndex((i) => Math.min(activeResult.plates.length - 1, i + 1))
                    }
                    disabled={activePlateIndex === activeResult.plates.length - 1}
                    className="disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>

                <div className="max-h-96 overflow-auto rounded-md border border-gray-200 p-2">
                  <table className="border-collapse text-xs">
                    <tbody>
                      {activePlate.cells.map((row, r) => (
                        <tr key={r}>
                          {row.map((value, c) => {
                            const color = group.palette?.colors.find((pc) => pc.index === value);
                            return (
                              <td
                                key={c}
                                className="h-7 w-7 border border-gray-200 text-center"
                                style={{ backgroundColor: color?.hex ?? "#fff" }}
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
                </div>
              </div>
            ) : activeResult?.status === "processing" ? (
              <p className="text-xs text-gray-400">Converting…</p>
            ) : (
              <p className="text-xs text-gray-400">Select a converted image to preview its plates.</p>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function StatusBadge({ status }: { status: ConversionResult["status"] }) {
  const styles: Record<ConversionResult["status"], string> = {
    idle: "bg-gray-100 text-gray-500",
    processing: "bg-amber-50 text-amber-700",
    ready: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
