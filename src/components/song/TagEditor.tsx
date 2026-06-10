"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { useSetTags } from "@/data/queries";
import { normalizeTag } from "@/lib/tags";
import { MAX_TAGS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";
import type { Transcription } from "@/lib/types";

export function TagEditor({ song, allTags }: { song: Transcription; allTags: string[] }) {
  const setTags = useSetTags();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const add = (raw: string) => {
    const n = normalizeTag(raw);
    if (!n || song.tags.includes(n) || song.tags.length >= MAX_TAGS) return;
    setTags(song.id, [...song.tags, n]);
    setText("");
  };
  const remove = (t: string) => setTags(song.id, song.tags.filter((x) => x !== t));

  const suggestions = allTags
    .filter((t) => !song.tags.includes(t) && (text ? t.includes(text.toLowerCase()) : true))
    .slice(0, 5);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {song.tags.map((t) => (
        <Chip key={t} onRemove={() => remove(t)}>
          {t}
        </Chip>
      ))}
      {adding ? (
        <span className="relative">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add(text);
              if (e.key === "Escape") {
                setText("");
                setAdding(false);
              }
            }}
            onBlur={() => setTimeout(() => setAdding(false), 120)}
            placeholder="Add tag"
            className={cn("h-8 w-28 rounded-full glass-card px-3 text-[13px] placeholder:text-faint", focusRing)}
          />
          {suggestions.length > 0 && (
            <span className="absolute left-0 top-[calc(100%+6px)] z-50 flex flex-col gap-0.5 rounded-xl glass-chrome p-1.5 shadow-soft">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(s);
                  }}
                  className={cn("rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface/70", focusRing)}
                >
                  {s}
                </button>
              ))}
            </span>
          )}
        </span>
      ) : (
        song.tags.length < MAX_TAGS && (
          <button
            onClick={() => setAdding(true)}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] text-muted hover:text-ink",
              focusRing,
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Add tag
          </button>
        )
      )}
    </div>
  );
}
