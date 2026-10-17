"use client";

/* The client leaf of Reveal. It animates from the CSS start state (opacity 0, translateY(y)) to
   rest. If reduced motion is switched on while html.motion is still set, the reduced branch pins
   the targets at rest so the CSS start state cannot hide them. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { motionAllowed } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { DURATION, MEDIA, REVEAL, STAGGER } from "@/lib/motion";

export interface RevealMotionProps {
  when: "ready" | "enter";
  y: number;
  /** Default DURATION.fadeUp (1 s). */
  duration?: number;
  /** Default STAGGER.reveal (0.08). */
  stagger?: number;
  /** Seconds before it plays. */
  delay?: number;
  /** `enter` only. Default REVEAL.enterStart ("top 85%"). */
  start?: string;
}

export function RevealMotion({
  when,
  y,
  duration = DURATION.fadeUp,
  stagger = STAGGER.reveal,
  delay = 0,
  start = REVEAL.enterStart,
}: RevealMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(
    ref,
    (mm) => {
      const el = ref.current?.previousElementSibling;
      if (!(el instanceof HTMLElement)) return;
      const targets = el.dataset.reveal === "self" ? [el] : [...el.children];
      if (targets.length === 0) return;

      mm.add(MEDIA.motion, () => {
        const rest = { opacity: 1, y: 0, duration, stagger, delay };
        if (when === "enter") {
          gsap.fromTo(
            targets,
            { opacity: 0, y },
            { ...rest, scrollTrigger: { trigger: el, start, once: true } },
          );
          return;
        }
        gate(gsap.fromTo(targets, { opacity: 0, y }, { ...rest, paused: true }));
      });
      mm.add(MEDIA.reduce, () => {
        if (motionAllowed()) gsap.set(targets, { opacity: 1, y: 0 });
      });
    },
    [when, y, duration, stagger, delay, start],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
