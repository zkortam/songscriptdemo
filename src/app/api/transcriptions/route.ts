import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { parseMidi } from "@/lib/midi";
import { fail } from "@/lib/http";
import { normalizeTags } from "@/lib/tags";
import { difficultyLabel, shortInstrument } from "@/lib/format";
import { ACCEPTED_EXTENSIONS, MAX_FILE_BYTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const list = await getStore().list({
      q: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });
    return NextResponse.json(list);
  } catch (e) {
    return fail("server_error", (e as Error).message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("no_file", "No file was uploaded.", 400);

    const name = file.name;
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number])) {
      return fail("bad_type", "Only .mid or .midi files are supported.", 400);
    }
    if (file.size === 0) return fail("empty", "That file is empty.", 400);
    if (file.size > MAX_FILE_BYTES) return fail("too_large", "That file is too large.", 413);

    const bytes = await file.arrayBuffer();
    let parsed;
    try {
      parsed = parseMidi(bytes, name);
    } catch (e) {
      return fail("parse_error", `Could not read that MIDI file. ${(e as Error).message}`, 400);
    }

    const tags = normalizeTags([
      difficultyLabel(parsed.difficultyScore),
      parsed.instruments[0] ? shortInstrument(parsed.instruments[0]) : "",
    ]);
    const created = await getStore().create({ parsed, fileName: name, fileSize: file.size, tags, bytes });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return fail("server_error", (e as Error).message, 500);
  }
}
