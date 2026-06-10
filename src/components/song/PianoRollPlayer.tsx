"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Repeat, Loader2, Maximize2, Minimize2, Type } from "lucide-react";
import { usePlayback } from "@/hooks/usePlayback";
import type { RollNote } from "@/hooks/useRollNotes";
import { keyboardLayout, rangeForRoll } from "@/lib/roll-geometry";
import { FALL_WINDOW_SECONDS, SPEED_OPTIONS, VELOCITY_OPACITY_MIN, VELOCITY_OPACITY_MAX } from "@/lib/constants";
import { formatDuration, midiToNoteName } from "@/lib/format";
import { IconButton } from "@/components/ui/IconButton";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/styles";

const ROLL_H = 340;
const HAND_COLOR = { left: "#46C7D6", right: "#5FC97D" } as const;
const FULL_LO = 21; // A0
const FULL_HI = 108; // C8
const FULL_LAYOUT = keyboardLayout(FULL_LO, FULL_HI);
const VIEW_KEY = "songscription-roll-view";
const NAMES_KEY = "songscription-roll-names";

export function PianoRollPlayer({
  notes,
  duration,
  onFirstPlay,
}: {
  notes: RollNote[];
  duration: number;
  onFirstPlay?: () => void;
}) {
  const pb = usePlayback({ notes, duration });
  const pbRef = useRef(pb);
  pbRef.current = pb;
  const panelRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const activeRef = useRef<Set<number>>(new Set());
  const firstPlayedRef = useRef(false);
  const ppsRef = useRef(ROLL_H / FALL_WINDOW_SECONDS);
  const [displayTime, setDisplayTime] = useState(0);
  const [view, setView] = useState<"focus" | "full">("full");
  const [showNames, setShowNames] = useState(false);
  const [rollH, setRollH] = useState(ROLL_H);
  const [isFs, setIsFs] = useState(false);

  const pps = rollH / FALL_WINDOW_SECONDS;
  ppsRef.current = pps;

  useEffect(() => {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "full" || v === "focus") setView(v);
    setShowNames(localStorage.getItem(NAMES_KEY) === "1");
  }, []);
  const toggleNames = () =>
    setShowNames((v) => {
      localStorage.setItem(NAMES_KEY, v ? "0" : "1");
      return !v;
    });
  const selectView = (next: "focus" | "full") => {
    localStorage.setItem(VIEW_KEY, next);
    setView(next);
  };

  // Measure the notes viewport so playback math and fullscreen stay in sync.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.contentRect.height);
      if (h > 0) setRollH(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fullscreen
  useEffect(() => {
    const onChange = () => setIsFs(document.fullscreenElement === panelRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else panelRef.current?.requestFullscreen?.();
  };

  const [lowest, highest] = useMemo(() => {
    let lo = 127;
    let hi = 0;
    for (const n of notes) {
      lo = Math.min(lo, n.midi);
      hi = Math.max(hi, n.midi);
    }
    return [lo, hi];
  }, [notes]);

  const { layout } = useMemo(() => {
    if (view === "full") return { layout: FULL_LAYOUT };
    const r = rangeForRoll(lowest, highest, 28);
    return { layout: keyboardLayout(r.lo, r.hi) };
  }, [view, lowest, highest]);

  const hasLeft = useMemo(() => notes.some((n) => n.hand === "left"), [notes]);
  const hasRight = useMemo(() => notes.some((n) => n.hand === "right"), [notes]);

  useEffect(() => {
    let raf = 0;
    let lastSec = -1;
    const tick = () => {
      const p = pbRef.current;
      const t = p.getTime();
      if (layerRef.current) layerRef.current.style.transform = `translateY(${t * ppsRef.current}px)`;

      const next = new Set<number>();
      const muted = p.mutedHands;
      for (const n of notes) {
        if (muted[n.hand]) continue;
        if (n.time <= t && t < n.time + n.duration) next.add(n.midi);
      }
      for (const midi of activeRef.current) if (!next.has(midi)) keyRefs.current.get(midi)?.classList.remove("lit");
      for (const midi of next) if (!activeRef.current.has(midi)) keyRefs.current.get(midi)?.classList.add("lit");
      activeRef.current = next;

      const sec = Math.floor(t * 10);
      if (sec !== lastSec) {
        lastSec = sec;
        setDisplayTime(t);
      }
      if (p.isPlaying && !p.loop && t >= duration) p.stopToStart();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [notes, duration]);

  const notesLayer = useMemo(
    () => (
      <div ref={layerRef} className="absolute inset-x-0 bottom-0 will-change-transform">
        {notes.map((n, i) => {
          const p = layout.pos(n.midi);
          return (
            <div
              key={i}
              data-hand={n.hand}
              className="absolute rounded-[2px]"
              style={{
                left: `calc(${p.left}% + 0.5px)`,
                width: `calc(${p.width}% - 1px)`,
                bottom: n.time * pps,
                height: Math.max(6, n.duration * pps),
                background: HAND_COLOR[n.hand],
                opacity: VELOCITY_OPACITY_MIN + n.velocity * (VELOCITY_OPACITY_MAX - VELOCITY_OPACITY_MIN),
                boxShadow: `0 0 6px ${HAND_COLOR[n.hand]}55`,
              }}
            />
          );
        })}
      </div>
    ),
    [notes, layout, pps],
  );

  const handlePlay = () => {
    if (!firstPlayedRef.current) {
      firstPlayedRef.current = true;
      onFirstPlay?.();
    }
    pb.toggle();
  };

  return (
    <div
      ref={panelRef}
      className={cn("relative overflow-hidden bg-roll-bg shadow-soft", isFs ? "flex h-full flex-col rounded-none" : "rounded-xl")}
    >
      {/* View toggle: a two-state segmented switch between the song's range and the full keyboard */}
      <div
        role="group"
        aria-label="Keyboard view"
        className="absolute right-3 top-3 z-30 inline-flex items-center gap-0.5 rounded-full bg-black/45 p-0.5 backdrop-blur-sm"
      >
        {(["focus", "full"] as const).map((v) => (
          <button
            key={v}
            onClick={() => selectView(v)}
            aria-pressed={view === v}
            title={v === "focus" ? "Focus on this song's range" : "Show the full keyboard"}
            className={cn(
              "rounded-full px-3 py-1 text-[13px] font-medium transition",
              view === v ? "bg-white/15 text-white" : "text-white/55 hover:text-white/90",
              focusRing,
            )}
          >
            {v === "focus" ? "Focus" : "Full"}
          </button>
        ))}
      </div>

      {/* Falling notes */}
      <div
        ref={viewportRef}
        className={cn(
          "roll-notes relative overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_8%)]",
          isFs && "flex-1",
          pb.mutedHands.left && "mute-left",
          pb.mutedHands.right && "mute-right",
        )}
        style={isFs ? undefined : { height: ROLL_H }}
      >
        {notesLayer}
      </div>

      {/* Piano keyboard: keys sit on a dark shelf, with a glowing strike line
          at the top where the falling notes land so it reads as one instrument. */}
      <div className={cn("relative w-full select-none bg-[#090f0d]", isFs ? "h-28" : "h-[76px]")}>
        {/* Strike line: a neutral "now" seam where notes meet their keys (no colored hue) */}
        <div className="pointer-events-none absolute inset-x-0 -top-px z-30 h-px bg-gradient-to-r from-white/10 via-white/28 to-white/10" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-3 bg-gradient-to-b from-white/[0.07] to-transparent" />
        {layout.keys
          .filter((k) => !k.black)
          .map((k) => {
            const isC = k.midi % 12 === 0;
            return (
              <div
                key={k.midi}
                ref={(el) => {
                  if (el) keyRefs.current.set(k.midi, el);
                  else keyRefs.current.delete(k.midi);
                }}
                className="key key-white absolute bottom-0 top-0 bg-gradient-to-b from-[#efefe9] to-white shadow-[inset_-1px_0_1px_rgba(0,0,0,0.14),inset_0_-7px_9px_-6px_rgba(0,0,0,0.28)]"
                style={{ left: `${k.left}%`, width: `${k.width}%` }}
              >
                {showNames && (
                  <span
                    className={cn(
                      "key-label pointer-events-none absolute inset-x-0 bottom-1 text-center font-semibold leading-none",
                      isFs ? "text-[11px]" : "text-[9px]",
                      isC ? "text-green-700" : "text-neutral-500",
                    )}
                  >
                    {midiToNoteName(k.midi).slice(0, -1)}
                  </span>
                )}
              </div>
            );
          })}
        {layout.keys
          .filter((k) => k.black)
          .map((k) => (
            <div
              key={k.midi}
              ref={(el) => {
                if (el) keyRefs.current.set(k.midi, el);
                else keyRefs.current.delete(k.midi);
              }}
              className="key key-black absolute top-0 z-10 h-[58%] rounded-b-[3px] bg-gradient-to-b from-neutral-700 to-neutral-950 shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
              style={{ left: `${k.left}%`, width: `${k.width}%` }}
            >
              {showNames && (
                <span
                  className={cn(
                    "key-label pointer-events-none absolute inset-x-0 bottom-0.5 text-center font-semibold leading-none text-white/70",
                    isFs ? "text-[9px]" : "text-[7px]",
                  )}
                >
                  {midiToNoteName(k.midi).slice(0, -1).replace("#", "♯")}
                </span>
              )}
            </div>
          ))}
      </div>

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-3 p-3">
        <button
          aria-label={pb.isPlaying ? "Pause" : "Play"}
          onClick={handlePlay}
          disabled={!pb.ready}
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-500 text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-50 dark:bg-green-400 dark:text-green-950",
            focusRing,
          )}
        >
          {!pb.ready ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : pb.isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 translate-x-0.5 fill-current" />
          )}
        </button>

        <span className="shrink-0 text-[13px] tabular-nums text-white/70">
          {formatDuration(displayTime)} / {formatDuration(duration)}
        </span>

        <input
          type="range"
          min={0}
          max={duration}
          step={0.05}
          value={Math.min(displayTime, duration)}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDisplayTime(v);
            pb.seek(v);
          }}
          aria-label="Seek"
          className="h-1 min-w-[120px] flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-green-400"
        />

        <SegmentedToggle
          size="sm"
          value={pb.speed}
          onChange={pb.setSpeed}
          options={SPEED_OPTIONS.map((s) => ({ value: s, label: `${s}x` }))}
        />

        <IconButton
          label={pb.loop ? "Looping, click to turn off" : "Loop"}
          active={pb.loop}
          onClick={() => pb.setLoop(!pb.loop)}
          className={cn(
            pb.loop
              ? "bg-green-400/25 text-green-200 hover:bg-green-400/30 hover:text-green-100"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          <Repeat className="h-[18px] w-[18px]" />
        </IconButton>

        <IconButton
          label={showNames ? "Hide note names" : "Show note names"}
          active={showNames}
          onClick={toggleNames}
          className={cn(
            showNames
              ? "bg-green-400/25 text-green-200 hover:bg-green-400/30 hover:text-green-100"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          <Type className="h-[18px] w-[18px]" />
        </IconButton>

        {hasLeft && hasRight ? (
          <div className="flex items-center gap-1 text-[13px]">
            {(["left", "right"] as const).map((hand) => {
              const muted = pb.mutedHands[hand];
              return (
                <button
                  key={hand}
                  onClick={() => pb.toggleHand(hand)}
                  aria-pressed={!muted}
                  title={muted ? `Unmute ${hand} hand` : `Practice without the ${hand} hand`}
                  className={cn(
                    "flex h-10 items-center gap-1.5 rounded-full px-3 transition",
                    muted ? "text-white/35 line-through" : "text-white/80 hover:bg-white/10",
                    focusRing,
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={
                      muted
                        ? { boxShadow: `inset 0 0 0 1.5px ${HAND_COLOR[hand]}` }
                        : { background: HAND_COLOR[hand] }
                    }
                  />
                  {hand === "left" ? "Left" : "Right"}
                </button>
              );
            })}
          </div>
        ) : (
          (hasLeft || hasRight) && (
            <div className="flex h-10 items-center gap-1.5 px-3 text-[13px] text-white/60">
              <span
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ background: hasLeft ? HAND_COLOR.left : HAND_COLOR.right }}
              />
              {hasLeft ? "Left hand" : "Right hand"}
            </div>
          )
        )}

        <IconButton
          label={isFs ? "Exit full screen" : "Full screen"}
          onClick={toggleFs}
          className="text-white/70 hover:text-white"
        >
          {isFs ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
        </IconButton>
      </div>
    </div>
  );
}
