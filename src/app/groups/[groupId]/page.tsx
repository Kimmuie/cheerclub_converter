"use client";

// src/app/groups/[groupId]/page.tsx
// Logic is unchanged from your working version (same store lookups, same
// "group not found" fallback, same Export PDF gating) — only the layout
// was restyled to match the new design.

import { useParams, useRouter } from "next/navigation";
import { useConverterStore } from "@/store/useConverterStore";
import Navbar from "@/components/Navbar";
import ImageUploader from "../components/ImageUploader";
import PaletteUploader from "../components/PaletteUploader";
import PlateMatrixForm from "../components/PlateMatrixForm";
import ConversionPreview from "../components/ConversionPreview";
import GroupSubHeader from "../components/GroupSubHeader";

export default function GroupWorkspacePage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const group = useConverterStore((s) => s.getGroup(params.groupId));

  if (!group) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-gray-500">
          This group no longer exists.{" "}
          <button onClick={() => router.push("/")} className="text-red-700 underline">
            Back to Groups
          </button>
        </p>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar
        navLinks={[{ label: "Upload & Palette", href: `/groups/${group.id}` }]}
        actionLabel="Export PDF"
        onAction={() => router.push(`/groups/${group.id}/export`)}
      />

      <GroupSubHeader
        groupName={group.name}
        matrixLabel={
          group.plateSize
            ? `${group.plateSize.rows}×${group.plateSize.columns} Matrix`
            : "No Matrix Set"
        }
        paletteLabel={`${group.palette?.colors.length ?? 0} Index ACO`}
        bitmapLabel={`${group.images.length} Loaded Bitmaps`}
      />

      <div className="mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <PaletteUploader groupId={group.id} />
            <PlateMatrixForm groupId={group.id} />
          </div>
          <div className="space-y-6">
            <ImageUploader groupId={group.id} />
          </div>
        </div>
      </div>
    </main>
  );
}