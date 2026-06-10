import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { fail } from "@/lib/http";
import { MAX_TITLE_LEN } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Whitelist of user-editable fields. Clients cannot write arbitrary columns.
const PatchSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LEN).optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).max(32).optional(),
  action: z.literal("practice").optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = PatchSchema.safeParse(await req.json());
    if (!body.success) return fail("bad_input", "Invalid update.", 400);

    const updated = await getStore().update(id, {
      title: body.data.title,
      isFavorite: body.data.isFavorite,
      tags: body.data.tags,
      practice: body.data.action === "practice",
    });
    if (!updated) return fail("not_found", "That song does not exist.", 404);
    return NextResponse.json(updated);
  } catch (e) {
    return fail("server_error", (e as Error).message, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await getStore().remove(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail("server_error", (e as Error).message, 500);
  }
}
