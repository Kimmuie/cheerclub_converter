"use client";

// src/app/groups/[groupId]/page.tsx
import { useParams, useRouter } from "next/navigation";
import { useConverterStore } from "@/store/useConverterStore";
import PaletteUploader from "@/components/PaletteUploader";
import ImageUploader from "@/components/ImageUploader";
import PlateMatrixForm from "@/components/PlateMatrixForm";
import ConversionPreview from "@/components/ConversionPreview";

export default function GroupWorkspacePage() {
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
      <header className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/")} className="mb-1 text-xs text-gray-400">
            ← Back to Groups
          </button>
          <h1 className="text-2xl font-bold">{group.name}</h1>
        </div>
        <button
          onClick={() => router.push(`/groups/${group.id}/preview`)}
          disabled={group.results.filter((r) => r.status === "ready").length === 0}
          className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-40"
        >
          Export PDF →
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <PaletteUploader groupId={group.id} />
          <PlateMatrixForm groupId={group.id} />
        </div>
        <ImageUploader groupId={group.id} />
      </div>

      <div className="mt-6">
        <ConversionPreview groupId={group.id} />
      </div>
    </div>
  );
}
