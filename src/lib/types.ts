/** Compact fingerprint column: all values normalized 0..1. */
export interface ThumbColumn {
  x: number; // time position
  lo: number; // lowest pitch in column
  hi: number; // highest pitch in column
  top: number; // top-voice (melody) pitch
}

export interface DifficultyParts {
  speed: number;
  density: number;
  handSpan: number;
  range: number;
  harmony: number;
}

/** Metadata extracted from a MIDI buffer (no DB-only fields). */
export interface ParsedMidi {
  title: string;
  durationSeconds: number;
  tempoBpm: number;
  keySignature: string;
  keyIsEstimated: boolean;
  timeSignature: string;
  trackCount: number;
  noteCount: number;
  lowestNote: number;
  highestNote: number;
  instruments: string[];
  isPercussionOnly: boolean;
  difficultyScore: number;
  difficultyParts: DifficultyParts;
  accentHue: number;
  thumb: ThumbColumn[];
}

/** A row in the `transcriptions` table (camelCase view used across the app). */
export interface Transcription extends ParsedMidi {
  id: string;
  createdAt: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  isFavorite: boolean;
  tags: string[];
  lastPracticedAt: string | null;
  practiceCount: number;
  accuracyPct: number | null;
  updatedAt: string;
  url: string; // public Storage URL (computed server-side; bucket is public)
}

export type ApiError = { error: { code: string; message: string } };
