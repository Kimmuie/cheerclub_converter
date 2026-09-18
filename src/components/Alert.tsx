"use client";

// src/components/Alert.tsx
// Generic confirm/alert popup — reusable anywhere in the project.
// Usage:
//   <Alert
//     open={open}
//     title="Delete this group?"
//     description="This action can't be undone."
//     variant="danger"
//     confirmText="Delete"
//     onConfirm={() => { ...; setOpen(false); }}
//     onCancel={() => setOpen(false)}
//   />

interface AlertProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Alert({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: AlertProps) {
  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-red-700 hover:bg-red-800"
      : "bg-gray-900 hover:bg-black";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg animate-popUp"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1.5 text-lg font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mb-6 text-sm text-gray-500">{description}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white ${confirmClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
