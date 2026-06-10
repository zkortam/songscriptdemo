"use client";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

export interface SegmentOption<T extends string | number> {
  value: T;
  label?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

export function SegmentedToggle<T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full glass-card p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-label={opt.ariaLabel ?? opt.label}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full transition",
              size === "sm"
                ? "h-8 px-3 text-[13px]"
                : size === "lg"
                  ? "h-10 px-4 text-[14px]"
                  : "h-9 px-3.5 text-[13px]",
              active ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink",
              focusRing,
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
