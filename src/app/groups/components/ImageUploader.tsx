"use client";

// src/components/ImageUploader.tsx
// Handles multi-file BMP/PNG/JPG selection, thumbnails, dimensions, removal,
// index display, drag-to-reorder, and an editable "Substance Name" per image.
//
// Upload/validation logic (handleFiles, extensionOf, readImageDimensions) is
// UNCHANGED from your working version. What's new below needs two small
// additions on your store/type side — see the two blocks marked
// "REQUIRES STORE ADDITION" — everything else just works with what you had.

import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { GripVertical, Images, Upload } from "lucide-react";
import { useConverterStore } from "@/store/useConverterStore";
import type { ImageAsset, ImageFormat } from "@/types";
import SectionCard from "@/components/SectionCard";

const ACCEPTED_EXTENSIONS: ImageFormat[] = ["bmp", "png", "jpg", "jpeg"];

function extensionOf(fileName: string): ImageFormat | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (ACCEPTED_EXTENSIONS as string[]).includes(ext ?? "") ? (ext as ImageFormat) : null;
}

function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image dimensions."));
    img.src = src;
  });
}

// Strips the extension so the default "Substance Name" reads cleanly, e.g.
// "mascot_paw_40x50.jpg" -> "mascot_paw_40x50".
function defaultNameFor(fileName: string) {
  return fileName.replace(/\.[^./]+$/, "");
}

export default function ImageUploader({ groupId }: { groupId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const images = useConverterStore((s) => s.getGroup(groupId)?.images ?? []);
  const addImages = useConverterStore((s) => s.addImages);
  const removeImage = useConverterStore((s) => s.removeImage);

  // REQUIRES STORE ADDITION #1 — add these two actions to useConverterStore:
  //
  //   reorderImages: (groupId: string, fromIndex: number, toIndex: number) =>
  //     set((state) => {
  //       const group = state.getGroup(groupId);
  //       if (!group) return state;
  //       const next = [...group.images];
  //       const [moved] = next.splice(fromIndex, 1);
  //       next.splice(toIndex, 0, moved);
  //       return updateGroup(state, groupId, { images: next }); // however you patch a group today
  //     }),
  //
  //   renameImage: (groupId: string, imageId: string, name: string) =>
  //     set((state) => {
  //       const group = state.getGroup(groupId);
  //       if (!group) return state;
  //       const next = group.images.map((img) =>
  //         img.id === imageId ? { ...img, name } : img
  //       );
  //       return updateGroup(state, groupId, { images: next });
  //     }),
  const reorderImages = useConverterStore((s) => s.reorderImages);
  const renameImage = useConverterStore((s) => s.renameImage);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    const files = Array.from(fileList);
    const rejected = files.filter((f) => !extensionOf(f.name));
    if (rejected.length > 0) {
      setError(
        `Unsupported file type: ${rejected.map((f) => f.name).join(", ")}. Only BMP, PNG, and JPG are supported.`
      );
    }

    const valid = files.filter((f) => extensionOf(f.name));
    if (valid.length === 0) return;

    setIsLoading(true);
    try {
      const newAssets: ImageAsset[] = [];
      for (const file of valid) {
        const src = URL.createObjectURL(file);
        try {
          const { width, height } = await readImageDimensions(src);
          newAssets.push({
            id: uuid(),
            fileName: file.name,
            format: extensionOf(file.name) as ImageFormat,
            src,
            width,
            height,
            size: file.size,
          });
        } catch {
          setError((prev) =>
            prev
              ? `${prev} Also failed to read: ${file.name}.`
              : `Failed to read image: ${file.name}. The file may be corrupted.`
          );
        }
      }
      if (newAssets.length > 0) addImages(groupId, newAssets);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionCard
      icon={Images}
      title="Source Image"
      right={
        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {images.length} Uploaded
        </span>
      }
    >
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 py-6 text-center hover:border-red-300"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".bmp,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Upload className="mb-1 h-5 w-5 text-gray-400" />
        {isLoading ? (
          <span className="text-sm text-gray-500">Reading images…</span>
        ) : (
          <>
            <span className="text-sm text-gray-700">
              Drag &amp; Drop image
              <span className="text-gray-400"> or click to browse</span>
            </span>
            <span className="text-xs uppercase tracking-wide text-gray-400">
              Example: (.PNG, .JPG, .BMP)
            </span>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 mt-3 text-xs text-red-600">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-4 space-y-2">
          {images.map((img, index) => (
            <ImageRow
              key={img.id}
              image={img}
              index={index}
              isDragging={dragIndex === index}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== index) {
                  reorderImages(groupId, dragIndex, index);
                }
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              onRename={(name) => renameImage(groupId, img.id, name)}
              onRemove={() => removeImage(groupId, img.id)}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

interface ImageRowProps {
  image: ImageAsset & { name?: string }; // `name` = REQUIRES STORE ADDITION #2 below
  index: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}

function ImageRow({
  image,
  index,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRename,
  onRemove,
}: ImageRowProps) {
  const [nameDraft, setNameDraft] = useState(image.name ?? defaultNameFor(image.fileName));

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 rounded-md border border-gray-200 p-2 text-xs ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-300" />

      <span className="shrink-0 text-xs font-semibold text-red-700">
        #{String(index + 1).padStart(2, "0")}
      </span>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.fileName} className="h-10 w-10 rounded object-cover" />

      <div className="min-w-0 flex-1">  
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => onRename(nameDraft)}
          onKeyDown={(e) => e.key === "Enter" && onRename(nameDraft)}
          placeholder="Substance Name"
          className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-gray-900 hover:border-gray-200 focus:border-gray-300 focus:outline-none"
        />
        <div className="truncate px-1 text-gray-400">
          Src : {image.fileName}
        </div>
        <div className="truncate px-1 text-gray-400">
          Size : {image.width}×{image.height}px
        </div>
        {/* <div className="truncate px-1 text-gray-400">
          Size : {(image.size / 1024 ).toFixed(0)} KB
        </div> */}
      </div>

      <button
        onClick={onRemove}
        className="shrink-0 text-gray-400 hover:text-red-700 cursor-pointer"
        aria-label={`Remove ${image.fileName}`}
      >
        Remove
      </button>
    </li>
  );
}