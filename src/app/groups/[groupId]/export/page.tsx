"use client";

// src/app/groups/[groupId]/preview/page.tsx
import { useParams, useRouter } from "next/navigation";
import { useConverterStore } from "@/store/useConverterStore";
import ConversionPreview from "./components/ConversionPreview";
import ExportPanel from "./components/ExportPanel";

export default function GroupExportPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const group = useConverterStore((s) => s.getGroup(params.groupId));

  if (!group) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-gray-500">
          This group no longer exists.{" "}
          <button onClick={() => router.push("/")} className="text-red-600 underline">
            Back to Groups
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <button
          onClick={() => router.push(`/groups/${group.id}`)}
          className="mb-1 text-xs text-gray-400"
        >
          ← Back to {group.name}
        </button>
        <h1 className="text-2xl font-bold">Preview & Export</h1>
      </header>

      <div className="space-y-6">
        <ConversionPreview groupId={group.id} />
        <ExportPanel groupId={group.id} />
      </div>
    </div>
  );
}
