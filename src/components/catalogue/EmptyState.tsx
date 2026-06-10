"use client";
import { useState } from "react";
import { AudioWaveform, Loader2 } from "lucide-react";
import { AddSongButton } from "@/components/layout/AddSongButton";
import { Chip } from "@/components/ui/Chip";
import { useUpload } from "@/providers/UploadProvider";
import { SAMPLE_FILES } from "@/lib/constants";

async function loadSample(file: string): Promise<File> {
  const res = await fetch(`/samples/${file}`);
  if (!res.ok) throw new Error(`Could not load sample (${res.status}).`);
  const blob = await res.blob();
  return new File([blob], file, { type: "audio/midi" });
}

export function EmptyState() {
  const { enqueue } = useUpload();
  const [loading, setLoading] = useState<string | null>(null);

  const trySample = async (file: string) => {
    if (loading) return;
    setLoading(file);
    try {
      enqueue([await loadSample(file)]);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl glass-card p-8 text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-500/15 text-green-600 dark:text-green-300">
        <AudioWaveform className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-[18px] font-semibold">Start your library</h2>
      <p className="mt-1.5 text-[14px] text-muted">
        Upload a MIDI file to add your first song.
      </p>
      <div className="mt-5 flex justify-center">
        <AddSongButton />
      </div>
      <p className="mt-6 text-[13px] text-muted">Or try a sample</p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {SAMPLE_FILES.map((s) => (
          <Chip
            key={s.file}
            onClick={() => trySample(s.file)}
            className={loading === s.file ? "pointer-events-none opacity-70" : undefined}
          >
            {loading === s.file && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {s.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
