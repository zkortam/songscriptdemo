import type { Store } from "./types";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase-store";

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Supabase when configured, otherwise a zero-setup local file store. */
export function getStore(): Store {
  return supabaseConfigured() ? new SupabaseStore() : new LocalStore();
}

export type { Store } from "./types";
