import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Force the local file store (no Supabase env) and isolate its data dir.
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATA_DIR = join(tmpdir(), `songscription-test-${process.pid}`);
process.env.LOCAL_DATA_DIR = DATA_DIR;

import { GET, POST } from "./route";
import { PATCH, DELETE } from "./[id]/route";

function sampleFile(name: string): File {
  const buf = readFileSync(join(process.cwd(), "public/samples", name));
  return new File([buf], name, { type: "audio/midi" });
}
const post = (file: File) =>
  POST({ formData: async () => { const fd = new FormData(); fd.append("file", file); return fd; } } as never);
const get = (qs = "") => GET({ url: `https://x/api/transcriptions${qs}` } as never);
const patch = (id: string, body: unknown) =>
  PATCH({ json: async () => body } as never, { params: Promise.resolve({ id }) });
const del = (id: string) => DELETE({} as never, { params: Promise.resolve({ id }) });

beforeEach(() => rmSync(DATA_DIR, { recursive: true, force: true }));
afterAll(() => rmSync(DATA_DIR, { recursive: true, force: true }));

describe("upload (POST) against the real local store", () => {
  it("parses, stores, persists, and returns a complete record", async () => {
    const res = await post(sampleFile("twinkle-twinkle.mid"));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("Twinkle Twinkle");
    expect(body.noteCount).toBeGreaterThan(0);
    expect(body.tempoBpm).toBeGreaterThan(0);
    expect(body.isFavorite).toBe(false);
    expect(body.practiceCount).toBe(0);
    expect(body.tags.length).toBeGreaterThan(0);
    expect(body.url).toBe(`/api/files/${body.id}`);
    // really persisted to disk
    expect(existsSync(join(DATA_DIR, "blobs", `${body.id}.mid`))).toBe(true);
    const list = await (await get()).json();
    expect(list).toHaveLength(1);
  });

  it("rejects bad extension, empty, and corrupt files with no orphan", async () => {
    expect((await post(new File(["x"], "song.mp3"))).status).toBe(400);
    expect((await post(new File([], "empty.mid"))).status).toBe(400);
    const corrupt = await post(new File([new Uint8Array([1, 2, 3, 4])], "junk.mid"));
    expect(corrupt.status).toBe(400);
    expect((await corrupt.json()).error.code).toBe("parse_error");
    expect((await (await get()).json())).toHaveLength(0);
  });
});

describe("list (GET)", () => {
  it("returns all, searches by title, and sorts by title", async () => {
    await post(sampleFile("twinkle-twinkle.mid"));
    await post(sampleFile("c-major-scale.mid"));
    expect(await (await get()).json()).toHaveLength(2);
    const searched = await (await get("?q=twinkle")).json();
    expect(searched).toHaveLength(1);
    expect(searched[0].title).toBe("Twinkle Twinkle");
    const sorted = await (await get("?sort=title")).json();
    expect(sorted.map((t: { title: string }) => t.title)).toEqual(["C Major Scale", "Twinkle Twinkle"]);
  });
});

describe("mutations (PATCH) and delete", () => {
  let id: string;
  beforeEach(async () => {
    id = (await (await post(sampleFile("twinkle-twinkle.mid"))).json()).id;
  });

  it("favorites, renames (with validation), normalizes tags, logs practice", async () => {
    expect((await (await patch(id, { isFavorite: true })).json()).isFavorite).toBe(true);
    expect((await (await patch(id, { title: "My Song" })).json()).title).toBe("My Song");
    expect((await patch(id, { title: "" })).status).toBe(400);
    expect((await (await patch(id, { tags: ["Jazz!!", "jazz", " Lo Fi "] })).json()).tags).toEqual(["jazz", "lo fi"]);
    const practiced = await (await patch(id, { action: "practice" })).json();
    expect(practiced.practiceCount).toBe(1);
    expect(practiced.lastPracticedAt).toBeTruthy();
  });

  it("rejects unknown ids and deletes cleanly", async () => {
    expect((await patch("missing", { isFavorite: true })).status).toBe(404);
    expect((await del(id)).status).toBe(200);
    expect(await (await get()).json()).toHaveLength(0);
    expect(existsSync(join(DATA_DIR, "blobs", `${id}.mid`))).toBe(false);
  });
});
