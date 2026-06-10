import {
  ACCENT_HUE_MIN,
  ACCENT_HUE_MAX,
  ACCENT_SAT,
  ACCENT_LIGHT_LIGHT,
  ACCENT_LIGHT_DARK,
} from "./constants";

/**
 * Per-song accent derived from the music: tonic pitch-class maps to a hue
 * inside the brand green->cyan band; minor shifts it cooler/deeper. The result
 * is meaningful (color encodes key) and cohesive (always in-band).
 */
export function hueFromKey(pitchClass: number, mode: "major" | "minor"): number {
  const pc = ((pitchClass % 12) + 12) % 12;
  const span = ACCENT_HUE_MAX - ACCENT_HUE_MIN;
  let hue = ACCENT_HUE_MIN + (pc / 12) * span;
  if (mode === "minor") hue = Math.min(ACCENT_HUE_MAX, hue + span * 0.12);
  return Math.round(hue);
}

/** Build the accent color string for the current theme. */
export function accentColor(hue: number, isDark: boolean, alpha = 1): string {
  const light = isDark ? ACCENT_LIGHT_DARK : ACCENT_LIGHT_LIGHT;
  const sat = ACCENT_SAT;
  return alpha >= 1
    ? `hsl(${hue} ${sat}% ${light}%)`
    : `hsl(${hue} ${sat}% ${light}% / ${alpha})`;
}
