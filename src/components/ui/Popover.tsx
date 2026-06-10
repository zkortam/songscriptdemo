"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

export function Popover({
  trigger,
  children,
  align = "end",
  side = "bottom",
  className,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "start" | "end" | "center";
  side?: "bottom" | "top";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <span onClick={() => setOpen((o) => !o)} className="inline-flex">
        {trigger}
      </span>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 min-w-[12rem] rounded-xl glass-chrome p-1.5 shadow-soft animate-scale-in",
            side === "top" ? "bottom-[calc(100%+8px)] origin-bottom" : "top-[calc(100%+8px)] origin-top",
            align === "end" && "right-0",
            align === "start" && "left-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            className,
          )}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  icon,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] transition",
        danger ? "text-danger hover:bg-danger/10" : "text-ink hover:bg-surface/70",
        focusRing,
      )}
    >
      {icon && <span className="text-faint">{icon}</span>}
      {children}
    </button>
  );
}
