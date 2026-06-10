"use client";
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

type Side = "top" | "right" | "bottom" | "left";

// Hover-intent delay so tooltips don't flicker as the pointer crosses controls.
const SHOW_DELAY = 350;

export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: React.ReactNode;
  side?: Side;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fixed-position in a portal so cards / overflow containers can never clip it,
  // measuring the tip to centre it and flipping to the opposite side near an edge.
  const place = useCallback(() => {
    const el = wrapRef.current;
    const tip = tipRef.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const gap = 8;
    const pad = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let s = side;
    if (s === "top" && r.top - gap - th < pad) s = "bottom";
    else if (s === "bottom" && r.bottom + gap + th > vh - pad) s = "top";
    else if (s === "right" && r.right + gap + tw > vw - pad) s = "left";
    else if (s === "left" && r.left - gap - tw < pad) s = "right";

    let top: number;
    let left: number;
    if (s === "top") {
      top = r.top - gap - th;
      left = r.left + r.width / 2 - tw / 2;
    } else if (s === "bottom") {
      top = r.bottom + gap;
      left = r.left + r.width / 2 - tw / 2;
    } else if (s === "right") {
      left = r.right + gap;
      top = r.top + r.height / 2 - th / 2;
    } else {
      left = r.left - gap - tw;
      top = r.top + r.height / 2 - th / 2;
    }
    left = Math.max(pad, Math.min(left, vw - tw - pad));
    top = Math.max(pad, Math.min(top, vh - th - pad));
    setCoords({ top, left });
  }, [side]);

  const showNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }, []);
  const showSoon = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), SHOW_DELAY);
  }, []);
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    setCoords(null);
  }, []);
  // Show on keyboard focus, but not on the focus a mouse click leaves behind —
  // otherwise the tooltip sticks open after you click the control.
  const onFocus = useCallback(
    (e: React.FocusEvent) => {
      if ((e.target as HTMLElement).matches?.(":focus-visible")) showNow();
    },
    [showNow],
  );

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <span
      ref={wrapRef}
      className="inline-flex"
      onPointerEnter={showSoon}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocusCapture={onFocus}
      onBlurCapture={hide}
    >
      {children}
      {open &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              visibility: coords ? "visible" : "hidden",
            }}
            className="pointer-events-none z-[95] whitespace-nowrap rounded-full glass-chrome px-2.5 py-1 text-[13px] text-ink shadow-soft animate-scale-in"
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}
