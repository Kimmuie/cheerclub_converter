"use client";

import { useState } from "react";
import { ProjectSummary } from "@/types/project";

interface ProjectCardProps {
  project: ProjectSummary;
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function ProjectCard({
  project,
  onOpen,
  onRename,
  onDelete,
}: ProjectCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (trimmed) {
      onRename(project.id, trimmed);
    }
    setIsRenaming(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600">
      {isRenaming ? (
        <form onSubmit={handleRenameSubmit} className="flex gap-2">
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleRenameSubmit}
            className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </form>
      ) : (
        <button
          onClick={() => onOpen(project.id)}
          className="text-left text-base font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
        >
          {project.name}
        </button>
      )}

      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {project.rows} rows × {project.columns} columns
      </p>

      <div className="flex gap-3 text-sm">
        <button
          onClick={() => onOpen(project.id)}
          className="text-neutral-700 hover:underline dark:text-neutral-300"
        >
          Open
        </button>
        <button
          onClick={() => setIsRenaming(true)}
          className="text-neutral-700 hover:underline dark:text-neutral-300"
        >
          Rename
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
              onDelete(project.id);
            }
          }}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}