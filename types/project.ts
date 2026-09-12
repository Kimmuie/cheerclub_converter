export type CellType = "color" | "image" | "empty";

export interface Cell {
  type: CellType;
  color?: string; // hex string, used when type === "color"
  imageId?: string; // used when type === "image" (Phase 2+)
}

export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
}

export interface Project {
  id: string;
  name: string;
  rows: number;
  columns: number;
  grid: Cell[][];
  palette: PaletteColor[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  rows: number;
  columns: number;
  updatedAt: string;
}