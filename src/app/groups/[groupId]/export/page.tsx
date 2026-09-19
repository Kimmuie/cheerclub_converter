"use client";

// src/app/groups/[groupId]/preview/page.tsx
// Same group lookup / not-found fallback as your working version.
// Auto-selects all ready results for export the first time this page loads
// with nothing selected yet (the old checkbox list is replaced by the
// Batch Payload panel, which now always targets every ready image).

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConverterStore } from "@/store/useConverterStore";
import Navbar from "@/components/Navbar";
import GroupSubHeader from "@/components/GroupSubHeader";
import License from "@/components/License";
import LayoutArchitecturePanel from "./components/LayoutArchitecturePanel";
import SheetMetricsPanel from "./components/SheetMetricsPanel";
import BatchPayloadPanel from "./components/BatchPayloadPanel";
import PreviewPane from "./components/PreviewPane";

const PAGE_SIZES = ["A4", "A3", "Letter"] as const;

export default function GroupExportPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const group = useConverterStore((s) => s.getGroup(params.groupId));
  const setExportOptions = useConverterStore((s) => s.setExportOptions);

  const readyResults = group?.results.filter((r) => r.status === "ready") ?? [];

  useEffect(() => {
    if (!group) return;
    if (group.exportOptions.imageIds.length === 0 && readyResults.length > 0) {
      setExportOptions(group.id, { imageIds: readyResults.map((r) => r.imageId) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, readyResults.length]);

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

  const cyclePageSize = () => {
    const currentIndex = PAGE_SIZES.indexOf(group.exportOptions.pageSize);
    const next = PAGE_SIZES[(currentIndex + 1) % PAGE_SIZES.length];
    setExportOptions(group.id, { pageSize: next });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar
        navItems={[
          { label: "Upload & Palette", href: `/groups/${group.id}` },
          { label: "Export PDF", href: `/groups/${group.id}/export`, active: true },
        ]}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <LayoutArchitecturePanel groupId={group.id} mode={group.exportOptions.mode} />
            <SheetMetricsPanel
              pageSize={group.exportOptions.pageSize}
              plateSize={group.plateSize}
              paletteColorCount={group.palette?.colors.length ?? 0}
            />
            <BatchPayloadPanel
              groupName={group.name}
              readyResults={readyResults}
              exportOptions={group.exportOptions}
              palette={group.palette}
            />
          </div>

          <PreviewPane
            groupId={group.id}
            groupName={group.name}
            mode={group.exportOptions.mode}
            pageSize={group.exportOptions.pageSize}
            onCyclePageSize={cyclePageSize}
            readyResults={readyResults}
            palette={group.palette}
          />
        </div>
      </div>
      <License />
    </main>
  );
}