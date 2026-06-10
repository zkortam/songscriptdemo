"use client";
import { useQuery } from "@tanstack/react-query";

export interface RollNote {
  time: number;
  midi: number;
  duration: number;
  velocity: number;
  hand: "left" | "right";
}

/** Fetch and parse the full .mid for the playable roll. Cached per id so revisits are instant. */
export function useRollNotes(id: string, url: string) {
  return useQuery({
    queryKey: ["roll", id],
    queryFn: async (): Promise<{ notes: RollNote[]; duration: number }> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not load the audio data.");
      const buf = await res.arrayBuffer();
      const { parseRollNotes } = await import("@/lib/midi");
      return parseRollNotes(buf);
    },
    staleTime: Infinity,
    retry: 1,
  });
}
