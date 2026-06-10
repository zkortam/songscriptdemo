"use client";
import { AudioWaveform } from "lucide-react";
import { AddSongButton } from "@/components/layout/AddSongButton";
import { Chip } from "@/components/ui/Chip";
import { useUpload } from "@/providers/UploadProvider";
import { SAMPLE_FILES } from "@/lib/constants";

async function loadSample(file: string): Promise<File> {
  const res = await fetch(`/samples/${file}`);
  const blob = await res.blob();
  return new File([blob], file, { type: "audio/midi" });
}

export function EmptyState() {
  const { enqueue } = useUpload();
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl glass-card p-8 text-center shadow-soft">
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
          <Chip key={s.file} onClick={() => loadSample(s.file).then((f) => enqueue([f]))}>
            {s.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
