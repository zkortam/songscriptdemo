"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchTranscriptions, patchTranscription, deleteTranscription, type PatchBody } from "./api";
import type { Transcription } from "@/lib/types";

export const qk = { list: ["transcriptions"] as const };

export function useTranscriptions(initial?: Transcription[]) {
  return useQuery({
    queryKey: qk.list,
    queryFn: fetchTranscriptions,
    initialData: initial,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** One song read from the shared list cache (so edits reflect everywhere), with SSR fallback. */
export function useTranscription(id: string, initial?: Transcription): Transcription | undefined {
  const { data } = useTranscriptions();
  return data?.find((t) => t.id === id) ?? initial;
}

/** Optimistic patch on the shared list cache, with rollback. */
function useOptimisticPatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchBody }) => patchTranscription(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: qk.list });
      const prev = qc.getQueryData<Transcription[]>(qk.list);
      qc.setQueryData<Transcription[]>(qk.list, (old) =>
        (old ?? []).map((t) =>
          t.id === id
            ? {
                ...t,
                ...(body.title !== undefined ? { title: body.title } : {}),
                ...(body.isFavorite !== undefined ? { isFavorite: body.isFavorite } : {}),
                ...(body.tags !== undefined ? { tags: body.tags } : {}),
              }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.list, ctx.prev);
    },
    onSuccess: (updated) => {
      qc.setQueryData<Transcription[]>(qk.list, (old) =>
        (old ?? []).map((t) => (t.id === updated.id ? updated : t)),
      );
    },
  });
}

export function useToggleFavorite() {
  const patch = useOptimisticPatch();
  return (t: Transcription) => patch.mutate({ id: t.id, body: { isFavorite: !t.isFavorite } });
}

export function useRename() {
  const patch = useOptimisticPatch();
  return (id: string, title: string) => patch.mutateAsync({ id, body: { title } });
}

export function useSetTags() {
  const patch = useOptimisticPatch();
  return (id: string, tags: string[]) => patch.mutate({ id, body: { tags } });
}

export function useLogPractice() {
  const patch = useOptimisticPatch();
  return (id: string) => patch.mutate({ id, body: { action: "practice" } });
}

/** Delete optimistically with a real Undo window: the server DELETE is deferred until the toast settles. */
export function useDeleteWithUndo() {
  const qc = useQueryClient();
  return (t: Transcription) => {
    qc.setQueryData<Transcription[]>(qk.list, (old) => (old ?? []).filter((x) => x.id !== t.id));
    let settled = false;
    const restore = () =>
      qc.setQueryData<Transcription[]>(qk.list, (old) => {
        const arr = old ?? [];
        return arr.some((x) => x.id === t.id) ? arr : [t, ...arr];
      });
    const commit = () => {
      if (settled) return;
      settled = true;
      deleteTranscription(t.id).catch(() => {
        restore();
        toast.error(`Could not delete ${t.title}.`);
      });
    };
    toast(`Deleted ${t.title}`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          settled = true;
          restore();
        },
      },
      onAutoClose: commit,
      onDismiss: commit,
    });
  };
}
