"use client";

// src/components/PlateMatrixForm.tsx
// Row/Column plate size inputs with positive-integer validation.
// Logic is unchanged from your working version — only the markup/classes
// were restyled to match the new panel design.

import { useState } from "react";
import { Grid2x2, Minus, Plus } from "lucide-react";
import { useConverterStore } from "@/store/useConverterStore";
import SectionCard from "@/components/SectionCard";

export default function PlateMatrixForm({ groupId }: { groupId: string }) {
  const plateSize = useConverterStore((s) => s.getGroup(groupId)?.plateSize);
  const setPlateSize = useConverterStore((s) => s.setPlateSize);
  const [error, setError] = useState<string | null>(null);

  if (!plateSize) return null;

  const adjust = (field: "rows" | "columns", delta: number) => {
    const next = plateSize[field] + delta;
    if (next < 1) return;
    setError(null);
    setPlateSize(groupId, { ...plateSize, [field]: next });
  };

  const onDirectChange = (field: "rows" | "columns", value: string) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 1) {
      setError("Rows and columns must be positive whole numbers.");
      return;
    }
    setError(null);
    setPlateSize(groupId, { ...plateSize, [field]: n });
  };

  return (
    <SectionCard icon={Grid2x2} title="Plate Size">
      <div className="flex gap-3">
        {(["rows", "columns"] as const).map((field) => (
          <div key={field} className="flex-1 rounded-lg border border-gray-200 p-3">
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              {field === "rows" ? "Matrix Rows" : "Matrix Columns"}
            </label>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => adjust(field, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                aria-label={`Decrease ${field}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={plateSize[field]}
                onChange={(e) => onDirectChange(field, e.target.value)}
                className="w-12 border-none bg-transparent text-center text-lg font-bold text-gray-900 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => adjust(field, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                aria-label={`Increase ${field}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Example: 4 × 5 means each plate is a 4-row by 5-column dot grid.
      </p>
    </SectionCard>
  );
}
