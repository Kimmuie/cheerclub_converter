"use client";

import { useState } from "react";

interface CreateProjectDialogProps {
  onCreate: (name: string, rows: number, columns: number) => void;
  onClose: () => void;
}

export default function CreateProjectDialog({
  onCreate,
  onClose,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState(20);
  const [columns, setColumns] = useState(30);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a project name.");
      return;
    }
    if (rows < 1 || columns < 1) {
      setError("Rows and columns must be at least 1.");
      return;
    }
    if (rows > 500 || columns > 500) {
      setError("Rows and columns must be 500 or fewer.");
      return;
    }

    onCreate(trimmedName, rows, columns);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          New Project
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="project-name"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TU Sports Day"
              className="rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor="project-rows"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Rows
              </label>
              <input
                id="project-rows"
                type="number"
                min={1}
                max={500}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor="project-columns"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Columns
              </label>
              <input
                id="project-columns"
                type="number"
                min={1}
                max={500}
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                className="rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}