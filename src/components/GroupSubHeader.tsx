"use client";

// src/components/GroupSubHeader.tsx
// Secondary bar under the navbar: back link, current group name, and
// quick stat badges (matrix size, palette size, bitmap count).

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface GroupSubHeaderProps {
  groupName: string;
  matrixLabel: string; // e.g. "4×5 Matrix"
  paletteLabel: string; // e.g. "16 Index ACO"
  bitmapLabel: string; // e.g. "3 Loaded Bitmaps"
}

export default function GroupSubHeader({
  groupName,
  matrixLabel,
  paletteLabel,
  bitmapLabel,
}: GroupSubHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Groups
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Current Group:
          </span>
          <span className="font-bold text-gray-900">{groupName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {[matrixLabel, paletteLabel, bitmapLabel].map((label) => (
          <span
            key={label}
            className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
