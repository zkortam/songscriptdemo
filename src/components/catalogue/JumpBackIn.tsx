"use client";
import { SongCard } from "./SongCard";
import type { Transcription } from "@/lib/types";

export function JumpBackIn({ songs }: { songs: Transcription[] }) {
  if (songs.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-[15px] font-semibold text-muted">Jump back in</h2>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {songs.map((song) => (
          <div key={song.id} className="w-[260px] shrink-0">
            <SongCard song={song} />
          </div>
        ))}
      </div>
    </section>
  );
}
