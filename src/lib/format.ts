const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** MIDI number to scientific note name. C4 = 60. */
export function midiToNoteName(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

/** Seconds to m:ss, or h:mm:ss past an hour. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  if (h > 0) return `${h}:${mm}:${String(sec).padStart(2, "0")}`;
  return `${mm}:${String(sec).padStart(2, "0")}`;
}

export function formatTempo(bpm: number): string {
  return `${Math.round(bpm)} BPM`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function difficultyLabel(score: number): "Beginner" | "Intermediate" | "Advanced" {
  if (score <= 33) return "Beginner";
  if (score <= 66) return "Intermediate";
  return "Advanced";
}

/** "A minor", with a quiet "(est.)" when estimated. */
export function keyLabel(keySignature: string, estimated: boolean): string {
  return estimated ? `${keySignature} (est.)` : keySignature;
}

/** Human relative time. No em dashes, sentence-friendly. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "Not practiced yet";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Collapse a verbose GM instrument name to a short family tag, e.g. "acoustic grand piano" -> "piano". */
export function shortInstrument(name: string): string {
  const n = name.toLowerCase();
  const families = [
    "piano", "guitar", "bass", "violin", "viola", "cello", "flute", "clarinet",
    "trumpet", "trombone", "sax", "organ", "synth", "strings", "harp", "banjo", "accordion",
  ];
  for (const f of families) if (n.includes(f)) return f;
  if (n.includes("drum")) return "drums";
  if (n.includes("voice") || n.includes("vocal") || n.includes("choir")) return "vocals";
  const words = n.split(/\s+/);
  return words[words.length - 1] || n;
}

/** "beethoven-fur-elise.mid" -> "Beethoven Fur Elise". */
export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const words = base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  return words
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
