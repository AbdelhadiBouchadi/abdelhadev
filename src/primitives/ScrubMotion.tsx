"use client";

import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { gsap } from "@/lib/gsap";
import { EASE, MEDIA, SCRUB } from "@/lib/motion";
import { resolveTrigger } from "@/lib/scroll";

/** Transforms and opacity only, never layout. */
export type ScrubVars = Partial<
  Record<
    "x" | "y" | "xPercent" | "yPercent" | "scale" | "scaleX" | "scaleY" | "rotation" | "opacity",
    number
  >
>;

export interface ScrubMotionProps {
  /** Default: the element's CSS state. */
  from?: ScrubVars;
  to: ScrubVars;
  /** The nearest matching ancestor, else the first match on the page. */
  trigger?: string;
  start?: string;
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
