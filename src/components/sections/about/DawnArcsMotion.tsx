"use client";

/* `from: "end"`: the last arc in the markup is the innermost, so the dawn opens from the core
   outwards. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { motionAllowed } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { ABOUT, DURATION, MEDIA, STAGGER } from "@/lib/motion";

export function DawnArcsMotion() {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(ref, (mm) => {
    const arcs = [...(ref.current?.parentElement?.querySelectorAll<HTMLElement>(".arc") ?? [])];
    if (arcs.length === 0) return;
    // `y: 0` too: GSAP reads the CSS start state's translateY(18%) as a pixel `y`, which the
    // yPercent tween alone would leave in place.
    const rest = { y: 0, yPercent: 0, scale: 1, opacity: 1 };

    mm.add(MEDIA.motion, () => {
      gate(
        gsap.fromTo(
          arcs,
          { ...ABOUT.dawn.arcsFrom, y: 0, opacity: 0, transformOrigin: "50% 50%" },
          {
            ...rest,
            duration: DURATION.intro,
            stagger: { each: STAGGER.arcs, from: "end" },
            paused: true,
          },
        ),
      );
    });
    mm.add(MEDIA.reduce, () => {
      if (motionAllowed()) gsap.set(arcs, rest);
    });
  });

  return <span ref={ref} hidden data-motion-leaf="" />;
}
