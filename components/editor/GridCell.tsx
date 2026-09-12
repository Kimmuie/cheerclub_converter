"use client";

import { memo } from "react";
import { Cell } from "@/types/project";

interface GridCellProps {
  cell: Cell;
  row: number;
  column: number;
  size: number;
  onPaintStart: (row: number, column: number) => void;
  onPaintEnter: (row: number, column: number) => void;
}

function GridCell({
  cell,
  row,
  column,
  size,
  onPaintStart,
  onPaintEnter,
}: GridCellProps) {
  const backgroundColor = cell.type === "color" ? cell.color : undefined;

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onPaintStart(row, column);
      }}
      onMouseEnter={() => onPaintEnter(row, column)}
      style={{
        width: size,
        height: size,
        backgroundColor: backgroundColor ?? "transparent",
      }}
      className="box-border shrink-0 border border-neutral-200 dark:border-neutral-800"
    />
  );
}

export default memo(GridCell);