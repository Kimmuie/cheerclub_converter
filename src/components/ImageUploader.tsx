"use client";

// src/components/ImageUploader.tsx
// Handles multi-file BMP/PNG/JPG selection, thumbnails, dimensions, and removal.

import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { useConverterStore } from "./store/useConverterStore";
import type { ImageAsset, ImageFormat } from "@/types";

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

export default function ImageUploader({ groupId }: { groupId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const images = useConverterStore((s) => s.getGroup(groupId)?.images ?? []);
  const addImages = useConverterStore((s) => s.addImages);
  const removeImage = useConverterStore((s) => s.removeImage);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <section className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">2. Source Bitmaps</h2>
        <span className="text-xs text-gray-400">BMP, PNG, JPG</span>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className="cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 hover:border-red-300"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".bmp,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {isLoading ? "Reading images…" : "Drag & drop bitmap artwork, or click to browse"}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-4 space-y-2">
          {images.map((img) => (
            <li
              key={img.id}
              className="flex items-center gap-3 rounded border border-gray-100 p-2 text-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.fileName} className="h-10 w-10 rounded object-cover" />
              <div className="flex-1">
                <div className="font-medium">{img.fileName}</div>
                <div className="text-gray-400">
                  {img.width}×{img.height}px · {(img.size / 1024).toFixed(0)} KB · {img.format.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => removeImage(groupId, img.id)}
                className="text-gray-400 hover:text-red-600"
                aria-label={`Remove ${img.fileName}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}