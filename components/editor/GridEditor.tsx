"use client";

import { useCallback, useRef, useState } from "react";
import { Cell } from "@/types/project";
import GridCell from "./GridCell";

interface GridEditorProps {
  grid: Cell[][];
  onPaintCell: (row: number, column: number) => void;
}

const MIN_CELL_SIZE = 8;
const MAX_CELL_SIZE = 48;
const DEFAULT_CELL_SIZE = 24;
const ROW_LABEL_WIDTH = 40;
const COLUMN_LABEL_HEIGHT = 20;

export default function GridEditor({ grid, onPaintCell }: GridEditorProps) {
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const isPaintingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;

  const paint = useCallback(
    (row: number, column: number) => onPaintCell(row, column),
    [onPaintCell]
  );

  function handlePaintStart(row: number, column: number) {
    isPaintingRef.current = true;
    paint(row, column);
  }

  function handlePaintEnter(row: number, column: number) {
    if (isPaintingRef.current) paint(row, column);
  }

  function handleZoomIn() {
    setCellSize((s) => Math.min(MAX_CELL_SIZE, s + 4));
  }

  function handleZoomOut() {
    setCellSize((s) => Math.max(MIN_CELL_SIZE, s - 4));
  }

  function handleFitToScreen() {
    const container = containerRef.current;
    if (!container || columns === 0) return;
    const available = container.clientWidth - ROW_LABEL_WIDTH;
    const fitSize = Math.floor(available / columns);
    setCellSize(Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, fitSize)));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <button
          onClick={handleZoomOut}
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700"
        >
          −
        </button>
        <span className="w-12 text-center text-xs text-neutral-500">
          {cellSize}px
        </span>
        <button
          onClick={handleZoomIn}
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700"
        >
          +
        </button>
        <button
          onClick={handleFitToScreen}
          className="ml-2 rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
        >
          Fit to screen
        </button>
        <span className="ml-auto text-xs text-neutral-400">
          {rows} × {columns}
        </span>
      </div>

      <div
        ref={containerRef}
        onMouseUp={() => (isPaintingRef.current = false)}
        onMouseLeave={() => (isPaintingRef.current = false)}
        className="relative flex-1 overflow-auto"
      >
        <div className="inline-block min-w-full">
          <div className="sticky top-0 z-10 flex bg-white dark:bg-neutral-950">
            <div
              className="sticky left-0 z-20 shrink-0 bg-white dark:bg-neutral-950"
              style={{ width: ROW_LABEL_WIDTH, height: COLUMN_LABEL_HEIGHT }}
            />
            {Array.from({ length: columns }, (_, c) => (
              <div
                key={c}
                style={{ width: cellSize, height: COLUMN_LABEL_HEIGHT }}
                className="flex shrink-0 items-center justify-center text-[10px] text-neutral-400"
              >
                {c + 1}
              </div>
            ))}
          </div>

          {grid.map((rowCells, r) => (
            <div key={r} className="flex">
              <div
                style={{ width: ROW_LABEL_WIDTH, height: cellSize }}
                className="sticky left-0 z-10 flex shrink-0 items-center justify-center bg-white text-[10px] text-neutral-400 dark:bg-neutral-950"
              >
                {r + 1}
              </div>
              {rowCells.map((cell, c) => (
                <GridCell
                  key={c}
                  cell={cell}
                  row={r}
                  column={c}
                  size={cellSize}
                  onPaintStart={handlePaintStart}
                  onPaintEnter={handlePaintEnter}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}