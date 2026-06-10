import type { ParsedMidi, Transcription } from "@/lib/types";
import { compareSongs } from "@/lib/catalogue";
import type { ListOpts } from "./types";

/** Build a fresh Transcription with default fields (used by the local store). */
export function freshTranscription(
  id: string,
  parsed: ParsedMidi,
  file: { name: string; size: number },
  tags: string[],
  url: string,
): Transcription {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    title: parsed.title,
    fileName: file.name,
    filePath: `${id}.mid`,
    fileSize: file.size,
    durationSeconds: parsed.durationSeconds,
    tempoBpm: parsed.tempoBpm,
    keySignature: parsed.keySignature,
    keyIsEstimated: parsed.keyIsEstimated,
    timeSignature: parsed.timeSignature,
    trackCount: parsed.trackCount,
    noteCount: parsed.noteCount,
    lowestNote: parsed.lowestNote,
    highestNote: parsed.highestNote,
    instruments: parsed.instruments,
    isPercussionOnly: parsed.isPercussionOnly,
    difficultyScore: parsed.difficultyScore,
    difficultyParts: parsed.difficultyParts,
    accentHue: parsed.accentHue,
    isFavorite: false,
    tags,
    lastPracticedAt: null,
    practiceCount: 0,
    accuracyPct: null,
    thumb: parsed.thumb,
    url,
  };
}

/** Apply the optional server-side query (title search + sort) in JS, for the local store. */
export function applyListOpts(list: Transcription[], opts?: ListOpts): Transcription[] {
  let out = list;
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    out = out.filter((t) => t.title.toLowerCase().includes(q));
  }
  out = [...out].sort((a, b) => compareSongs(a, b, opts?.sort ?? "recent"));
  return out;
}
