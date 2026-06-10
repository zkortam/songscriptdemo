"use client";
import Link from "next/link";
import { Fingerprint } from "./Fingerprint";
import { FavoriteButton, MoreMenu } from "./SongActions";
import { KeyLabel } from "@/components/ui/KeyLabel";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";
import type { Transcription } from "@/lib/types";

export function SongCard({ song }: { song: Transcription }) {
  return (
    <Link
      href={`/song/${song.id}`}
      className={cn(
        "group cv-card relative block rounded-xl glass-card p-3 shadow-soft transition duration-200 ease-silk hover:-translate-y-0.5 hover:shadow-soft-hover",
        focusRing,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-ink/[0.03] dark:bg-white/[0.03]">
        <Fingerprint
          thumb={song.thumb}
          hue={song.accentHue}
          className="transition-transform duration-500 ease-silk group-hover:scale-[1.03]"
        />
        {/* 3-dots sits left and reveals on hover; the heart holds the corner so a lone
            favorite still reads as "pinned to the corner", not floating mid-edge. */}
        <div className="absolute right-1.5 top-1.5 flex gap-0.5">
          <MoreMenu
            song={song}
            className="h-9 w-9 bg-surface/75 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
          />
          <FavoriteButton
            song={song}
            className={cn(
              "h-9 w-9 bg-surface/75 transition",
              song.isFavorite ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            )}
          />
        </div>
      </div>
      <div className="px-1 pb-0.5 pt-3">
        <h3 className="truncate text-[15px] font-semibold leading-tight">{song.title}</h3>
        <div className="mt-1 flex items-center gap-3 text-[13px] text-muted">
          <KeyLabel keySignature={song.keySignature} estimated={song.keyIsEstimated} />
          <span className="tabular-nums">{formatDuration(song.durationSeconds)}</span>
        </div>
      </div>
    </Link>
  );
}
