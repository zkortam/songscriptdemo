import { getServiceClient, STORAGE_BUCKET } from "./supabase";
import { getEnv } from "./env";

export const storageKey = (id: string) => `${id}.mid`;

/** Public URL for a stored MIDI (bucket is public-read). */
export function publicMidiUrl(id: string): string {
  const { SUPABASE_URL } = getEnv();
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storageKey(id)}`;
}

export async function uploadMidi(id: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await getServiceClient()
    .storage.from(STORAGE_BUCKET)
    .upload(storageKey(id), bytes, { contentType: "audio/midi", upsert: true });
  if (error) throw error;
}

export async function deleteMidi(id: string): Promise<void> {
  await getServiceClient().storage.from(STORAGE_BUCKET).remove([storageKey(id)]);
}
