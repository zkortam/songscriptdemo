"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadTranscription } from "@/data/api";
import { qk } from "@/data/queries";
import { UPLOAD_CONCURRENCY } from "@/lib/constants";
import type { Transcription } from "@/lib/types";

export type UploadStatus = "queued" | "parsing" | "uploading" | "success" | "error";
export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  detected?: { title: string; duration: number };
  controller: AbortController;
}

interface UploadCtx {
  items: UploadItem[];
  enqueue: (files: File[]) => void;
  retry: (id: string) => void;
  cancel: (id: string) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<UploadCtx | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const startedRef = useRef<Set<string>>(new Set());
  const qc = useQueryClient();

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const runItem = useCallback(
    async (item: UploadItem) => {
      try {
        update(item.id, { status: "parsing" });
        // Lazy client-side preview (keeps the parser out of the initial bundle).
        try {
          const { parseMidi } = await import("@/lib/midi");
          const buf = await item.file.arrayBuffer();
          const p = parseMidi(buf, item.file.name);
          update(item.id, { detected: { title: p.title, duration: p.durationSeconds } });
        } catch {
          /* preview is best-effort */
        }
        update(item.id, { status: "uploading", progress: 0 });
        const created = await uploadTranscription(item.file, {
          signal: item.controller.signal,
          onProgress: (p) => update(item.id, { progress: p }),
        });
        qc.setQueryData<Transcription[]>(qk.list, (old) => [created, ...(old ?? [])]);
        update(item.id, { status: "success", progress: 1 });
        toast.success(`Added ${created.title}`);
        setTimeout(() => remove(item.id), 2500);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          remove(item.id);
          return;
        }
        const message = (e as Error).message || "Upload failed.";
        update(item.id, { status: "error", error: message });
        toast.error(`Could not add ${item.file.name}. ${message}`);
      }
    },
    [qc, remove, update],
  );

  useEffect(() => {
    const active = items.filter((i) => i.status === "parsing" || i.status === "uploading").length;
    let slots = UPLOAD_CONCURRENCY - active;
    for (const item of items) {
      if (slots <= 0) break;
      if (item.status === "queued" && !startedRef.current.has(item.id)) {
        startedRef.current.add(item.id);
        slots--;
        void runItem(item);
      }
    }
  }, [items, runItem]);

  const enqueue = useCallback((files: File[]) => {
    const fresh = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "queued" as UploadStatus,
      progress: 0,
      controller: new AbortController(),
    }));
    setItems((prev) => [...prev, ...fresh]);
  }, []);

  const retry = useCallback(
    (id: string) => {
      startedRef.current.delete(id);
      update(id, { status: "queued", error: undefined, progress: 0, controller: new AbortController() });
    },
    [update],
  );

  const cancel = useCallback(
    (id: string) => {
      setItems((prev) => {
        prev.find((i) => i.id === id)?.controller.abort();
        return prev.filter((i) => i.id !== id);
      });
    },
    [],
  );

  return (
    <Ctx.Provider value={{ items, enqueue, retry, cancel, dismiss: remove }}>{children}</Ctx.Provider>
  );
}

export function useUpload() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}
