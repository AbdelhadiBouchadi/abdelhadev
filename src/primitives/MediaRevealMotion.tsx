"use client";

/* The client leaf of MediaReveal. The radius comes from its token, read once (lib/css.ts), so the
   tweened clip-path string carries the token's value. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { motionAllowed, readToken } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { DELAY, DURATION, EASE, MEDIA, MEDIA_REVEAL, SCRUB } from "@/lib/motion";
import { insetClip } from "@/lib/scroll";

const OPEN = [0, 0, 0, 0] as const;

export interface MediaRevealMotionProps {
  variant: "scrub" | "intro";
}

export function MediaRevealMotion({ variant }: MediaRevealMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(
    ref,
    (mm) => {
      const el = ref.current?.previousElementSibling;
      if (!(el instanceof HTMLElement)) return;
      const inner = el.querySelector<HTMLElement>("[data-media-inner]");

      mm.add(MEDIA.motion, () => {
        const spec = MEDIA_REVEAL[variant];
        const radius = readToken(`r-${spec.radius}`);
        const closed = { clipPath: insetClip(spec.inset, radius) };
        const open = { clipPath: insetClip(OPEN, radius) };

        if (variant === "scrub") {
          const { start, end } = MEDIA_REVEAL.scrub;
          const tl = gsap.timeline({
            defaults: { ease: EASE.none },
            scrollTrigger: { trigger: el, start, end, scrub: SCRUB },
          });
          tl.fromTo(el, closed, open, 0);
          if (inner) tl.fromTo(inner, { scale: spec.scale }, { scale: 1 }, 0);
          return;
        }

        const tl = gsap.timeline({ paused: true, delay: DELAY.shot });
        tl.fromTo(el, closed, { ...open, duration: DURATION.shotClip }, 0);
        if (inner)
          tl.fromTo(inner, { scale: spec.scale }, { scale: 1, duration: DURATION.shotScale }, 0);
        gate(tl);
      });
      mm.add(MEDIA.reduce, () => {
        if (!motionAllowed()) return;
        gsap.set(el, { clipPath: "none" });
        if (inner) gsap.set(inner, { scale: 1 });
      });
    },
    [variant],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
