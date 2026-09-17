// src/store/useConverterStore.ts
// Central client-side state for all groups/workspaces. Persisted to
// localStorage (metadata only — image blobs are re-referenced by object
// URL and are NOT expected to survive a hard refresh; see README for the
// swap-in path to real storage/backend).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  ConversionResult,
  ExportOptions,
  Group,
  ImageAsset,
  Palette,
  PlateSize,
} from "./types";

interface ConverterState {
  groups: Group[];

  createGroup: (name: string) => string;
  renameGroup: (groupId: string, name: string) => void;
  deleteGroup: (groupId: string) => void;
  getGroup: (groupId: string) => Group | undefined;

  setPalette: (groupId: string, palette: Palette) => void;
  clearPalette: (groupId: string) => void;

  addImages: (groupId: string, images: ImageAsset[]) => void;
  removeImage: (groupId: string, imageId: string) => void;

  setPlateSize: (groupId: string, size: PlateSize) => void;

  setConversionResults: (groupId: string, results: ConversionResult[]) => void;
  upsertConversionResult: (groupId: string, result: ConversionResult) => void;

  setExportOptions: (groupId: string, options: Partial<ExportOptions>) => void;
}

const defaultExportOptions: ExportOptions = {
  mode: "merge",
  pageSize: "A4",
  imageIds: [],
};

const defaultPlateSize: PlateSize = { rows: 4, columns: 5 };

function updateGroup(groups: Group[], groupId: string, updater: (g: Group) => Group): Group[] {
  return groups.map((g) => (g.id === groupId ? updater(g) : g));
}

export const useConverterStore = create<ConverterState>()(
  persist(
    (set, get) => ({
      groups: [],

      createGroup: (name) => {
        const id = uuid();
        const newGroup: Group = {
          id,
          name: name.trim() || "Untitled Group",
          createdAt: new Date().toISOString(),
          palette: null,
          images: [],
          plateSize: defaultPlateSize,
          results: [],
          exportOptions: defaultExportOptions,
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        return id;
      },

      renameGroup: (groupId, name) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({
            ...g,
            name: name.trim() || g.name,
          })),
        }));
      },

      deleteGroup: (groupId) => {
        set((state) => ({ groups: state.groups.filter((g) => g.id !== groupId) }));
      },

      getGroup: (groupId) => get().groups.find((g) => g.id === groupId),

      setPalette: (groupId, palette) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({ ...g, palette })),
        }));
      },

      clearPalette: (groupId) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({ ...g, palette: null, results: [] })),
        }));
      },

      addImages: (groupId, images) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({
            ...g,
            images: [...g.images, ...images],
          })),
        }));
      },

      removeImage: (groupId, imageId) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({
            ...g,
            images: g.images.filter((img) => img.id !== imageId),
            results: g.results.filter((r) => r.imageId !== imageId),
            exportOptions: {
              ...g.exportOptions,
              imageIds: g.exportOptions.imageIds.filter((id) => id !== imageId),
            },
          })),
        }));
      },

      setPlateSize: (groupId, size) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({ ...g, plateSize: size })),
        }));
      },

      setConversionResults: (groupId, results) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({ ...g, results })),
        }));
      },

      upsertConversionResult: (groupId, result) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => {
            const exists = g.results.some((r) => r.imageId === result.imageId);
            return {
              ...g,
              results: exists
                ? g.results.map((r) => (r.imageId === result.imageId ? result : r))
                : [...g.results, result],
            };
          }),
        }));
      },

      setExportOptions: (groupId, options) => {
        set((state) => ({
          groups: updateGroup(state.groups, groupId, (g) => ({
            ...g,
            exportOptions: { ...g.exportOptions, ...options },
          })),
        }));
      },
    }),
    {
      name: "cheerclub-converter-storage",
      partialize: (state) => ({
        groups: state.groups.map((g) => ({
          ...g,
          // Don't persist large image blobs/results across reloads by default —
          // swap for IndexedDB (see README) if this needs to survive refresh.
          images: [],
          results: [],
        })),
      }),
    }
  )
);