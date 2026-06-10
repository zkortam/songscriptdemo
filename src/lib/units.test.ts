import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyCatalogue } from "./catalogue";
import { buildThumb, fingerprintPaths, rangeForRoll, isBlackKey, keyboardLayout } from "./roll-geometry";
import { normalizeTags } from "./tags";
import { parseMidi, parseRollNotes } from "./midi";
import { THUMB_COLUMNS, MAX_TAGS } from "./constants";
import type { Transcription } from "./types";

function loadSample(name: string): ArrayBuffer {
  const b = readFileSync(join(process.cwd(), "public/samples", name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function song(over: Partial<Transcription>): Transcription {
  return {
    id: "x", createdAt: "2024-01-01", updatedAt: "2024-01-01", title: "A", fileName: "a.mid",
    filePath: "a.mid", fileSize: 1, durationSeconds: 1, tempoBpm: 100, keySignature: "C major",
    keyIsEstimated: true, timeSignature: "4/4", trackCount: 1, noteCount: 1, lowestNote: 60,
    highestNote: 72, instruments: [], isPercussionOnly: false, difficultyScore: 50,
    difficultyParts: { speed: 0, density: 0, handSpan: 0, range: 0, harmony: 0 }, accentHue: 170,
    isFavorite: false, tags: [], lastPracticedAt: null, practiceCount: 0, accuracyPct: null,
    thumb: [], url: "u", ...over,
  };
}

describe("applyCatalogue", () => {
  const songs = [
    song({ id: "1", title: "Alpha", tempoBpm: 120, isFavorite: true, tags: ["jazz"], createdAt: "2024-03-01" }),
    song({ id: "2", title: "Bravo", tempoBpm: 90, tags: ["rock"], createdAt: "2024-02-01", lastPracticedAt: "2024-05-01" }),
    song({ id: "3", title: "Charlie", tempoBpm: 150, tags: ["jazz"], createdAt: "2024-01-01" }),
  ];
  const base = { q: "", favorite: false, tags: [] as string[], sort: "recent", reversed: false };

  it("sorts by recent (newest first) by default", () => {
    expect(applyCatalogue(songs, base).map((s) => s.id)).toEqual(["1", "2", "3"]);
  });
  it("reverses", () => {
    expect(applyCatalogue(songs, { ...base, reversed: true }).map((s) => s.id)).toEqual(["3", "2", "1"]);
  });
  it("sorts by tempo and title", () => {
    expect(applyCatalogue(songs, { ...base, sort: "tempo" }).map((s) => s.tempoBpm)).toEqual([90, 120, 150]);
    expect(applyCatalogue(songs, { ...base, sort: "title" }).map((s) => s.title)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });
  it("filters favorites, tags (OR), and search", () => {
    expect(applyCatalogue(songs, { ...base, favorite: true }).map((s) => s.id)).toEqual(["1"]);
    expect(applyCatalogue(songs, { ...base, tags: ["jazz"] }).map((s) => s.id)).toEqual(["1", "3"]);
    expect(applyCatalogue(songs, { ...base, q: "brav" }).map((s) => s.id)).toEqual(["2"]);
    expect(applyCatalogue(songs, { ...base, q: "rock" }).map((s) => s.id)).toEqual(["2"]); // matches a tag
  });
  it("puts never-practiced last when sorting by practiced", () => {
    expect(applyCatalogue(songs, { ...base, sort: "practiced" })[0].id).toBe("2");
  });
});

describe("roll geometry", () => {
  it("buildThumb returns normalized columns", () => {
    const { notes } = parseRollNotes(loadSample("twinkle-twinkle.mid"));
    const lo = Math.min(...notes.map((n) => n.midi));
    const hi = Math.max(...notes.map((n) => n.midi));
    const dur = Math.max(...notes.map((n) => n.time + n.duration));
    const thumb = buildThumb(notes, lo, hi, dur);
    expect(thumb).toHaveLength(THUMB_COLUMNS);
    for (const c of thumb) {
      for (const v of [c.x, c.lo, c.hi, c.top]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(c.hi).toBeGreaterThanOrEqual(c.lo);
    }
  });
  it("fingerprintPaths produces non-empty paths", () => {
    const parsed = parseMidi(loadSample("c-major-scale.mid"), "c-major-scale.mid");
    const { area, line } = fingerprintPaths(parsed.thumb, 320, 200, 12);
    expect(area.length).toBeGreaterThan(10);
    expect(line.startsWith("M")).toBe(true);
  });
  it("rangeForRoll fits the used range with a minimum span, contained and in bounds", () => {
    const lowest = 61;
    const highest = 64;
    const { lo, hi } = rangeForRoll(lowest, highest);
    expect(lo).toBeLessThanOrEqual(lowest);
    expect(hi).toBeGreaterThanOrEqual(highest);
    expect(hi - lo).toBeGreaterThanOrEqual(12);
    expect(rangeForRoll(60, 60, 32).hi - rangeForRoll(60, 60, 32).lo).toBeGreaterThanOrEqual(32);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(127);
  });

  it("keyboardLayout places black keys narrower than white and within bounds", () => {
    const { keys, pos } = keyboardLayout(60, 72);
    const white = keys.find((k) => k.midi === 60)!; // C
    const black = keys.find((k) => k.midi === 61)!; // C#
    expect(black.width).toBeLessThan(white.width);
    for (const k of keys) {
      expect(k.left).toBeGreaterThanOrEqual(-1);
      expect(k.left + k.width).toBeLessThanOrEqual(101);
    }
    expect(pos(60).width).toBeGreaterThan(pos(61).width);
  });
  it("knows black keys", () => {
    expect(isBlackKey(61)).toBe(true); // C#
    expect(isBlackKey(60)).toBe(false); // C
  });
});

describe("parseRollNotes hand split", () => {
  it("assigns a hand to every note", () => {
    const { notes } = parseRollNotes(loadSample("beethoven-fur-elise.mid"));
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.hand === "left" || n.hand === "right")).toBe(true);
  });
});

describe("normalizeTags", () => {
  it("lowercases, trims, dedupes, strips bad chars, and caps", () => {
    expect(normalizeTags(["Jazz!!", "jazz", "  Lo Fi  "])).toEqual(["jazz", "lo fi"]);
    expect(normalizeTags(Array.from({ length: 20 }, (_, i) => `t${i}`)).length).toBe(MAX_TAGS);
    expect(normalizeTags(["", "   ", "@@@"])).toEqual([]);
  });
});
