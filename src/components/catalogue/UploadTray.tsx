"use client";
import { X, RotateCcw, Check, AudioWaveform } from "lucide-react";
import { useUpload } from "@/providers/UploadProvider";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";

export function UploadTray() {
  const { items, retry, cancel, dismiss } = useUpload();
  if (items.length === 0) return null;
  const active = items.filter((i) => i.status !== "success" && i.status !== "error").length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl glass-chrome p-3 shadow-soft-hover">
      <p className="px-1 pb-2 text-[13px] font-medium text-muted">
        {active > 0 ? `Uploading ${active} of ${items.length}` : "Uploads"}
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface/60 text-green-600 dark:text-green-300">
              {item.status === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <AudioWaveform className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">
                {item.detected?.title ?? item.file.name}
              </p>
              {item.status === "error" ? (
                <p className="truncate text-[13px] text-danger">{item.error}</p>
              ) : item.status === "success" ? (
                <p className="text-[13px] text-muted">Added</p>
              ) : (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-green-500 transition-[width] duration-200 dark:bg-green-400"
                    style={{
                      width:
                        item.status === "uploading" ? `${Math.round(item.progress * 100)}%` : "15%",
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex shrink-0">
              {item.status === "error" && (
                <button
                  aria-label="Retry"
                  onClick={() => retry(item.id)}
                  className={cn("grid h-7 w-7 place-items-center rounded-full text-muted hover:text-ink", focusRing)}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              {item.status !== "success" && (
                <button
                  aria-label={item.status === "error" ? "Dismiss" : "Cancel"}
                  onClick={() => (item.status === "error" ? dismiss(item.id) : cancel(item.id))}
                  className={cn("grid h-7 w-7 place-items-center rounded-full text-muted hover:text-ink", focusRing)}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
