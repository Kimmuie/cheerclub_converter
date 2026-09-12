"use client";

import { useState } from "react";
import { PaletteColor } from "@/types/project";
import { generateId } from "@/lib/utils/id";

interface PalettePanelProps {
  palette: PaletteColor[];
  activeColorId: string | null;
  onSelectColor: (id: string) => void;
  onAddColor: (color: PaletteColor) => void;
  onDeleteColor: (id: string) => void;
}

const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export default function PalettePanel({
  palette,
  activeColorId,
  onSelectColor,
  onAddColor,
  onDeleteColor,
}: PalettePanelProps) {
  const [hexInput, setHexInput] = useState("#000000");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!HEX_REGEX.test(hexInput)) {
      setError("Enter a valid hex color, e.g. #FF0000.");
      return;
    }
    setError(null);
    onAddColor({
      id: generateId(),
      name: nameInput.trim() || hexInput.toUpperCase(),
      hex: hexInput,
    });
    setNameInput("");
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Palette
      </h2>

      <div className="flex flex-col gap-2">
        {palette.map((color) => (
          <div
            key={color.id}
            className={`flex items-center gap-2 rounded border px-2 py-1 ${
              activeColorId === color.id
                ? "border-neutral-900 dark:border-neutral-100"
                : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            <button
              onClick={() => onSelectColor(color.id)}
              className="h-6 w-6 shrink-0 rounded border border-neutral-300 dark:border-neutral-700"
              style={{ backgroundColor: color.hex }}
              title={color.hex}
            />
            <button
              onClick={() => onSelectColor(color.id)}
              className="flex-1 truncate text-left text-sm text-neutral-800 dark:text-neutral-200"
            >
              {color.name}
            </button>
            <button
              onClick={() => onDeleteColor(color.id)}
              className="text-xs text-neutral-400 hover:text-red-600"
              title="Delete color"
            >
              ✕
            </button>
          </div>
        ))}
        {palette.length === 0 && (
          <p className="text-xs text-neutral-400">No colors yet.</p>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={
              /^#([0-9a-fA-F]{6})$/.test(hexInput) ? hexInput : "#000000"
            }
            onChange={(e) => setHexInput(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700"
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="#FF0000"
            className="w-24 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Color name (optional)"
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          onClick={handleAdd}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Add color
        </button>
      </div>
    </div>
  );
}