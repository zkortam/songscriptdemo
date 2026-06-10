import { ACCEPTED_EXTENSIONS } from "./constants";

/** True if the file looks like a MIDI file by extension. */
export function isMidiFile(file: File): boolean {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext as (typeof ACCEPTED_EXTENSIONS)[number]);
}

/**
 * Why MP3 isn't accepted: this app reads structured note data straight out of
 * MIDI files. Audio (MP3/WAV) is just a waveform with no notes, so turning it
 * into something playable needs audio-to-MIDI transcription — a separate model,
 * not a parser tweak. We say so instead of silently ignoring the drop.
 */
export const NON_MIDI_MESSAGE =
  "Songscription reads note data from MIDI files. Audio transcription (MP3/WAV → MIDI) isn't available yet — upload a .mid or .midi file.";

/** Partition a dropped/selected set into MIDI files and everything else. */
export function splitMidiFiles(files: File[]): { midi: File[]; rejected: File[] } {
  const midi: File[] = [];
  const rejected: File[] = [];
  for (const f of files) (isMidiFile(f) ? midi : rejected).push(f);
  return { midi, rejected };
}
