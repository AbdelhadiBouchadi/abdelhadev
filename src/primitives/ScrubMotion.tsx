"use client";

/* The client leaf of Scrub: one fromTo tween, linear (EASE.none), scrubbed (SCRUB). */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { gsap } from "@/lib/gsap";
import { EASE, MEDIA, SCRUB } from "@/lib/motion";
import { resolveTrigger } from "@/lib/scroll";

/** The values a Scrub may move: transforms and opacity, never layout (AGENTS.md, Motion rules). */
export type ScrubVars = Partial<
  Record<
    "x" | "y" | "xPercent" | "yPercent" | "scale" | "scaleX" | "scaleY" | "rotation" | "opacity",
    number
  >
>;

export interface ScrubMotionProps {
  /** Values at the start of the range. Default: none (the element's CSS state). */
  from?: ScrubVars;
  /** Values at the end of the range (from SETTLE or another lib/motion.ts constant). */
  to: ScrubVars;
  /** Selector of the element whose range drives the scrub: the nearest matching ancestor, else the
      first match on the page. Default: the Scrub element. */
  trigger?: string;
  /** Default "top bottom". */
  start?: string;
  /** Default "bottom top". */
  end?: string;
}

export function ScrubMotion({
  from = {},
  to,
  trigger,
  start = "top bottom",
  end = "bottom top",
}: ScrubMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Plain objects from a Server Component arrive as new objects on every render: depend on their
  // content, not their identity.
  const fromKey = JSON.stringify(from);
  const toKey = JSON.stringify(to);

  useMotion(
    ref,
    (mm) => {
      const el = ref.current?.previousElementSibling;
      if (!(el instanceof HTMLElement)) return;
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          el,
          { ...from },
          {
            ...to,
            ease: EASE.none,
            scrollTrigger: { trigger: resolveTrigger(el, trigger), start, end, scrub: SCRUB },
          },
        );
      });
    },
    [fromKey, toKey, trigger, start, end],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
