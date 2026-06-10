import { Midi } from "@tonejs/midi";
import { PERCUSSION_CHANNEL } from "./constants";
import { computeDifficulty } from "./difficulty";
import { hueFromKey } from "./accent";
import { buildThumb, isBlackKey, type NoteLite } from "./roll-geometry";
import { titleFromFilename } from "./format";
import type { ParsedMidi } from "./types";

const PC_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_NAME_TO_PC: Record<string, number> = {
  C: 0, "B#": 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, Fb: 4,
  F: 5, "E#": 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11, Cb: 11,
};

// Krumhansl-Schmuckler tonal profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

function estimateKey(histogram: number[]): { pc: number; mode: "major" | "minor" } {
  let best = { pc: 0, mode: "major" as "major" | "minor", score: -Infinity };
  for (let tonic = 0; tonic < 12; tonic++) {
    const rotated = histogram.map((_, i) => histogram[(i + tonic) % 12]);
    const maj = pearson(rotated, MAJOR_PROFILE);
    const min = pearson(rotated, MINOR_PROFILE);
    if (maj > best.score) best = { pc: tonic, mode: "major", score: maj };
    if (min > best.score) best = { pc: tonic, mode: "minor", score: min };
  }
  return { pc: best.pc, mode: best.mode };
}

/** Max simultaneous interval (hand span) and average polyphony via a sweep. */
function analyzeSimultaneity(notes: NoteLite[]): { handSpan: number; polyphony: number } {
  type Ev = { t: number; on: boolean; midi: number };
  const events: Ev[] = [];
  for (const n of notes) {
    events.push({ t: n.time, on: true, midi: n.midi });
    events.push({ t: n.time + Math.max(0.001, n.duration), on: false, midi: n.midi });
  }
  events.sort((a, b) => a.t - b.t || Number(a.on) - Number(b.on));
  const active: number[] = [];
  let maxSpan = 0;
  let polySum = 0;
  let onsets = 0;
  for (const e of events) {
    if (e.on) {
      active.push(e.midi);
      onsets++;
      polySum += active.length;
      maxSpan = Math.max(maxSpan, Math.max(...active) - Math.min(...active));
    } else {
      const i = active.indexOf(e.midi);
      if (i >= 0) active.splice(i, 1);
    }
  }
  return { handSpan: maxSpan, polyphony: onsets ? polySum / onsets : 1 };
}

export function parseMidi(buf: ArrayBuffer, fileName: string): ParsedMidi {
  const midi = new Midi(buf);

  const duration = Math.max(0.001, midi.duration);
  const tempoBpm = midi.header.tempos[0]?.bpm ?? 120;
  const ts = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4];
  const timeSignature = `${ts[0]}/${ts[1]}`;

  const melodic: NoteLite[] = [];
  const instruments = new Set<string>();
  let hasPercussion = false;
  for (const track of midi.tracks) {
    const isPerc = track.channel === PERCUSSION_CHANNEL;
    if (isPerc) {
      if (track.notes.length) hasPercussion = true;
      continue;
    }
    if (track.instrument?.name) instruments.add(track.instrument.name);
    for (const note of track.notes) {
      melodic.push({ time: note.time, midi: note.midi, duration: note.duration });
    }
  }
  if (hasPercussion) instruments.add("Drums");

  const isPercussionOnly = melodic.length === 0;
  const notes = melodic;
  if (notes.length === 0) {
    throw new Error("This file has no playable notes.");
  }

  const lowestNote = notes.reduce((m, n) => Math.min(m, n.midi), 127);
  const highestNote = notes.reduce((m, n) => Math.max(m, n.midi), 0);

  // Duration-weighted pitch-class histogram for key estimation.
  const histogram = new Array(12).fill(0);
  for (const n of notes) histogram[((n.midi % 12) + 12) % 12] += Math.max(0.001, n.duration);

  // Prefer an embedded key signature; otherwise estimate.
  const headerKey = midi.header.keySignatures[0];
  let pc: number;
  let mode: "major" | "minor";
  let keyIsEstimated: boolean;
  if (headerKey && KEY_NAME_TO_PC[headerKey.key] !== undefined) {
    pc = KEY_NAME_TO_PC[headerKey.key];
    mode = headerKey.scale === "minor" ? "minor" : "major";
    keyIsEstimated = false;
  } else {
    const est = estimateKey(histogram);
    pc = est.pc;
    mode = est.mode;
    keyIsEstimated = true;
  }
  const keySignature = `${PC_NAMES[pc]} ${mode}`;
  const accentHue = hueFromKey(pc, mode);

  const { handSpan, polyphony } = analyzeSimultaneity(notes);
  const accidentalRatio = notes.filter((n) => isBlackKey(n.midi)).length / notes.length;
  const { score: difficultyScore, parts: difficultyParts } = computeDifficulty({
    density: notes.length / duration,
    tempo: tempoBpm,
    handSpan,
    range: highestNote - lowestNote,
    polyphony,
    accidentalRatio,
  });

  const thumb = buildThumb(notes, lowestNote, highestNote, duration);

  return {
    title: titleFromFilename(fileName),
    durationSeconds: duration,
    tempoBpm,
    keySignature,
    keyIsEstimated,
    timeSignature,
    trackCount: midi.tracks.filter((t) => t.notes.length).length,
    noteCount: notes.length,
    lowestNote,
    highestNote,
    instruments: Array.from(instruments),
    isPercussionOnly,
    difficultyScore,
    difficultyParts,
    accentHue,
    thumb,
  };
}

/** Full notes for the playable roll (client-side), split by hand. */
export function parseRollNotes(buf: ArrayBuffer): {
  notes: { time: number; midi: number; duration: number; velocity: number; hand: "left" | "right" }[];
  duration: number;
} {
  const midi = new Midi(buf);
  const melodicTracks = midi.tracks.filter((t) => t.channel !== PERCUSSION_CHANNEL && t.notes.length);
  const byTrack = melodicTracks.length >= 2;
  const notes = melodicTracks.flatMap((track, idx) =>
    track.notes.map((n) => ({
      time: n.time,
      midi: n.midi,
      duration: n.duration,
      velocity: n.velocity,
      hand: (byTrack ? (idx === 0 ? "right" : "left") : n.midi >= 60 ? "right" : "left") as
        | "left"
        | "right",
    })),
  );
  return { notes, duration: Math.max(0.001, midi.duration) };
}
