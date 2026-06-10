"use client";
import { useMemo, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
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
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  // Only paint the sticky toolbar's backdrop once it's actually pinned to the top.
  // At rest it stays transparent so it doesn't show as a box over the brand glow.
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const onScroll = () => {
      const offset = window.matchMedia("(min-width: 1024px)").matches ? 0 : 56;
      setStuck(el.getBoundingClientRect().top <= offset + 0.5);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
  // Only crossfade when switching grid<->list. Sorting/filtering keep the same
  // container so rows just reconcile and reorder in place — no entrance-animation
  // replay, no flicker, no scroll jump.

  if (songs.length === 0 && items.length === 0) {
    return (
      <>
        <h1 className="text-[24px] font-semibold tracking-tight">Your library</h1>
        <div className="grid min-h-[60svh] place-items-center">
          <EmptyState />
        </div>
        <DragOverlay />
      </>
    );
  }

  const favoritesOnly = params.favorite && !params.q && params.tags.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold tracking-tight">Your library</h1>
      {showJumpBackIn && <JumpBackIn songs={jumpBackIn} />}
      {/* Full-bleed sticky bar: the background spans the whole content area
          (sidebar edge → viewport edge) via a viewport-width centering trick,
          while the inner column keeps the controls aligned with the cards. */}
      <div
        ref={toolbarRef}
        style={{ width: "calc(100vw - var(--sidebar-w))", marginLeft: "50%", transform: "translateX(-50%)" }}
        className={cn(
          "sticky top-[56px] z-20 py-2 transition-colors duration-200 lg:top-0",
          stuck && "bg-canvas/85 backdrop-blur-sm",
        )}
      >
        <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-10">
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
        </div>
      </div>

      {filtered.length === 0 ? (
        hasFilters ? (
          <div className="mx-auto mt-10 max-w-md animate-fade-up rounded-xl glass-card p-8 text-center shadow-soft">
            <p className="text-[15px] font-medium">
              {favoritesOnly ? "No favorites yet." : "No songs match your filters."}
            </p>
            <p className="mt-1 text-[13px] text-muted">
              {favoritesOnly
                ? "Tap the heart on any song to save it here."
                : "Try removing a filter or searching for something else."}
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {favoritesOnly ? "Browse all songs" : "Clear filters"}
              </Button>
            </div>
          </div>
        ) : null
      ) : params.view === "grid" ? (
        <div
          key={params.view}
          className="grid animate-fade-up grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      ) : (
        <div key={params.view} className="animate-fade-up">
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
