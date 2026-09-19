"use client";
// src/app/page.tsx
// Homepage: navbar + workspace groups list.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useConverterStore } from "@/store/useConverterStore";
import Navbar from "@/components/Navbar";
import License from "@/components/License";
import GroupCard from "./components/GroupCard";
import NewGroupModal from "./components/NewGroupModal";

export default function HomePage() {
  const router = useRouter();
  const groups = useConverterStore((s) => s.groups);
  const createGroup = useConverterStore((s) => s.createGroup);
  const renameGroup = useConverterStore((s) => s.renameGroup);
  const deleteGroup = useConverterStore((s) => s.deleteGroup);

  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = (name: string) => {
    const id = createGroup(name);
    setModalOpen(false);
    // router.push(`/groups/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
    <main className="flex-1 bg-gray-50">
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace Groups</h1>
          <p className="text-sm text-gray-500">
            Manage stadium stunt display groups, member permissions, assigned
            color swatches, and bitmap imagery.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="cursor-pointer flex shrink-0 items-center gap-1.5 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          <Plus className="h-4 w-4" />
          New Group
        </button>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          No groups yet. Create your first group above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onRename={renameGroup}
              onDelete={deleteGroup}
            />
          ))}
        </div>
      )}

      <NewGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
    </main>
    <License />
    </div>
  );
}