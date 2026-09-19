"use client";

// src/components/LayoutArchitecturePanel.tsx
// Lets the user pick Merge ("Compact Matrix") vs Separate ("Separate Each")
// export layout. Wired directly to the same exportOptions.mode your working
// ExportPanel already reads/writes — no new store logic needed.

import { Layers } from "lucide-react";
import { useConverterStore } from "@/store/useConverterStore";
import type { ExportOptions } from "@/types";

interface LayoutArchitecturePanelProps {
  groupId: string;
  mode: ExportOptions["mode"];
}

const MODES: {
  value: ExportOptions["mode"];
  title: string;
  description: string;
}[] = [
  {
    value: "merge",
    title: "Compact Matrix",
    description: "Synchronized coordinate per sheet across all source files.",
  },
  {
    value: "separate",
    title: "Seperate Each",
    description:
      "Dense multi-grid sequence per single graphic asset. Outputs independent plate booklets for each upload.",
  },
];

export default function LayoutArchitecturePanel({
  groupId,
  mode,
}: LayoutArchitecturePanelProps) {
  const setExportOptions = useConverterStore((s) => s.setExportOptions);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Layout Architecture</h2>
        <span className="rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
          Active Mode
        </span>
      </div>

      <div className="space-y-3">
        {MODES.map((m) => {
          const active = mode === m.value;
          return (
            <button
              key={m.value}
              onClick={() => setExportOptions(groupId, { mode: m.value })}
              className={`w-full rounded-lg border p-4 text-left cursor-pointer ${
                active
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`text-sm font-bold ${
                    active ? "text-red-700" : "text-gray-900"
                  }`}
                >
                  {m.title}
                </span>
                <Layers
                  className={`h-4 w-4 ${active ? "text-red-700" : "text-gray-300"}`}
                />
              </div>
              <p
                className={`text-xs leading-snug ${
                  active ? "text-red-700/80" : "text-gray-400"
                }`}
              >
                {m.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
