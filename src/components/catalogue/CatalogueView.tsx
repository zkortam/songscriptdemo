"use client";
import { useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranscriptions } from "@/data/queries";
import { useUpload } from "@/providers/UploadProvider";
import { useCatalogueParams } from "@/hooks/useCatalogueParams";
import { Toolbar } from "./Toolbar";
import { SongCard } from "./SongCard";
import { SongRow, SongListHeader } from "./SongRow";
import { EmptyState } from "./EmptyState";
import { JumpBackIn } from "./JumpBackIn";
import { DragOverlay } from "./DragOverlay";
import { Button } from "@/components/ui/Button";
import { JUMP_BACK_IN_COUNT } from "@/lib/constants";
import { applyCatalogue } from "@/lib/catalogue";
import type { Transcription } from "@/lib/types";

export function CatalogueView({ initial }: { initial: Transcription[] }) {
  const { data } = useTranscriptions(initial);
  const songs = useMemo(() => data ?? [], [data]);
  const { items } = useUpload();
  const [params, update, clearFilters] = useCatalogueParams();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement | null>(null);

  // "/" focuses search unless already typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(songs.flatMap((s) => s.tags))).sort(),
    [songs],
  );

  const filtered = useMemo(
    () =>
      applyCatalogue(songs, {
        q: params.q,
        favorite: params.favorite,
        tags: params.tags,
        sort: params.sort,
        reversed: params.reversed,
      }),
    [songs, params],
  );

  const jumpBackIn = useMemo(
    () =>
      [...songs]
        .filter((s) => s.lastPracticedAt)
        .sort((a, b) => Date.parse(b.lastPracticedAt!) - Date.parse(a.lastPracticedAt!))
        .slice(0, JUMP_BACK_IN_COUNT),
    [songs],
  );

  const surprise = () => {
    if (songs.length === 0) return;
    const pool = [...songs].sort((a, b) => {
      const at = a.lastPracticedAt ? Date.parse(a.lastPracticedAt) : 0;
      const bt = b.lastPracticedAt ? Date.parse(b.lastPracticedAt) : 0;
      return at - bt;
    });
    const candidates = pool.slice(0, Math.max(1, Math.ceil(pool.length / 2)));
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    router.push(`/song/${pick.id}`);
  };

  const hasFilters = params.q || params.favorite || params.tags.length > 0;
  const showJumpBackIn = !hasFilters && songs.length >= 6 && jumpBackIn.length > 0;
  // Replay the content crossfade on sort/filter/view changes, but not on each
  // keystroke (q is excluded) so typing in search stays instant and flicker-free.
  const viewKey = `${params.sort}|${params.reversed}|${params.favorite}|${params.tags.join(",")}|${params.view}`;

  if (songs.length === 0 && items.length === 0) {
    return (
      <>
        <h1 className="text-[24px] font-semibold tracking-tight">Your library</h1>
        <EmptyState />
        <DragOverlay />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold tracking-tight">Your library</h1>
      {showJumpBackIn && <JumpBackIn songs={jumpBackIn} />}
      <Toolbar
        params={params}
        update={update}
        clearFilters={clearFilters}
        allTags={allTags}
        count={filtered.length}
        total={songs.length}
        onSurprise={surprise}
        searchRef={searchRef}
      />

      {filtered.length === 0 ? (
        hasFilters ? (
          <div className="mx-auto mt-10 max-w-md animate-fade-up rounded-xl glass-card p-8 text-center shadow-soft">
            <p className="text-[15px] font-medium">No songs match your search.</p>
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        ) : null
      ) : params.view === "grid" ? (
        <div
          key={viewKey}
          className="grid animate-fade-up grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      ) : (
        <div key={viewKey} className="animate-fade-up">
          <SongListHeader params={params} update={update} />
          <div className="space-y-0.5">
            {filtered.map((song) => (
              <SongRow key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      <DragOverlay />
    </div>
  );
}
