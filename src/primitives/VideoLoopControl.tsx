"use client";

/* Once the visitor pauses the loop, it stays paused until they press play. Under reduced motion it
   never starts by itself. The button is hidden until this leaf runs, so without JavaScript no dead
   control shows. */
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MEDIA } from "@/lib/motion";

export interface VideoLoopControlProps {
  play: string;
  pause: string;
}

const VISIBLE = 0.5;

const noSubscription = () => () => undefined;

export function VideoLoopControl({ play, pause }: VideoLoopControlProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  // False in the server HTML and during hydration.
  const ready = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  const video = () => ref.current?.closest("[data-video-loop]")?.querySelector("video") ?? null;

  useEffect(() => {
    const el = video();
    if (!el) return;
    const reduce = window.matchMedia(MEDIA.reduce);
    // A play() refused by the browser (autoplay rules) leaves the loop paused with its button.
    const start = () => void el.play().catch(() => undefined);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onReduce = () => {
      if (reduce.matches) el.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = (entry?.intersectionRatio ?? 0) >= VISIBLE;
        if (!inView) el.pause();
        else if (!userPaused.current && !reduce.matches) start();
      },
      { threshold: [0, VISIBLE] },
    );
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    reduce.addEventListener("change", onReduce);
    observer.observe(el);
    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", onReduce);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.pause();
    };
  }, []);

  const toggle = () => {
    const el = video();
    if (!el) return;
    if (el.paused) {
      userPaused.current = false;
      void el.play().catch(() => undefined);
    } else {
      userPaused.current = true;
      el.pause();
    }
  };

  const Icon = playing ? Pause : Play;
  return (
    <button
      ref={ref}
      type="button"
      className="video-toggle"
      hidden={!ready}
      aria-label={playing ? pause : play}
      data-playing={playing ? "" : undefined}
      onClick={toggle}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={2} />
    </button>
  );
}
