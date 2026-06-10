import { THUMB_COLUMNS } from "./constants";
import type { ThumbColumn } from "./types";


export interface NoteLite {
  time: number;
  midi: number;
  duration: number;
}

/**
 * Shared geometry for the "one visual idea at three scales": the card
 * fingerprint, the hover animation, and the full playable roll all derive
 * from these helpers, so there is a single code path.
 */

/** Downsample notes into <=64 normalized columns {x,lo,hi,top}. */
export function buildThumb(
  notes: NoteLite[],
  lowest: number,
  highest: number,
  duration: number,
): ThumbColumn[] {
  const cols = THUMB_COLUMNS;
  const span = Math.max(1, highest - lowest);
  const dur = Math.max(0.001, duration);
  const norm = (m: number) => (m - lowest) / span;

  const raw: (ThumbColumn | null)[] = Array.from({ length: cols }, () => null);
  for (const n of notes) {
    const startCol = Math.floor((n.time / dur) * cols);
    const endCol = Math.floor(((n.time + n.duration) / dur) * cols);
    for (let c = Math.max(0, startCol); c <= Math.min(cols - 1, endCol); c++) {
      const y = norm(n.midi);
      const cur = raw[c];
      if (!cur) raw[c] = { x: c / (cols - 1), lo: y, hi: y, top: y };
      else {
        cur.lo = Math.min(cur.lo, y);
        cur.hi = Math.max(cur.hi, y);
        cur.top = Math.max(cur.top, y);
      }
    }
  }
  // Fill gaps by nearest neighbor so the contour stays continuous.
  const filled: ThumbColumn[] = [];
  for (let c = 0; c < cols; c++) {
    let v = raw[c];
    if (!v) {
      let l = c - 1;
      let r = c + 1;
      while (l >= 0 || r < cols) {
        if (l >= 0 && raw[l]) {
          v = { ...raw[l]!, x: c / (cols - 1) };
          break;
        }
        if (r < cols && raw[r]) {
          v = { ...raw[r]!, x: c / (cols - 1) };
          break;
        }
        l--;
        r++;
      }
    }
    filled.push(v ?? { x: c / (cols - 1), lo: 0.5, hi: 0.5, top: 0.5 });
  }
  return filled;
}

const smooth = (pts: [number, number][]): string => {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`;
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` Q ${x0},${y0} ${mx},${(y0 + y1) / 2}`;
    d += ` T ${x1},${y1}`;
  }
  return d;
};

/**
 * SVG paths for the fingerprint: a soft range envelope + a top-voice line.
 * `minBand` guarantees a visible ribbon thickness so single-voice songs (where
 * lo == hi == top) still read as full, not a hairline. Vertical inset keeps the
 * contour off the rounded corners.
 */
export function fingerprintPaths(
  thumb: ThumbColumn[],
  width: number,
  height: number,
  pad = 20,
  minBand = 16,
): { area: string; line: string } {
  if (!thumb.length) return { area: "", line: "" };
  const inset = 0.12; // keep the contour within the middle 76% vertically
  const top = pad + height * inset;
  const h = height - 2 * (pad + height * inset);
  const X = (x: number) => pad + x * (width - pad * 2);
  const Y = (p: number) => top + (1 - p) * h;

  const hiPts: [number, number][] = [];
  const loPts: [number, number][] = [];
  const topPts: [number, number][] = [];
  for (const c of thumb) {
    const x = X(c.x);
    const topY = Y(c.top);
    let hiY = Y(c.hi);
    let loY = Y(c.lo);
    if (loY - hiY < minBand) {
      hiY = topY - minBand / 2;
      loY = topY + minBand / 2;
    }
    hiPts.push([x, hiY]);
    loPts.push([x, loY]);
    topPts.push([x, topY]);
  }

  const areaTop = smooth(hiPts);
  const areaBottom = smooth([...loPts].reverse());
  const area = `${areaTop} L ${loPts[loPts.length - 1][0]},${loPts[loPts.length - 1][1]} ${areaBottom.replace(/^M/, "L")} Z`;
  return { area, line: smooth(topPts) };
}

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

/**
 * Fit the keyboard around the song's used range plus a pad, expanded to `minSpan`
 * semitones. The roll passes a larger minSpan so the keyboard always reads like a
 * real piano; Note range uses a tighter default so it shows just the used span.
 */
export function rangeForRoll(
  lowest: number,
  highest: number,
  minSpan = 12,
): { lo: number; hi: number } {
  let lo = lowest - 2;
  let hi = highest + 2;
  if (hi - lo < minSpan) {
    const need = minSpan - (hi - lo);
    lo -= Math.ceil(need / 2);
    hi += Math.floor(need / 2);
  }
  return { lo: Math.max(0, lo), hi: Math.min(127, hi) };
}

export interface KeyPos {
  midi: number;
  black: boolean;
  left: number; // %
  width: number; // %
}

/** Real piano geometry: white keys are equal slots; black keys are narrower and sit between them. */
export function keyboardLayout(lo: number, hi: number): {
  keys: KeyPos[];
  pos: (midi: number) => { left: number; width: number };
} {
  const whites: number[] = [];
  for (let m = lo; m <= hi; m++) if (!isBlackKey(m)) whites.push(m);
  const whiteCount = whites.length || 1;
  const whiteW = 100 / whiteCount;
  const blackW = whiteW * 0.62;
  const whiteIndex = new Map(whites.map((m, i) => [m, i] as const));

  const pos = (midi: number): { left: number; width: number } => {
    if (!isBlackKey(midi)) {
      const i = whiteIndex.get(midi) ?? 0;
      return { left: i * whiteW, width: whiteW };
    }
    const prev = whiteIndex.get(midi - 1); // a black key follows its white neighbor
    const boundary = prev != null ? (prev + 1) * whiteW : 0;
    return { left: boundary - blackW / 2, width: blackW };
  };

  const keys: KeyPos[] = [];
  for (let m = lo; m <= hi; m++) {
    const black = isBlackKey(m);
    const p = pos(m);
    keys.push({ midi: m, black, left: p.left, width: p.width });
  }
  return { keys, pos };
}
