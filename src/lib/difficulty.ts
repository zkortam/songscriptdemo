import { DIFFICULTY_WEIGHTS, DIFFICULTY_BOUNDS } from "./constants";
import type { DifficultyParts } from "./types";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface DifficultyRaw {
  density: number; // notes per second
  tempo: number; // bpm
  handSpan: number; // max simultaneous interval, semitones
  range: number; // highest - lowest, semitones
  polyphony: number; // average simultaneous voices
  accidentalRatio: number; // 0..1 fraction of black-key notes
}

/**
 * Decomposes difficulty into five named, normalized sub-scores (each 0..1),
 * then weights them (weights sum to 1) into a 0..100 score. Deterministic.
 * The same `parts` feed the difficulty ring UI, so there is one formula.
 */
export function computeDifficulty(raw: DifficultyRaw): {
  score: number;
  parts: DifficultyParts;
} {
  const b = DIFFICULTY_BOUNDS;
  const parts: DifficultyParts = {
    density: clamp01(raw.density / b.density),
    speed: clamp01((raw.tempo - b.tempoMin) / (b.tempoMax - b.tempoMin)),
    handSpan: clamp01(raw.handSpan / b.handSpan),
    range: clamp01(raw.range / b.range),
    harmony: clamp01((raw.polyphony - 1) / (b.polyphony - 1)) * 0.7 + clamp01(raw.accidentalRatio) * 0.3,
  };
  const w = DIFFICULTY_WEIGHTS;
  const score =
    parts.speed * w.speed +
    parts.density * w.density +
    parts.handSpan * w.handSpan +
    parts.range * w.range +
    parts.harmony * w.harmony;
  return { score: Math.round(clamp01(score) * 100), parts };
}
