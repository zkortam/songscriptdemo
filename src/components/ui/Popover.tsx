"use client";
import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  cloneElement,
  isValidElement,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { focusRing } from "./styles";

type Coords = { top: number; left: number };

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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Position the portalled menu in fixed coordinates relative to the trigger.
  // Rendering in a portal (not as an absolute child) means cards with
  // `contain: paint` / `content-visibility` no longer clip the menu. We measure
  // the menu's real size (it renders hidden until coords are set) so alignment
  // and viewport clamping resolve in a single pass — no left-edge snap.
  const place = useCallback(() => {
    const el = triggerRef.current;
    const menu = menuRef.current;
    if (!el || !menu) return;
    const r = el.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const gap = 8;
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = side === "top" ? r.top - gap - mh : r.bottom + gap;
    top = Math.max(pad, Math.min(top, vh - mh - pad));

    let left =
      align === "start" ? r.left : align === "end" ? r.right - mw : r.left + r.width / 2 - mw / 2;
    left = Math.max(pad, Math.min(left, vw - mw - pad));

    setCoords({ top, left });
  }, [side, align]);

  useLayoutEffect(() => {
    if (open) place();
    else setCoords(null);
  }, [open, place]);

  // Keep aligned while open if the page scrolls or resizes underneath.
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  const close = useCallback(() => {
    setOpen(false);
    restoreRef.current?.focus?.();
  }, []);

  // Open lifecycle: focus into the menu, close on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const raf = requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"], button:not([disabled]), a, input')
        ?.focus();
    });
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"], button:not([disabled]), a') ?? [],
    );
    if (!items.length) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? items[(i + 1 + items.length) % items.length]
        : e.key === "ArrowUp"
          ? items[(i - 1 + items.length) % items.length]
          : e.key === "Home"
            ? items[0]
            : items[items.length - 1];
    next?.focus();
  };

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })
    : trigger;

  return (
    <>
      <span ref={triggerRef} className="inline-flex" onClick={() => setOpen((o) => !o)}>
        {triggerNode}
      </span>
      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onKeyDown={onMenuKey}
            style={{
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              visibility: coords ? "visible" : "hidden",
            }}
            className={cn(
              "z-[90] min-w-[12rem] rounded-xl glass-chrome p-1.5 shadow-soft animate-scale-in",
              side === "top" ? "origin-bottom" : "origin-top",
              className,
            )}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body,
        )}
    </>
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
