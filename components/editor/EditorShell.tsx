"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cell, PaletteColor, Project } from "@/types/project";
import { getProject, saveProject } from "@/lib/storage/projects";
import Toolbar from "./Toolbar";
import PalettePanel from "./PalettePanel";
import GridEditor from "./GridEditor";

interface EditorShellProps {
  projectId: string;
}

const SAVE_DELAY_MS = 500;

export default function EditorShell({ projectId }: EditorShellProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [activeColorId, setActiveColorId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = getProject(projectId);
    if (!loaded) {
      setNotFound(true);
      return;
    }
    setProject(loaded);
    setActiveColorId(loaded.palette[0]?.id ?? null);
  }, [projectId]);

  const scheduleSave = useCallback((next: Project) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveProject(next);
      setIsSaving(false);
    }, SAVE_DELAY_MS);
  }, []);

  function updateProject(updater: (prev: Project) => Project) {
    setProject((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  const activeColor: PaletteColor | null =
    project?.palette.find((c) => c.id === activeColorId) ?? null;

  const handlePaintCell = useCallback(
    (row: number, column: number) => {
      updateProject((prev) => {
        const current = prev.grid[row][column];
        const nextCell: Cell =
          tool === "eraser"
            ? { type: "empty" }
            : activeColor
            ? { type: "color", color: activeColor.hex }
            : current;

        if (current.type === nextCell.type && current.color === nextCell.color) {
          return prev;
        }

        const grid = prev.grid.map((r, ri) =>
          ri === row
            ? r.map((cell, ci) => (ci === column ? nextCell : cell))
            : r
        );
        return { ...prev, grid };
      });
    },
    [tool, activeColor]
  );

  function handleAddColor(color: PaletteColor) {
    updateProject((prev) => ({
      ...prev,
      palette: [...prev.palette, color],
    }));
    setActiveColorId(color.id);
  }

  function handleDeleteColor(id: string) {
    updateProject((prev) => ({
      ...prev,
      palette: prev.palette.filter((c) => c.id !== id),
    }));
    if (activeColorId === id) setActiveColorId(null);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "b" || e.key === "B") setTool("brush");
      if (e.key === "e" || e.key === "E") setTool("eraser");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-neutral-600 dark:text-neutral-400">
          Project not found.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-neutral-900 underline dark:text-neutral-100"
        >
          Back to projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-neutral-500 dark:text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        projectName={project.name}
        tool={tool}
        onToolChange={setTool}
        isSaving={isSaving}
        onBack={() => router.push("/")}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-neutral-200 p-4 dark:border-neutral-800">
          <PalettePanel
            palette={project.palette}
            activeColorId={activeColorId}
            onSelectColor={setActiveColorId}
            onAddColor={handleAddColor}
            onDeleteColor={handleDeleteColor}
          />
        </aside>
        <main className="flex-1 overflow-hidden">
          <GridEditor grid={project.grid} onPaintCell={handlePaintCell} />
        </main>
      </div>
    </div>
  );
}