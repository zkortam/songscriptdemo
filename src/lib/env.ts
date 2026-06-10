import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

let cached: z.infer<typeof schema> | null = null;

/** Validate server env lazily (at first request, not at build time). */
export function getEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  cached = parsed.data;
  return cached;
}
