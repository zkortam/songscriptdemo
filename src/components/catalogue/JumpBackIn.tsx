"use client";
import { useEffect, useRef, useState } from "react";
import { SongCard } from "./SongCard";
import type { Transcription } from "@/lib/types";

const FADE = "2.5rem";

export function JumpBackIn({ songs }: { songs: Transcription[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Fade an edge only when there is content scrolled past it — so the first card
  // isn't dimmed at rest, and the fade tracks the actual scroll position.
  const [edges, setEdges] = useState({ left: false, right: true });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setEdges({
        left: scrollLeft > 4,
        right: scrollLeft < scrollWidth - clientWidth - 4,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [songs.length]);

  if (songs.length === 0) return null;

  const left = edges.left ? `transparent 0, #000 ${FADE}` : "#000 0";
  const right = edges.right ? `#000 calc(100% - ${FADE}), transparent 100%` : "#000 100%";
  const mask = `linear-gradient(to right, ${left}, ${right})`;

  return (
    <section className="space-y-2">
      <h2 className="text-[15px] font-semibold text-muted">Jump back in</h2>
      {/* pt/pb give the cards' drop shadows room — overflow-x-auto would otherwise clip them vertically */}
      <div
        ref={scrollRef}
        style={{ WebkitMaskImage: mask, maskImage: mask }}
        className="-mx-2 -mb-3 flex gap-3 overflow-x-auto px-2 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {songs.map((song) => (
          <div key={song.id} className="w-[260px] shrink-0">
            <SongCard song={song} />
          </div>
        ))}
      </div>
    </section>
  );
}
