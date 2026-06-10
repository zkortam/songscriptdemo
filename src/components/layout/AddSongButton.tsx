"use client";
import { useRef } from "react";
import { Plus } from "lucide-react";
import { useUpload } from "@/providers/UploadProvider";
import { Button } from "@/components/ui/Button";

export function AddSongButton({ compact, fullWidth }: { compact?: boolean; fullWidth?: boolean }) {
  const { enqueue } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) enqueue(files);
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
