"use client";
import { Ring } from "@/components/ui/Ring";
import { difficultyLabel } from "@/lib/format";
import type { DifficultyParts } from "@/lib/types";

const PART_LABELS: Record<keyof DifficultyParts, string> = {
  speed: "Speed",
  density: "Density",
  handSpan: "Hand span",
  range: "Range",
  harmony: "Harmony",
};

export function DifficultyRing({ score, parts }: { score: number; parts: DifficultyParts }) {
  return (
    <div className="rounded-xl glass-card p-5 shadow-soft">
      <div className="flex items-center gap-4">
        <Ring value={score} size={88} stroke={8}>
          <div className="text-[22px] font-semibold tabular-nums leading-none">{score}</div>
        </Ring>
        <div>
          <p className="text-[15px] font-semibold">{difficultyLabel(score)}</p>
          <p className="mt-0.5 text-[13px] text-muted">Difficulty score</p>
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="flex items-center justify-between text-[12px] text-faint">
          <span>Breakdown</span>
          <span>Higher = harder</span>
        </div>
        {(Object.keys(PART_LABELS) as (keyof DifficultyParts)[]).map((k) => {
          const pct = Math.round(parts[k] * 100);
          return (
            <div key={k} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[13px] text-muted">{PART_LABELS[k]}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                <span
                  className="block h-full rounded-full bg-green-500 dark:bg-green-400"
                  style={{ width: `${Math.max(3, pct)}%` }}
                />
              </span>
              <span className="w-7 shrink-0 text-right text-[12px] tabular-nums text-faint">{pct}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
