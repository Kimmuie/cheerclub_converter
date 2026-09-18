"use client";

// src/components/NewGroupModal.tsx
// Popup dialog for creating a new workspace group.

import { useState } from "react";
import { X } from "lucide-react";

interface NewGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function NewGroupModal({ open, onClose, onCreate }: NewGroupModalProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg animate-popUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between ">
          <h2 className="text-lg font-bold text-gray-900">New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-gray-500">
          Group name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="ex. Code76 1:20"
          className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 cursor-pointer"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
