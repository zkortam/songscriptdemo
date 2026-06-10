"use client";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function Chip({ children, active, onClick, onRemove, className }: ChipProps) {
  const base = cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition",
    active
      ? "bg-green-500/20 text-green-700 dark:text-green-300"
      : "bg-ink/[0.05] text-ink/80 dark:bg-white/[0.07]",
    onClick && "cursor-pointer hover:bg-ink/[0.09] hover:text-ink dark:hover:bg-white/[0.11]",
    focusRing,
    className,
  );
  const content = (
    <>
      {children}
      {onRemove && (
        <span
          role="button"
          aria-label="Remove"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRemove();
            }
          }}
          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-faint hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );
  return onClick ? (
    <button type="button" className={base} onClick={onClick}>
      {content}
    </button>
  ) : (
    <span className={base}>{content}</span>
  );
}
