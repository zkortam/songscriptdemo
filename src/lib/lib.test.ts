import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseMidi } from "./midi";
import {
  formatDuration,
  midiToNoteName,
  titleFromFilename,
  difficultyLabel,
  relativeTime,
} from "./format";
import { hueFromKey } from "./accent";
import { ACCENT_HUE_MIN, ACCENT_HUE_MAX } from "./constants";

function loadSample(name: string): ArrayBuffer {
  const buf = readFileSync(join(process.cwd(), "public/samples", name));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const SAMPLES = ["twinkle-twinkle.mid", "c-major-scale.mid", "beethoven-fur-elise.mid"];

describe("parseMidi on bundled samples", () => {
  for (const name of SAMPLES) {
    it(`parses ${name} with sane metadata`, () => {
      const parsed = parseMidi(loadSample(name), name);
      expect(parsed.noteCount).toBeGreaterThan(0);
      expect(parsed.durationSeconds).toBeGreaterThan(0);
      expect(parsed.tempoBpm).toBeGreaterThan(0);
      expect(parsed.isPercussionOnly).toBe(false);
      expect(parsed.difficultyScore).toBeGreaterThanOrEqual(0);
      expect(parsed.difficultyScore).toBeLessThanOrEqual(100);
      expect(parsed.highestNote).toBeGreaterThanOrEqual(parsed.lowestNote);
      expect(parsed.thumb.length).toBeGreaterThan(0);
      expect(parsed.accentHue).toBeGreaterThanOrEqual(ACCENT_HUE_MIN);
      expect(parsed.accentHue).toBeLessThanOrEqual(ACCENT_HUE_MAX);
    });
  }

  it("is deterministic", () => {
    const a = parseMidi(loadSample(SAMPLES[0]), SAMPLES[0]);
    const b = parseMidi(loadSample(SAMPLES[0]), SAMPLES[0]);
    expect(a.difficultyScore).toBe(b.difficultyScore);
    expect(a.keySignature).toBe(b.keySignature);
    expect(a.accentHue).toBe(b.accentHue);
  });

  it("detects C major-ish for the C major scale", () => {
    const parsed = parseMidi(loadSample("c-major-scale.mid"), "c-major-scale.mid");
    expect(parsed.keySignature.startsWith("C")).toBe(true);
  });
});

describe("format helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(72)).toBe("1:12");
    expect(formatDuration(3723)).toBe("1:02:03");
  });
  it("names notes with C4 = 60", () => {
    expect(midiToNoteName(60)).toBe("C4");
    expect(midiToNoteName(69)).toBe("A4");
  });
  it("de-slugs filenames", () => {
    expect(titleFromFilename("beethoven-fur-elise.mid")).toBe("Beethoven Fur Elise");
  });
  it("labels difficulty", () => {
    expect(difficultyLabel(10)).toBe("Beginner");
    expect(difficultyLabel(50)).toBe("Intermediate");
    expect(difficultyLabel(90)).toBe("Advanced");
  });
  it("handles never-practiced", () => {
    expect(relativeTime(null)).toBe("Not practiced yet");
  });
});

describe("accent", () => {
  it("stays inside the brand hue band and is deterministic", () => {
    for (let pc = 0; pc < 12; pc++) {
      const h = hueFromKey(pc, "major");
      expect(h).toBeGreaterThanOrEqual(ACCENT_HUE_MIN);
      expect(h).toBeLessThanOrEqual(ACCENT_HUE_MAX);
      expect(hueFromKey(pc, "major")).toBe(h);
    }
  });
});
