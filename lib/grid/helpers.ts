import { Cell } from "@/types/project";

export function createEmptyCell(): Cell {
  return { type: "empty" };
}

export function createEmptyGrid(rows: number, columns: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => createEmptyCell())
  );
}

/**
 * Resize a grid to new dimensions.
 * Existing cells are kept where they still fit; new cells are empty.
 * (Not wired into the UI yet — resizing an existing project comes in a later phase.)
 */
export function resizeGrid(
  grid: Cell[][],
  newRows: number,
  newColumns: number
): Cell[][] {
  const result: Cell[][] = [];
  for (let r = 0; r < newRows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < newColumns; c++) {
      const existing = grid[r]?.[c];
      row.push(existing ? { ...existing } : createEmptyCell());
    }
    result.push(row);
  }
  return result;
}