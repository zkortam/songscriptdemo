"use client";
import { useId, useMemo } from "react";
import { fingerprintPaths } from "@/lib/roll-geometry";
import { accentColor } from "@/lib/accent";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/cn";
import type { ThumbColumn } from "@/lib/types";

const W = 320;
const H = 200; // 16:10

/** The generative fingerprint: a single smooth melodic ridge with a soft gradient
 *  fill and a faint glow, drawn from the song's own notes (unique per song). */
export function Fingerprint({
  thumb,
  hue,
  className,
  lineOnly,
}: {
  thumb: ThumbColumn[];
  hue: number;
  className?: string;
  /** Drop the fill + glow — at small sizes (list rows) the bare contour reads cleaner. */
  lineOnly?: boolean;
}) {
  const { resolved } = useTheme();
  const uid = useId();
  const fillId = `${uid}-fill`;
  const glowId = `${uid}-glow`;
  const { area, line } = useMemo(() => fingerprintPaths(thumb, W, H), [thumb]);
  const color = accentColor(hue, resolved === "dark");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.28} />
          <stop offset="0.55" stopColor={color} stopOpacity={0.09} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        {!lineOnly && (
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        )}
      </defs>

      {area && !lineOnly && <path d={area} fill={`url(#${fillId})`} />}

      {/* Soft glow under the ridge */}
      {line && !lineOnly && (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeOpacity={0.3}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
      )}

      {/* Crisp ridge */}
      {line && (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={lineOnly ? 2 : 2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
