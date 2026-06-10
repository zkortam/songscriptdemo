"use client";
import { useRef } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUpload } from "@/providers/UploadProvider";
import { splitMidiFiles, NON_MIDI_MESSAGE } from "@/lib/files";
import { Button } from "@/components/ui/Button";

export function AddSongButton({ compact, fullWidth }: { compact?: boolean; fullWidth?: boolean }) {
  const { enqueue } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        // Audio is allowed through the picker so the "why not MP3?" answer can
        // surface as a clear message, rather than the file being unselectable.
        accept=".mid,.midi,audio/midi,audio/mpeg,audio/wav,audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const { midi, rejected } = splitMidiFiles(files);
          if (midi.length) enqueue(midi);
          if (rejected.length) toast.error(NON_MIDI_MESSAGE);
          e.target.value = "";
        }}
      />
      {compact ? (
        <Button aria-label="Add song" className="h-10 w-10 px-0" onClick={() => inputRef.current?.click()}>
          <Plus className="h-5 w-5" />
        </Button>
      ) : (
        <Button size="sm" className={fullWidth ? "w-full" : undefined} onClick={() => inputRef.current?.click()}>
          <Plus className="h-4 w-4" />
          Add song
        </Button>
      )}
    </>
  );
}
