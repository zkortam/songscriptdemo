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

/** Light moving average to tame single-column spikes without flattening the arc. */
function smoothSeries(vals: number[], radius = 1): number[] {
  if (radius <= 0) return vals;
  return vals.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let j = i - radius; j <= i + radius; j++) {
      if (j >= 0 && j < vals.length) {
        sum += vals[j];
        n++;
      }
    }
    return sum / n;
  });
}

/** Catmull-Rom spline through points → a flowing cubic-bezier path. */
function spline(pts: [number, number][]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3) {
    return pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  }
  let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] ?? pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] ?? pts[i + 1];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;
  }
  return d;
}

/**
 * SVG paths for the fingerprint: a single smooth top-voice ridge with a soft
 * fill down to a baseline. We render only the lightly-smoothed melodic contour
 * (no raw per-column min/max envelope, which read as noisy ghost spikes), and
 * keep a floor so the line floats above the bottom instead of plunging to it —
 * so each card is a clean, flowing signature of the song.
 */
export function fingerprintPaths(
  thumb: ThumbColumn[],
  width: number,
  height: number,
  pad = 14,
): { area: string; line: string } {
  if (!thumb.length) return { area: "", line: "" };
  const topY = pad + 6; // the highest note sits just under the top edge
  const floorY = height - pad - height * 0.12; // the lowest note floats above the baseline
  const baseY = height - pad; // where the fill closes
  const X = (x: number) => pad + x * (width - pad * 2);
  const Y = (p: number) => topY + (1 - Math.max(0, Math.min(1, p))) * (floorY - topY);

  const tops = smoothSeries(
    thumb.map((c) => c.top),
    1,
  );
  const pts: [number, number][] = tops.map((t, i) => [X(thumb[i].x), Y(t)]);
  const line = spline(pts);
  const x0 = pts[0][0].toFixed(2);
  const x1 = pts[pts.length - 1][0].toFixed(2);
  const area = `${line} L ${x1},${baseY.toFixed(2)} L ${x0},${baseY.toFixed(2)} Z`;
  return { area, line };
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
