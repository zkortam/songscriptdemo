import { MAX_TAGS, MAX_TAG_LEN } from "./constants";

export function normalizeTag(input: string): string | null {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return s ? s.slice(0, MAX_TAG_LEN) : null;
}

export function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const n = normalizeTag(t);
    if (n && !out.includes(n) && out.length < MAX_TAGS) out.push(n);
  }
  return out;
}
