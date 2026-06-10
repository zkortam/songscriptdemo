import { getStore } from "@/lib/store";
import type { Transcription } from "@/lib/types";

/**
 * Server-side reads for SSR. On any backend error we return empty/null so the app
 * still renders (the empty state) rather than crashing.
 */
export async function getInitialTranscriptions(): Promise<Transcription[]> {
  try {
    return await getStore().list();
  } catch {
    return [];
  }
}

export async function getTranscriptionById(id: string): Promise<Transcription | null> {
  try {
    return await getStore().get(id);
  } catch {
    return null;
  }
}
