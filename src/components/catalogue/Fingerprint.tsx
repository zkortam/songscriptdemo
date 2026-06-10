"use client";
import { useId, useMemo } from "react";
import { fingerprintPaths } from "@/lib/roll-geometry";
import { accentColor } from "@/lib/accent";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/cn";
import type { ThumbColumn } from "@/lib/types";

const W = 320;
const H = 200; // 16:10

/** The generative fingerprint: a soft range envelope + a top-voice contour, from the song's own notes. */
export function Fingerprint({
  thumb,
  hue,
  className,
}: {
  thumb: ThumbColumn[];
  hue: number;
  className?: string;
}) {
  const { resolved } = useTheme();
  const gid = useId();
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
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.32} />
          <stop offset="1" stopColor={color} stopOpacity={0.04} />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#${gid})`} />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
