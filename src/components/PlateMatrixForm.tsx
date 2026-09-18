"use client";

// src/components/PlateMatrixForm.tsx
// Row/Column plate size inputs with positive-integer validation.

import { useState } from "react";
import { useConverterStore } from "@/store/useConverterStore";

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
    <section className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 font-semibold">3. Plate Size</h2>
      <div className="grid grid-cols-2 gap-4">
        {(["rows", "columns"] as const).map((field) => (
          <div key={field}>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
              {field}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjust(field, -1)}
                className="h-8 w-8 rounded border border-gray-300 text-sm"
                aria-label={`Decrease ${field}`}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={plateSize[field]}
                onChange={(e) => onDirectChange(field, e.target.value)}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
              />
              <button
                type="button"
                onClick={() => adjust(field, 1)}
                className="h-8 w-8 rounded border border-gray-300 text-sm"
                aria-label={`Increase ${field}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-400">
        Example: 4 × 5 means each plate is a 4-row by 5-column dot grid.
      </p>
    </section>
  );
}
