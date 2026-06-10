import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";
import type { Transcription, ParsedMidi } from "./types";

export const STORAGE_BUCKET = "midi";
const publicUrl = (id: string) =>
  `${getEnv().SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${id}.mid`;

let client: SupabaseClient | null = null;

/** Server-only Supabase client using the service role key. Never import in client code. */
export function getServiceClient(): SupabaseClient {
  if (client) return client;
  const env = getEnv();
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return client;
}

export function rowToTranscription(r: Record<string, any>): Transcription {
  return {
    id: r.id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    title: r.title,
    fileName: r.file_name,
    filePath: r.file_path,
    fileSize: r.file_size,
    durationSeconds: r.duration_seconds,
    tempoBpm: r.tempo_bpm,
    keySignature: r.key_signature,
    keyIsEstimated: r.key_is_estimated,
    timeSignature: r.time_signature,
    trackCount: r.track_count,
    noteCount: r.note_count,
    lowestNote: r.lowest_note,
    highestNote: r.highest_note,
    instruments: r.instruments ?? [],
    isPercussionOnly: r.is_percussion_only,
    difficultyScore: r.difficulty_score,
    difficultyParts: r.difficulty_parts,
    accentHue: r.accent_hue,
    isFavorite: r.is_favorite,
    tags: r.tags ?? [],
    lastPracticedAt: r.last_practiced_at,
    practiceCount: r.practice_count,
    accuracyPct: r.accuracy_pct,
    thumb: r.thumb,
    url: publicUrl(r.id),
  };
}

export function parsedToRow(id: string, parsed: ParsedMidi, file: { name: string; size: number; path: string }, tags: string[]) {
  return {
    id,
    title: parsed.title,
    file_name: file.name,
    file_path: file.path,
    file_size: file.size,
    duration_seconds: parsed.durationSeconds,
    tempo_bpm: parsed.tempoBpm,
    key_signature: parsed.keySignature,
    key_is_estimated: parsed.keyIsEstimated,
    time_signature: parsed.timeSignature,
    track_count: parsed.trackCount,
    note_count: parsed.noteCount,
    lowest_note: parsed.lowestNote,
    highest_note: parsed.highestNote,
    instruments: parsed.instruments,
    is_percussion_only: parsed.isPercussionOnly,
    difficulty_score: parsed.difficultyScore,
    difficulty_parts: parsed.difficultyParts,
    accent_hue: parsed.accentHue,
    tags,
    thumb: parsed.thumb,
    is_favorite: false,
    practice_count: 0,
    last_practiced_at: null,
    accuracy_pct: null,
  };
}
