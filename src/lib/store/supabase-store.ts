import { getServiceClient, rowToTranscription, parsedToRow } from "@/lib/supabase";
import { uploadMidi, deleteMidi } from "@/lib/storage";
import { normalizeTags } from "@/lib/tags";
import type { Transcription } from "@/lib/types";
import type { Store, CreateInput, UpdatePatch, ListOpts } from "./types";

const SORT_COLUMN: Record<string, { col: string; asc: boolean }> = {
  recent: { col: "created_at", asc: false },
  title: { col: "title", asc: true },
  tempo: { col: "tempo_bpm", asc: true },
  difficulty: { col: "difficulty_score", asc: true },
  practiced: { col: "last_practiced_at", asc: false },
};

export class SupabaseStore implements Store {
  async list(opts?: ListOpts): Promise<Transcription[]> {
    const sort = SORT_COLUMN[opts?.sort ?? "recent"] ?? SORT_COLUMN.recent;
    let query = getServiceClient()
      .from("transcriptions")
      .select("*")
      .order(sort.col, { ascending: sort.asc, nullsFirst: false });
    if (opts?.q) query = query.ilike("title", `%${opts.q}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToTranscription);
  }

  async get(id: string): Promise<Transcription | null> {
    const { data } = await getServiceClient().from("transcriptions").select("*").eq("id", id).single();
    return data ? rowToTranscription(data) : null;
  }

  async create({ parsed, fileName, fileSize, tags, bytes }: CreateInput): Promise<Transcription> {
    const id = crypto.randomUUID();
    await uploadMidi(id, bytes);
    const row = parsedToRow(id, parsed, { name: fileName, size: fileSize, path: `${id}.mid` }, tags);
    const { data, error } = await getServiceClient()
      .from("transcriptions")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) {
      await deleteMidi(id).catch(() => {});
      throw new Error(error?.message ?? "Insert failed.");
    }
    return rowToTranscription(data);
  }

  async update(id: string, patch: UpdatePatch): Promise<Transcription | null> {
    const supabase = getServiceClient();
    const update: Record<string, unknown> = {};
    if (patch.title !== undefined) update.title = patch.title.trim();
    if (patch.isFavorite !== undefined) update.is_favorite = patch.isFavorite;
    if (patch.tags !== undefined) update.tags = normalizeTags(patch.tags);
    if (patch.practice) {
      const { data: cur } = await supabase
        .from("transcriptions")
        .select("practice_count")
        .eq("id", id)
        .single();
      if (!cur) return null;
      update.practice_count = (cur.practice_count ?? 0) + 1;
      update.last_practiced_at = new Date().toISOString();
      update.accuracy_pct = Math.round(80 + Math.random() * 18);
    }
    const { data, error } = await supabase
      .from("transcriptions")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) return null;
    return rowToTranscription(data);
  }

  async remove(id: string): Promise<void> {
    await getServiceClient().from("transcriptions").delete().eq("id", id);
    await deleteMidi(id).catch(() => {});
  }
}
