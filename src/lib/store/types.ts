import type { ParsedMidi, Transcription } from "@/lib/types";

export interface CreateInput {
  parsed: ParsedMidi;
  fileName: string;
  fileSize: number;
  tags: string[];
  bytes: ArrayBuffer;
}

export interface UpdatePatch {
  title?: string;
  isFavorite?: boolean;
  tags?: string[];
  practice?: boolean;
}

export interface ListOpts {
  q?: string;
  sort?: string;
}

/**
 * Backend-agnostic persistence. Route handlers depend only on this; the concrete
 * backend (Supabase in production, a local file store in dev) is chosen by env.
 */
export interface Store {
  list(opts?: ListOpts): Promise<Transcription[]>;
  get(id: string): Promise<Transcription | null>;
  create(input: CreateInput): Promise<Transcription>;
  update(id: string, patch: UpdatePatch): Promise<Transcription | null>;
  remove(id: string): Promise<void>;
}
