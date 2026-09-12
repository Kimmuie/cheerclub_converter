"use client";

interface ToolbarProps {
  projectName: string;
  tool: "brush" | "eraser";
  onToolChange: (tool: "brush" | "eraser") => void;
  isSaving: boolean;
  onBack: () => void;
}

export default function Toolbar({
  projectName,
  tool,
  onToolChange,
  isSaving,
  onBack,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
        >
          ← Projects
        </button>
        <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {projectName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToolChange("brush")}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tool === "brush"
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
          title="Brush (B)"
        >
          Brush
        </button>
        <button
          onClick={() => onToolChange("eraser")}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            tool === "eraser"
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
          title="Eraser (E)"
        >
          Eraser
        </button>
      </div>

      <span className="text-xs text-neutral-400">
        {isSaving ? "Saving…" : "Saved"}
      </span>
    </div>
  );
}