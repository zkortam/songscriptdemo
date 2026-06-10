"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUpload } from "@/providers/UploadProvider";
import { splitMidiFiles, NON_MIDI_MESSAGE } from "@/lib/files";

/** Full-window drag-and-drop. Counter-based so child elements do not cause flicker. */
export function DragOverlay() {
  const { enqueue } = useUpload();
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const dropped = Array.from(e.dataTransfer?.files ?? []);
      if (dropped.length === 0) return;
      const { midi, rejected } = splitMidiFiles(dropped);
      if (midi.length) enqueue(midi);
      if (rejected.length) toast.error(NON_MIDI_MESSAGE);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [enqueue]);

  if (!dragging) return null;
  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-canvas/40 p-6 backdrop-blur-sm">
      <div className="pointer-events-none grid place-items-center gap-3 rounded-xl bg-surface/80 px-16 py-12 text-center shadow-soft-hover ring-2 ring-green-500/40">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-green-500/15 text-green-600 dark:text-green-300">
          <Plus className="h-6 w-6" />
        </div>
        <p className="text-[15px] font-medium">Drop to add to your library</p>
      </div>
    </div>
  );
}
