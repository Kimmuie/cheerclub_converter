"use client";

// src/components/GroupsList.tsx
// Landing page: create, rename, delete, and open workspace groups.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConverterStore } from "@/store/useConverterStore";

export default function GroupsList() {
  const router = useRouter();
  const groups = useConverterStore((s) => s.groups);
  const createGroup = useConverterStore((s) => s.createGroup);
  const renameGroup = useConverterStore((s) => s.renameGroup);
  const deleteGroup = useConverterStore((s) => s.deleteGroup);

  const [newGroupName, setNewGroupName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newGroupName.trim()) return;
    const id = createGroup(newGroupName);
    setNewGroupName("");
    router.push(`/groups/${id}`);
  };

  const startRename = (id: string, current: string) => {
    setEditingId(id);
    setEditingName(current);
  };

  const commitRename = (id: string) => {
    renameGroup(id, editingName);
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspace Groups</h1>
          <p className="text-sm text-gray-500">
            Create a group, then upload a palette and images to start converting.
          </p>
        </div>
      </header>

      <div className="mb-8 flex gap-2">
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New group name"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          aria-label="New group name"
        />
        <button
          onClick={handleCreate}
          disabled={!newGroupName.trim()}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          + New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          No groups yet. Create your first group above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                {editingId === group.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitRename(group.id)}
                    onKeyDown={(e) => e.key === "Enter" && commitRename(group.id)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <button
                    className="text-left text-lg font-semibold hover:underline"
                    onClick={() => startRename(group.id, group.name)}
                    title="Click to rename"
                  >
                    {group.name}
                  </button>
                )}
              </div>

              <div className="mb-4 space-y-1 text-xs text-gray-500">
                <div>
                  {group.palette
                    ? `${group.palette.fileName} (${group.palette.colors.length} swatches)`
                    : "No palette imported"}
                </div>
                <div>{group.images.length} bitmap{group.images.length === 1 ? "" : "s"}</div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Open Group →
                </button>

                {pendingDeleteId === group.id ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span>Delete this group?</span>
                    <button
                      className="font-semibold text-red-600"
                      onClick={() => {
                        deleteGroup(group.id);
                        setPendingDeleteId(null);
                      }}
                    >
                      Yes
                    </button>
                    <button className="text-gray-500" onClick={() => setPendingDeleteId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPendingDeleteId(group.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
