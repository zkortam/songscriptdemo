"use client";
import { keyboardLayout } from "@/lib/roll-geometry";
import { midiToNoteName } from "@/lib/format";

// Full 88-key piano, so you see where the song sits on a real keyboard.
const LAYOUT = keyboardLayout(21, 108);
const MIDDLE_C = 60;
const C_LABELS = LAYOUT.keys.filter((k) => k.midi % 12 === 0 && k.midi >= 36 && k.midi <= 96);

export function NoteRange({ lowest, highest }: { lowest: number; highest: number }) {
  const a = LAYOUT.pos(lowest);
  const b = LAYOUT.pos(highest);
  const band = { left: a.left, right: b.left + b.width };

  const octaves = Math.max(1, Math.round((highest - lowest) / 12));
  const register = highest <= 59 ? "in the bass" : lowest >= 60 ? "in the treble" : "around middle C";
  const caption = `Spans about ${octaves} ${octaves === 1 ? "octave" : "octaves"}, ${register}.`;

  return (
    <div className="flex flex-col rounded-xl glass-card p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <p className="text-[15px] font-semibold">Note range</p>
        <p className="text-[13px] tabular-nums text-muted">
          {midiToNoteName(lowest)} to {midiToNoteName(highest)}
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="relative h-24 w-full overflow-hidden rounded-md bg-black dark:bg-[#0b1210]">
          {LAYOUT.keys
            .filter((k) => !k.black)
            .map((k) => (
              <div
                key={k.midi}
                className="absolute bottom-0 top-0 bg-gradient-to-b from-[#efefe9] to-white shadow-[inset_-1px_0_1px_rgba(0,0,0,0.12),inset_0_-6px_8px_-6px_rgba(0,0,0,0.20)] dark:from-[#9aa3a0] dark:to-[#b4bdb9]"
                style={{ left: `${k.left}%`, width: `${k.width}%` }}
              />
            ))}
          {LAYOUT.keys
            .filter((k) => k.black)
            .map((k) => (
              <div
                key={k.midi}
                className="absolute top-0 z-10 h-[58%] rounded-b-[2px] bg-gradient-to-b from-neutral-700 to-neutral-950"
                style={{ left: `${k.left}%`, width: `${k.width}%` }}
              />
            ))}
          <div
            className="absolute bottom-0 top-0 z-20 rounded-[3px] bg-green-500/40 ring-1 ring-inset ring-green-700/55 dark:bg-green-400/35"
            style={{ left: `${band.left}%`, width: `${band.right - band.left}%` }}
          />
          <div
            className="absolute bottom-0 top-0 z-30 w-px bg-green-900/40"
            style={{ left: `${LAYOUT.pos(MIDDLE_C).left + LAYOUT.pos(MIDDLE_C).width / 2}%` }}
          />
        </div>

        <div className="relative mt-2 h-4">
          {C_LABELS.map((k) => (
            <span
              key={k.midi}
              className="absolute -translate-x-1/2 text-[13px] tabular-nums text-faint"
              style={{ left: `${k.left + k.width / 2}%` }}
            >
              {midiToNoteName(k.midi)}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[13px] text-muted">{caption}</p>
      </div>
    </div>
  );
}
