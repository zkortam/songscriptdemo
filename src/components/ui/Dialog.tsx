"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Dialog({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const t = setTimeout(
      () => ref.current?.querySelector<HTMLElement>("button, [href], input, [tabindex]")?.focus(),
      0,
    );
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className="absolute inset-0 animate-fade-in bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className="relative z-[61] w-full max-w-sm animate-scale-in rounded-xl glass-chrome p-5 shadow-soft-hover"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
