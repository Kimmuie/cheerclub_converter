// src/components/SectionCard.tsx
// Shared card frame used by every numbered panel in the group workspace
// (Color Palette, Plate Matrix, Grid Sheet Matrix, Source Bitmaps, etc).

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionCardProps {
  icon: LucideIcon;
  step?: number;
  title: string;
  iconColor?: string;
  right?: ReactNode;
  children: ReactNode;
}

export default function SectionCard({
  icon: Icon,
  step,
  title,
  iconColor = "text-red-700",
  right,
  children,
}: SectionCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
            {step != null ? `${step}. ${title}` : title}
          </h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}
