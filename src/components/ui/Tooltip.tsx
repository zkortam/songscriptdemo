"use client";
import { useState } from "react";

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-1 left-1/2 z-[80] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full glass-chrome px-2.5 py-1 text-[13px] text-ink shadow-soft animate-fade-in"
        >
          {label}
        </span>
      )}
    </span>
  );
}
