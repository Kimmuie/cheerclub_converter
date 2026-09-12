"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectSummary } from "@/types/project";
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
} from "@/lib/storage/projects";
import ProjectCard from "./ProjectCard";
import CreateProjectDialog from "./CreateProjectDialog";

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProjects(listProjects());
    setIsLoaded(true);
  }, []);

  function refresh() {
    setProjects(listProjects());
  }

  function handleCreate(name: string, rows: number, columns: number) {
    const project = createProject(name, rows, columns);
    setIsDialogOpen(false);
    router.push(`/projects/${project.id}`);
  }

  function handleRename(id: string, name: string) {
    renameProject(id, name);
    refresh();
  }

  function handleDelete(id: string) {
    deleteProject(id);
    refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Formation Projects
        </h1>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          + New Project
        </button>
      </div>

      {!isLoaded ? (
        <p className="text-neutral-500 dark:text-neutral-400">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          No projects yet. Create one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={(id) => router.push(`/projects/${id}`)}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isDialogOpen && (
        <CreateProjectDialog
          onCreate={handleCreate}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}