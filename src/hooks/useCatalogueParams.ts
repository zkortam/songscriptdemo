"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DEFAULT_SORT, type SortKey } from "@/lib/constants";

export interface CatalogueParams {
  q: string;
  sort: SortKey;
  reversed: boolean;
  favorite: boolean;
  tags: string[];
  view: "grid" | "list";
}

export interface ParamPatch {
  q?: string;
  sort?: SortKey;
  reversed?: boolean;
  favorite?: boolean;
  tags?: string[];
  view?: "grid" | "list";
}

export function useCatalogueParams(): [CatalogueParams, (patch: ParamPatch) => void, () => void] {
  const pathname = usePathname();
  const sp = useSearchParams();

  // Sort/filter/view are purely client-side concerns (the list is already loaded
  // and sorted in the browser). Updating the URL with history.replaceState keeps
  // it shareable and back-button friendly WITHOUT a Next navigation — so it never
  // re-runs the dynamic server component, flashes loading.tsx, or jumps scroll.
  // Next's useSearchParams reads pushState/replaceState natively.
  const writeUrl = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname],
  );

  const params: CatalogueParams = {
    q: sp.get("q") ?? "",
    sort: (sp.get("sort") as SortKey) || DEFAULT_SORT,
    reversed: sp.get("rev") === "1",
    favorite: sp.get("fav") === "1",
    tags: sp.get("tags") ? sp.get("tags")!.split(",").filter(Boolean) : [],
    view: sp.get("view") === "list" ? "list" : "grid",
  };

  const update = useCallback(
    (patch: ParamPatch) => {
      const next = new URLSearchParams(sp.toString());
      const setOrDel = (key: string, val: string | undefined | null, empty: string) => {
        if (val === undefined) return;
        if (!val || val === empty) next.delete(key);
        else next.set(key, val);
      };
      if (patch.q !== undefined) setOrDel("q", patch.q, "");
      if (patch.sort !== undefined) setOrDel("sort", patch.sort, DEFAULT_SORT);
      if (patch.reversed !== undefined) setOrDel("rev", patch.reversed ? "1" : "", "");
      if (patch.favorite !== undefined) setOrDel("fav", patch.favorite ? "1" : "", "");
      if (patch.tags !== undefined) setOrDel("tags", patch.tags.join(","), "");
      if (patch.view !== undefined) setOrDel("view", patch.view === "list" ? "list" : "", "");
      writeUrl(next);
    },
    [sp, writeUrl],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(sp.toString());
    ["q", "fav", "tags"].forEach((k) => next.delete(k));
    writeUrl(next);
  }, [sp, writeUrl]);

  return [params, update, clearFilters];
}
