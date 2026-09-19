"use client";

// src/components/GroupCard.tsx
// A single workspace group card: name, hardcoded member count + invite,
// palette summary, bitmap count, and a link into the group workspace.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Palette, Image as ImageIcon, ArrowRight, Trash } from "lucide-react";
import type { Group } from "@/store/useConverterStore";
import Alert from "@/components/Alert";

interface GroupCardProps {
  group: Group;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

// TODO: replace with real membership data once teams/invites are wired up.
const HARDCODED_MEMBER_COUNT = 12;

export default function GroupCard({ group, onRename, onDelete }: GroupCardProps) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const commitRename = () => {
    onRename(group.id, nameDraft);
    setEditingName(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => e.key === "Enter" && commitRename()}
            className="w-full rounded border border-gray-300 px-2 py-1 text-lg font-bold"
          />
        ) : (
          <button
            className="text-left text-lg font-bold text-gray-900 hover:underline"
            onClick={() => setEditingName(true)}
            title="Click to rename"
          >
            {group.name}
          </button>
        )}

        <button
          onClick={() => setConfirmingDelete(true)}
          className="text-xs text-gray-400 hover:text-red-700 cursor-pointer"
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="h-3.5 w-3.5 text-red-800" />
          {HARDCODED_MEMBER_COUNT} Members
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Palette className="h-3.5 w-3.5 text-red-800" />
          {group.palette ? (
            <span>
              {group.palette.fileName}{" "}
              <span className="text-gray-400">
                ({group.palette.colors.length} Swatches)
              </span>
            </span>
          ) : (
            <span>No palette imported</span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <ImageIcon className="h-3.5 w-3.5 text-red-800" />
          {group.images.length} Bitmap{group.images.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="my-3 border-t border-gray-100" />

      <div className="flex items-center justify-between">
        {/* Hardcoded invite action for now — no invite flow yet */}
        <button className="cursor-not-allowed flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/groups/${group.id}`)}
            className="flex items-center gap-1 text-sm font-semibold text-red-700 hover:underline cursor-pointer"
          >
            Open Group
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <Alert
  open={confirmingDelete}
  title="Delete this group?"
  description={`"${group.name}" and its palette/images will be permanently removed.`}
  confirmText="Delete"
  variant="danger"
  onConfirm={() => {
    onDelete(group.id);
    setConfirmingDelete(false);
  }}
  onCancel={() => setConfirmingDelete(false)}
/>
    </div>
  );
}
