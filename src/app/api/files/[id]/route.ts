import { NextRequest } from "next/server";
import { LocalStore } from "@/lib/store/local";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Serves locally-stored MIDI (local store only; Supabase uses public Storage URLs). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const buf = await new LocalStore().readBlob(id);
  if (!buf) return fail("not_found", "File not found.", 404);
  return new Response(new Uint8Array(buf), {
    headers: { "content-type": "audio/midi", "cache-control": "public, max-age=31536000" },
  });
}
