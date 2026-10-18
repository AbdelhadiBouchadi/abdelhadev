"use client";

/* The dawn's arcs rising (prototype Pages.about intro): at the loader's ready signal the four arcs
   rise from ABOUT.dawn.arcsFrom, grow to full size and fade in over DURATION.intro (2.2 s), one
   STAGGER.arcs (0.14 s) apart, `from: "end"` as in the prototype: the last arc in the markup is
   the innermost (the sun's core), so the dawn opens from the core outwards (docs/choreography.md
   says "from the outside"; the prototype's value is ported, AGENTS.md). The scroll part (the arcs
   expanding and fading) is the Scrub around them. The start state is CSS under html.motion
   (src/styles/about.css); the reduced branch pins the arcs at rest if reduced motion is switched
   on mid-visit. Sits inside the .arcs element, after the arcs. */
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
