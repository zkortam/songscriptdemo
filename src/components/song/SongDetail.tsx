"use client";
import { useMemo } from "react";
import { useTranscription, useTranscriptions, useLogPractice } from "@/data/queries";
import { useRollNotes } from "@/hooks/useRollNotes";
import { DetailHeader } from "./DetailHeader";
import { PianoRollPlayer } from "./PianoRollPlayer";
import { DifficultyRing } from "./DifficultyRing";
import { NoteRange } from "./NoteRange";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { relativeTime, formatCount } from "@/lib/format";
import type { Transcription } from "@/lib/types";

export function SongDetail({ song: initial }: { song: Transcription }) {
  const song = useTranscription(initial.id, initial) ?? initial;
  const { data: all } = useTranscriptions();
  const allTags = useMemo(
    () => Array.from(new Set((all ?? []).flatMap((s) => s.tags))).sort(),
    [all],
  );
  const roll = useRollNotes(song.id, song.url);
  const logPractice = useLogPractice();

  return (
    <div className="animate-fade-up space-y-6 pt-6">
      <DetailHeader song={song} allTags={allTags} />

      {roll.isLoading ? (
        <Skeleton className="h-[480px] w-full rounded-xl" />
      ) : roll.isError ? (
        <div className="rounded-xl glass-card p-10 text-center shadow-soft">
          <p className="text-[15px] font-medium">Could not load the audio data.</p>
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => roll.refetch()}>
              Try again
            </Button>
          </div>
        </div>
      ) : roll.data ? (
        <PianoRollPlayer
          notes={roll.data.notes}
          duration={roll.data.duration}
          onFirstPlay={() => logPractice(song.id)}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <DifficultyRing score={song.difficultyScore} parts={song.difficultyParts} />
        <NoteRange lowest={song.lowestNote} highest={song.highestNote} />
      </div>

      <div className="grid gap-x-8 gap-y-5 rounded-xl glass-card p-5 shadow-soft sm:grid-cols-2">
        <div>
          <p className="text-[15px] font-semibold">Practice</p>
          <p className="mt-1 text-[14px] text-muted">
            {song.practiceCount > 0
              ? `Practiced ${formatCount(song.practiceCount)} ${song.practiceCount === 1 ? "time" : "times"}, last ${relativeTime(song.lastPracticedAt)}.`
              : "Not practiced yet. Press play to start a session."}
          </p>
        </div>
        <div>
          <p className="text-[15px] font-semibold">Details</p>
          <p className="mt-1 text-[14px] text-muted">
            {formatCount(song.noteCount)} notes across {song.trackCount}{" "}
            {song.trackCount === 1 ? "track" : "tracks"}
            {song.instruments.length > 0 ? `, played on ${song.instruments.join(", ")}.` : "."}
          </p>
        </div>
      </div>
    </div>
  );
}
