import type { Transcription } from "./types";

export interface CatalogueFilter {
  q: string;
  favorite: boolean;
  tags: string[];
  sort: string;
  reversed: boolean;
}

export function compareSongs(a: Transcription, b: Transcription, sort: string): number {
  switch (sort) {
    case "title":
      return a.title.localeCompare(b.title);
    case "tempo":
      return a.tempoBpm - b.tempoBpm;
    case "difficulty":
      return a.difficultyScore - b.difficultyScore;
    case "practiced": {
      const at = a.lastPracticedAt ? Date.parse(a.lastPracticedAt) : -1;
      const bt = b.lastPracticedAt ? Date.parse(b.lastPracticedAt) : -1;
      return bt - at;
    }
    default:
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  }
}

/** Filter (favorite AND tags-OR AND search over title+tags) then sort, then optional reverse. */
export function applyCatalogue(songs: Transcription[], f: CatalogueFilter): Transcription[] {
  const q = f.q.trim().toLowerCase();
  let list = songs.filter((s) => {
    if (f.favorite && !s.isFavorite) return false;
    if (f.tags.length && !f.tags.some((t) => s.tags.includes(t))) return false;
    if (q && !(s.title.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q)))) return false;
    return true;
  });
  list = [...list].sort((a, b) => compareSongs(a, b, f.sort));
  if (f.reversed) list.reverse();
  return list;
}
