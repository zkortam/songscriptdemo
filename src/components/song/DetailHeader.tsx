"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { FavoriteButton, MoreMenu } from "@/components/catalogue/SongActions";
import { TagEditor } from "./TagEditor";
import { useRename } from "@/data/queries";
import { keyLabel, formatTempo, formatDuration } from "@/lib/format";
import { MAX_TITLE_LEN } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";
import type { Transcription } from "@/lib/types";

export function DetailHeader({ song, allTags }: { song: Transcription; allTags: string[] }) {
  const rename = useRename();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(song.title);

  const save = () => {
    const t = title.trim().slice(0, MAX_TITLE_LEN);
    if (t && t !== song.title) rename(song.id, t);
    else setTitle(song.title);
    setEditing(false);
  };

  return (
    <div>
      <Link
        href="/"
        className={cn("inline-flex items-center gap-1.5 rounded-full py-1 text-[14px] text-muted hover:text-ink", focusRing)}
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={title}
              maxLength={MAX_TITLE_LEN}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setTitle(song.title);
                  setEditing(false);
                }
              }}
              onBlur={save}
              className={cn("w-full rounded-lg bg-surface/60 px-2 py-1 text-[28px] font-semibold", focusRing)}
            />
          ) : (
            <h1
              onClick={() => {
                setTitle(song.title);
                setEditing(true);
              }}
              className="cursor-text truncate text-[28px] font-semibold leading-tight tracking-tight"
              title="Click to rename"
            >
              {song.title}
            </h1>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
            <span>{keyLabel(song.keySignature, song.keyIsEstimated)}</span>
            <span className="tabular-nums">{formatTempo(song.tempoBpm)}</span>
            <span className="tabular-nums">{song.timeSignature}</span>
            <span className="tabular-nums">{formatDuration(song.durationSeconds)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <FavoriteButton song={song} />
          <MoreMenu song={song} afterDelete={() => {}} />
        </div>
      </div>

      <div className="mt-3">
        <TagEditor song={song} allTags={allTags} />
      </div>
    </div>
  );
}
