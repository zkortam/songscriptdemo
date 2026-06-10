/**
 * Every non-style magic number lives here, named and documented.
 */

// Upload
export const ACCEPTED_EXTENSIONS = [".mid", ".midi"] as const;
export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB; MIDI is KB-sized
export const UPLOAD_CONCURRENCY = 2;

// Thumbnail fingerprint (compact, stored per row)
export const THUMB_COLUMNS = 64; // downsampled columns {x,lo,hi,top}

// Catalogue
export const SEARCH_DEBOUNCE_MS = 160;
export const GRID_OVERSCAN_ROWS = 3;
export const LIST_OVERSCAN_ROWS = 6;
export const LIST_ROW_HEIGHT = 60;
export const JUMP_BACK_IN_COUNT = 8;

// Tags
export const MAX_TAGS = 8;
export const MAX_TAG_LEN = 24;
export const MAX_TITLE_LEN = 80;

// Difficulty model: reference bounds + weights (sum to 1). See lib/difficulty.ts.
export const DIFFICULTY_WEIGHTS = {
  speed: 0.2,
  density: 0.25,
  handSpan: 0.2,
  range: 0.15,
  harmony: 0.2,
} as const;
export const DIFFICULTY_BOUNDS = {
  density: 10, // notes/sec mapped to 0..1 over 0..10
  tempoMin: 40,
  tempoMax: 200,
  handSpan: 14, // semitones
  range: 60, // semitones (5 octaves)
  polyphony: 6, // simultaneous voices
} as const;

// Accent: per-song hue derived from the key, constrained to the brand band
export const ACCENT_HUE_MIN = 150; // green
export const ACCENT_HUE_MAX = 195; // cyan
export const ACCENT_SAT = 50; // %
export const ACCENT_LIGHT_LIGHT = 42; // % in light theme
export const ACCENT_LIGHT_DARK = 60; // % in dark theme

// Playback
export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25] as const;
export const DEFAULT_SPEED = 1;
export const FALL_WINDOW_SECONDS = 5; // lookahead above the keyboard line
export const ROLL_MIN_OCTAVES = 2;
export const VELOCITY_OPACITY_MIN = 0.55;
export const VELOCITY_OPACITY_MAX = 1;
export const MIDDLE_C = 60; // hand-split fallback, C4
export const PERCUSSION_CHANNEL = 9; // 0-indexed channel 10

// Sampler: Salamander subset (every minor third), lazy-loaded
export const SAMPLER_BASE_URL = "https://tonejs.github.io/audio/salamander/";
export const SAMPLER_NOTES = [
  "A1", "C2", "D#2", "F#2", "A2", "C3", "D#3", "F#3",
  "A3", "C4", "D#4", "F#4", "A4", "C5", "D#5", "F#5", "A5", "C6",
] as const;

// Sort options (single source; list headers bind to these too)
export const SORT_OPTIONS = [
  { key: "recent", label: "Recently added" },
  { key: "title", label: "Title" },
  { key: "tempo", label: "Tempo" },
  { key: "difficulty", label: "Difficulty" },
  { key: "practiced", label: "Recently practiced" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["key"];
export const DEFAULT_SORT: SortKey = "recent";

// Bundled samples for the empty state
export const SAMPLE_FILES = [
  { file: "twinkle-twinkle.mid", label: "Twinkle Twinkle" },
  { file: "c-major-scale.mid", label: "C major scale" },
  { file: "beethoven-fur-elise.mid", label: "Für Elise" },
] as const;
