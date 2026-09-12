import { Project, ProjectSummary } from "@/types/project";
import { createEmptyGrid } from "@/lib/grid/helpers";
import { generateId } from "@/lib/utils/id";

const STORAGE_KEY = "cheerclub-converter:projects:v1";

type ProjectStore = Record<string, Project>;

function readStore(): ProjectStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProjectStore;
  } catch (error) {
    console.error("Failed to read projects from localStorage:", error);
    return {};
  }
}

function writeStore(store: ProjectStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Failed to save projects to localStorage:", error);
  }
}

export function listProjects(): ProjectSummary[] {
  const store = readStore();
  return Object.values(store)
    .map(({ id, name, rows, columns, updatedAt }) => ({
      id,
      name,
      rows,
      columns,
      updatedAt,
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getProject(id: string): Project | null {
  const store = readStore();
  return store[id] ?? null;
}

export function createProject(
  name: string,
  rows: number,
  columns: number
): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    name,
    rows,
    columns,
    grid: createEmptyGrid(rows, columns),
    palette: [
      { id: generateId(), name: "Red", hex: "#e53935" },
      { id: generateId(), name: "Blue", hex: "#1e88e5" },
      { id: generateId(), name: "Yellow", hex: "#fdd835" },
      { id: generateId(), name: "White", hex: "#ffffff" },
      { id: generateId(), name: "Black", hex: "#000000" },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const store = readStore();
  store[project.id] = project;
  writeStore(store);

  return project;
}

export function saveProject(project: Project): void {
  const store = readStore();
  store[project.id] = { ...project, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function renameProject(id: string, name: string): void {
  const store = readStore();
  const project = store[id];
  if (!project) return;
  store[id] = { ...project, name, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function deleteProject(id: string): void {
  const store = readStore();
  delete store[id];
  writeStore(store);
}