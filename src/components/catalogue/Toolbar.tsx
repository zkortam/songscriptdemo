"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown, SlidersHorizontal, LayoutGrid, List, Shuffle, Check, Heart } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { Chip } from "@/components/ui/Chip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { SORT_OPTIONS } from "@/lib/constants";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";
import type { CatalogueParams, ParamPatch } from "@/hooks/useCatalogueParams";

export function Toolbar({
  params,
  update,
  clearFilters,
  allTags,
  count,
  total,
  onSurprise,
  searchRef,
}: {
  params: CatalogueParams;
  update: (p: ParamPatch) => void;
  clearFilters: () => void;
  allTags: string[];
  count: number;
  total: number;
  onSurprise: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [text, setText] = useState(params.q);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => update({ q: text }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilters = (params.favorite ? 1 : 0) + params.tags.length;
  const sortLabel = SORT_OPTIONS.find((s) => s.key === params.sort)?.label ?? "Recently added";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            ref={searchRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search songs"
            aria-label="Search songs"
            className="pl-10 pr-9"
          />
          {text && (
            <button
              aria-label="Clear search"
              onClick={() => setText("")}
              className={cn(
                "absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-faint hover:text-ink",
                focusRing,
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
        <Popover
          align="start"
          trigger={
            <Button variant="ghost" size="sm">
              {sortLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          }
        >
          {(close) =>
            SORT_OPTIONS.map((opt) => {
              const active = opt.key === params.sort;
              return (
                <button
                  key={opt.key}
                  role="menuitem"
                  onClick={() => {
                    if (active) update({ reversed: !params.reversed });
                    else update({ sort: opt.key, reversed: false });
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[14px] hover:bg-surface/70",
                    focusRing,
                  )}
                >
                  <span className={cn(active && "font-medium text-green-600 dark:text-green-300")}>
                    {opt.label}
                  </span>
                  {active && <Check className="h-4 w-4 text-green-600 dark:text-green-300" />}
                </button>
              );
            })
          }
        </Popover>

        <Popover
          align="start"
          className="w-64"
          trigger={
            <Button variant="ghost" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilters > 0 && (
                <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-green-500/20 px-1 text-[13px] font-medium text-green-700 dark:text-green-300">
                  {activeFilters}
                </span>
              )}
            </Button>
          }
        >
          <div className="space-y-2 p-1">
            <button
              onClick={() => update({ favorite: !params.favorite })}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] transition",
                params.favorite
                  ? "bg-green-500/15 font-medium text-green-700 dark:text-green-300"
                  : "text-ink hover:bg-surface/70",
                focusRing,
              )}
            >
              <Heart className={cn("h-[18px] w-[18px]", params.favorite && "fill-current")} />
              Favorites only
              {params.favorite && <Check className="ml-auto h-4 w-4" />}
            </button>
            {allTags.length > 0 && (
              <div className="pt-1">
                <p className="mb-2 px-1 text-[12px] font-medium uppercase tracking-wide text-faint">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5 px-0.5">
                  {allTags.map((tag) => {
                    const on = params.tags.includes(tag);
                    return (
                      <Chip
                        key={tag}
                        active={on}
                        onClick={() =>
                          update({
                            tags: on ? params.tags.filter((t) => t !== tag) : [...params.tags, tag],
                          })
                        }
                      >
                        {tag}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            )}
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className={cn(
                  "w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-muted transition hover:bg-surface/60 hover:text-ink",
                  focusRing,
                )}
              >
                Clear all filters
              </button>
            )}
          </div>
        </Popover>

        <SegmentedToggle
          value={params.view}
          onChange={(v) => update({ view: v })}
          options={[
            { value: "grid", icon: <LayoutGrid className="h-4 w-4" />, ariaLabel: "Grid view" },
            { value: "list", icon: <List className="h-4 w-4" />, ariaLabel: "List view" },
          ]}
        />

        <Button variant="ghost" size="sm" aria-label="Surprise me" className="px-3" onClick={onSurprise}>
          <Shuffle className="h-[18px] w-[18px]" />
        </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <span className="tabular-nums">
          {count === total ? `${total} songs` : `${count} of ${total}`}
        </span>
        {params.favorite && <Chip active onRemove={() => update({ favorite: false })}>Favorites</Chip>}
        {params.tags.map((tag) => (
          <Chip key={tag} active onRemove={() => update({ tags: params.tags.filter((t) => t !== tag) })}>
            {tag}
          </Chip>
        ))}
      </div>
    </div>
  );
}
