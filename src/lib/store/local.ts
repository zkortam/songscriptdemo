import { promises as fs } from "node:fs";
import { join } from "node:path";
import { normalizeTags } from "@/lib/tags";
import type { Transcription } from "@/lib/types";
import type { Store, CreateInput, UpdatePatch, ListOpts } from "./types";
import { freshTranscription, applyListOpts } from "./shared";

/** Local file-backed store: zero-setup persistence for dev and demos. */
export class LocalStore implements Store {
  private dir = process.env.LOCAL_DATA_DIR || join(process.cwd(), ".data");
  private dbPath = join(this.dir, "transcriptions.json");
  private blobsDir = join(this.dir, "blobs");

  private async readAll(): Promise<Transcription[]> {
    try {
      return JSON.parse(await fs.readFile(this.dbPath, "utf8"));
    } catch {
      return [];
    }
  }
  private async writeAll(rows: Transcription[]): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.dbPath, JSON.stringify(rows));
  }

  async list(opts?: ListOpts): Promise<Transcription[]> {
    return applyListOpts(await this.readAll(), opts);
  }

  async get(id: string): Promise<Transcription | null> {
    return (await this.readAll()).find((t) => t.id === id) ?? null;
  }

  async create(input: CreateInput): Promise<Transcription> {
    const id = crypto.randomUUID();
    await fs.mkdir(this.blobsDir, { recursive: true });
    await fs.writeFile(join(this.blobsDir, `${id}.mid`), Buffer.from(input.bytes));
    const t = freshTranscription(
      id,
      input.parsed,
      { name: input.fileName, size: input.fileSize },
      input.tags,
      `/api/files/${id}`,
    );
    try {
      const rows = await this.readAll();
      rows.unshift(t);
      await this.writeAll(rows);
    } catch (e) {
      await fs.unlink(join(this.blobsDir, `${id}.mid`)).catch(() => {});
      throw e;
    }
    return t;
  }

  async update(id: string, patch: UpdatePatch): Promise<Transcription | null> {
    const rows = await this.readAll();
    const t = rows.find((r) => r.id === id);
    if (!t) return null;
    if (patch.title !== undefined) t.title = patch.title.trim();
    if (patch.isFavorite !== undefined) t.isFavorite = patch.isFavorite;
    if (patch.tags !== undefined) t.tags = normalizeTags(patch.tags);
    if (patch.practice) {
      t.practiceCount += 1;
      t.lastPracticedAt = new Date().toISOString();
      t.accuracyPct = Math.round(80 + Math.random() * 18);
    }
    t.updatedAt = new Date().toISOString();
    await this.writeAll(rows);
    return t;
  }

  async remove(id: string): Promise<void> {
    const rows = await this.readAll();
    await this.writeAll(rows.filter((r) => r.id !== id));
    await fs.unlink(join(this.blobsDir, `${id}.mid`)).catch(() => {});
  }

  async readBlob(id: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(join(this.blobsDir, `${id}.mid`));
    } catch {
      return null;
    }
  }
}
