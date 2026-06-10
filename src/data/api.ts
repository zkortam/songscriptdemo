import type { Transcription, ApiError } from "@/lib/types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Something went wrong.";
    try {
      message = ((await res.json()) as ApiError).error.message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function fetchTranscriptions(): Promise<Transcription[]> {
  return fetch("/api/transcriptions").then((r) => handle<Transcription[]>(r));
}

export interface PatchBody {
  title?: string;
  isFavorite?: boolean;
  tags?: string[];
  action?: "practice";
}

export function patchTranscription(id: string, body: PatchBody): Promise<Transcription> {
  return fetch(`/api/transcriptions/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => handle<Transcription>(r));
}

export function deleteTranscription(id: string): Promise<void> {
  return fetch(`/api/transcriptions/${id}`, { method: "DELETE" }).then((r) => handle(r));
}

/** Upload with progress (XHR) and cancellation (AbortSignal). */
export function uploadTranscription(
  file: File,
  opts: { onProgress?: (p: number) => void; signal?: AbortSignal } = {},
): Promise<Transcription> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", "/api/transcriptions");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          reject(new Error((JSON.parse(xhr.responseText) as ApiError).error.message));
        } catch {
          reject(new Error("Upload failed."));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    opts.signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(form);
  });
}
