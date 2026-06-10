"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { DEFAULT_SPEED, SAMPLER_NOTES, SAMPLER_BASE_URL } from "@/lib/constants";
import type { RollNote } from "./useRollNotes";

/**
 * Tone.js playback. Schedules notes on a Part scaled by speed so Transport time
 * stays real; song time = transport.seconds * speed. Disposes on unmount.
 */
export function usePlayback({ notes, duration }: { notes: RollNote[]; duration: number }) {
  const [ready, setReady] = useState(false);
  const [isPlaying, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState<number>(DEFAULT_SPEED);
  const [loop, setLoopState] = useState(false);
  const [mutedHands, setMutedHands] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  const Tone = useRef<any>(null);
  const sampler = useRef<any>(null);
  const part = useRef<any>(null);
  const speedRef = useRef(speed);
  const loopRef = useRef(loop);
  const mutedRef = useRef(mutedHands);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tone = await import("tone");
      if (cancelled) return;
      Tone.current = tone;
      const urls: Record<string, string> = {};
      SAMPLER_NOTES.forEach((n) => (urls[n] = n.replace("#", "s") + ".mp3"));
      sampler.current = new tone.Sampler({
        urls,
        baseUrl: SAMPLER_BASE_URL,
        release: 1,
        onload: () => !cancelled && setReady(true),
        onerror: () => {
          // Samples failed (e.g. offline): fall back to a synth voice so playback still works.
          if (cancelled) return;
          try {
            sampler.current?.dispose();
          } catch {
            /* noop */
          }
          sampler.current = new tone.PolySynth(tone.Synth).toDestination();
          setReady(true);
        },
      }).toDestination();
    })();
    return () => {
      cancelled = true;
      try {
        part.current?.dispose();
        sampler.current?.dispose();
        const t = Tone.current;
        if (t) {
          t.getTransport().stop();
          t.getTransport().cancel();
        }
      } catch {
        /* noop */
      }
    };
  }, []);

  const buildPart = useCallback(() => {
    const t = Tone.current;
    if (!t) return;
    part.current?.dispose();
    const sp = speedRef.current;
    const events = notes.map((n) => ({
      time: n.time / sp,
      note: t.Frequency(n.midi, "midi").toNote(),
      dur: Math.max(0.05, n.duration / sp),
      vel: n.velocity,
      hand: n.hand,
    }));
    const p = new t.Part((time: number, ev: any) => {
      if (mutedRef.current[ev.hand as "left" | "right"]) return; // hand isolation for practice
      sampler.current?.triggerAttackRelease(ev.note, ev.dur, time, ev.vel);
    }, events);
    p.start(0);
    part.current = p;
    const tr = t.getTransport();
    tr.loop = loopRef.current;
    tr.loopStart = 0;
    tr.loopEnd = duration / sp;
  }, [notes, duration]);

  const getTime = useCallback(() => {
    const t = Tone.current;
    return t ? t.getTransport().seconds * speedRef.current : 0;
  }, []);

  const play = useCallback(async () => {
    const t = Tone.current;
    if (!t || !ready) return;
    await t.start();
    if (!part.current) buildPart();
    if (getTime() >= duration) t.getTransport().seconds = 0;
    t.getTransport().start();
    setPlaying(true);
  }, [ready, buildPart, getTime, duration]);

  const pause = useCallback(() => {
    Tone.current?.getTransport().pause();
    setPlaying(false);
  }, []);

  const seek = useCallback((songSec: number) => {
    const t = Tone.current;
    if (!t) return;
    t.getTransport().seconds = Math.max(0, songSec) / speedRef.current;
  }, []);

  const stopToStart = useCallback(() => {
    const t = Tone.current;
    if (!t) return;
    t.getTransport().pause();
    t.getTransport().seconds = 0;
    setPlaying(false);
  }, []);

  const setSpeed = useCallback(
    (s: number) => {
      const cur = getTime();
      speedRef.current = s;
      setSpeedState(s);
      const t = Tone.current;
      if (t && part.current) {
        buildPart();
        t.getTransport().seconds = cur / s;
      }
    },
    [getTime, buildPart],
  );

  const setLoop = useCallback(
    (b: boolean) => {
      loopRef.current = b;
      setLoopState(b);
      const t = Tone.current;
      if (t) {
        t.getTransport().loop = b;
        t.getTransport().loopEnd = duration / speedRef.current;
      }
    },
    [duration],
  );

  const toggleHand = useCallback((hand: "left" | "right") => {
    setMutedHands((prev) => {
      const next = { ...prev, [hand]: !prev[hand] };
      mutedRef.current = next;
      return next;
    });
  }, []);

  return {
    ready,
    isPlaying,
    speed,
    loop,
    duration,
    play,
    pause,
    toggle: () => (isPlaying ? pause() : play()),
    seek,
    setSpeed,
    setLoop,
    getTime,
    stopToStart,
    mutedHands,
    toggleHand,
  };
}
