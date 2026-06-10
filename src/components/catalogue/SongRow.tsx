"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Fingerprint } from "./Fingerprint";
import { FavoriteButton, MoreMenu } from "./SongActions";
import { keyLabel, formatDuration, formatTempo, difficultyLabel, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";
import type { SortKey } from "@/lib/constants";
import type { CatalogueParams, ParamPatch } from "@/hooks/useCatalogueParams";
import type { Transcription } from "@/lib/types";

const GRID = cn(
  "grid items-center gap-x-4",
  "grid-cols-[44px_1fr_auto]",
  "sm:grid-cols-[44px_2fr_1.2fr_0.9fr_auto]",
  "md:grid-cols-[44px_2fr_1.1fr_0.9fr_1.2fr_0.8fr_auto]",
  "lg:grid-cols-[44px_minmax(160px,2.2fr)_1.1fr_0.9fr_1.1fr_0.8fr_1.1fr_auto]",
);

export function SongListHeader({
  params,
  update,
}: {
  params: CatalogueParams;
  update: (p: ParamPatch) => void;
}) {
  const sortBtn = (label: string, key: SortKey, cls: string) => {
    const active = params.sort === key;
    return (
      <button
        onClick={() => (active ? update({ reversed: !params.reversed }) : update({ sort: key, reversed: false }))}
        className={cn(
          "inline-flex items-center gap-1 text-left text-[13px] hover:text-ink",
          active ? "font-medium text-green-700 dark:text-green-300" : "text-muted",
          focusRing,
          cls,
        )}
      >
        {label}
        {active && <ChevronDown className={cn("h-3.5 w-3.5", params.reversed && "rotate-180")} />}
      </button>
    );
  };

  return (
    <div className={cn(GRID, "px-3 pb-1")}>
      <span />
      {sortBtn("Title", "title", "")}
      <span className="hidden text-[13px] text-muted sm:block">Key</span>
      {sortBtn("Tempo", "tempo", "hidden md:inline-flex")}
      {sortBtn("Difficulty", "difficulty", "hidden md:inline-flex")}
      <span className="hidden text-[13px] text-muted sm:block">Length</span>
      {sortBtn("Practiced", "practiced", "hidden lg:inline-flex")}
      <span />
    </div>
  );
}

export function SongRow({ song }: { song: Transcription }) {
  return (
    <Link
      href={`/song/${song.id}`}
      className={cn(GRID, "group rounded-xl px-3 py-2 transition hover:bg-surface/55", focusRing)}
    >
      <div className="h-9 w-11 overflow-hidden rounded-md bg-ink/[0.04] dark:bg-white/[0.04]">
        <Fingerprint thumb={song.thumb} hue={song.accentHue} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium">{song.title}</p>
        <p className="truncate text-[13px] text-muted sm:hidden">
          {keyLabel(song.keySignature, song.keyIsEstimated)} {formatDuration(song.durationSeconds)}
        </p>
      </div>
      <span className="hidden truncate text-[13px] text-muted sm:block">
        {keyLabel(song.keySignature, song.keyIsEstimated)}
      </span>
      <span className="hidden text-[13px] tabular-nums text-muted md:block">{formatTempo(song.tempoBpm)}</span>
      <span className="hidden text-[13px] text-muted md:block">{difficultyLabel(song.difficultyScore)}</span>
      <span className="hidden text-[13px] tabular-nums text-muted sm:block">
        {formatDuration(song.durationSeconds)}
      </span>
      <span className="hidden text-[13px] text-muted lg:block">{relativeTime(song.lastPracticedAt)}</span>
      <div className="flex items-center justify-end">
        <FavoriteButton song={song} className="opacity-80 group-hover:opacity-100" />
        <MoreMenu song={song} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100" />
      </div>
    </Link>
  );
}
