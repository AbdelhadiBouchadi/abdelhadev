"use client";

/* The client leaf of the product tour (prototype Pages.case, "the screen follows the step you are
   reading"). useScrollSpy names the step crossing SPY.tour (55 %) of the viewport; the active step
   gets data-on (its number turns Majorelle in CSS) and [data-tour] carries data-tour-active.
   With motion, from 901 px, the active stage screen crossfades in (DURATION.crossfade, scale
   CASE.tour.screenFrom → 1) while the others fade out, and the other steps dim to
   CASE.tour.dimOpacity and CASE.tour.dimScale (DURATION.stepDim). Before the first step reaches
   the line nothing is dimmed and the first screen shows (CSS). When that condition ends (reduced
   motion switched on, a resize under 901 px) or the page is left, the tweens are killed and the
   inline styles cleared, so the steps are at rest again. The spy itself runs everywhere. */
import { useEffect, useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { gsap } from "@/lib/gsap";
import { CASE, DURATION, MEDIA, SPY } from "@/lib/motion";

export interface TourMotionProps {
  /** The ids of the tour steps, in order (one stage slot per step, same order). */
  ids: readonly string[];
}

interface TourParts {
  root: HTMLElement;
  steps: HTMLElement[];
  slots: HTMLElement[];
}

function parts(leaf: HTMLElement | null): TourParts | null {
  const root = leaf?.closest<HTMLElement>("[data-tour]");
  if (!root) return null;
  return {
    root,
    steps: [...root.querySelectorAll<HTMLElement>(".tour-step")],
    slots: [...root.querySelectorAll<HTMLElement>("[data-tour-slot]")],
  };
}

export function TourMotion({ ids }: TourMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { activeIndex } = useScrollSpy(ids, { line: SPY.tour });
  const active = useRef(-1);
  /** Shows step `i` on the stage; null while the stage is not in use. */
  const show = useRef<((i: number) => void) | null>(null);

  useMotion(ref, (mm) => {
    const found = parts(ref.current);
    if (!found) return;
    const { steps, slots } = found;
    const all = [...slots, ...steps];

    mm.add(`${MEDIA.motion} and ${MEDIA.split}`, () => {
      show.current = (i) => {
        slots.forEach((slot, j) => {
          gsap.to(slot, {
            opacity: j === i ? 1 : 0,
            scale: j === i ? 1 : CASE.tour.screenFrom,
            duration: DURATION.crossfade,
            overwrite: true,
          });
        });
        steps.forEach((step, j) => {
          gsap.to(step, {
            opacity: j === i ? 1 : CASE.tour.dimOpacity,
            scale: j === i ? 1 : CASE.tour.dimScale,
            duration: DURATION.stepDim,
            overwrite: true,
          });
        });
      };
      if (active.current >= 0) show.current(active.current);
      return () => {
        // The tweens start after this setup (on each scroll spy change), outside its context.
        show.current = null;
        gsap.killTweensOf(all);
        gsap.set(all, { clearProps: "opacity,transform" });
      };
    });
  });

  useEffect(() => {
    active.current = activeIndex;
    const found = parts(ref.current);
    if (!found) return;
    found.root.dataset.tourActive = String(activeIndex);
    found.steps.forEach((step, i) => {
      step.toggleAttribute("data-on", i === activeIndex);
    });
    if (activeIndex >= 0) show.current?.(activeIndex);
  }, [activeIndex]);

  return <span ref={ref} hidden data-motion-leaf="" />;
}
