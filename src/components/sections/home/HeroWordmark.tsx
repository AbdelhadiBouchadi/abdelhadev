"use client";

/* Not SplitReveal: the width axis reflows text, and animating it naively moves every letter's
   layout box each frame, which counts as layout shift. So each mask is frozen at its final width,
   the glyphs narrow inside it and a transform closes the gaps; the intro tweens both back. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { gsap, loadSplitText } from "@/lib/gsap";
import { CHARS_PACE, DURATION, HOME, MEDIA, REVEAL } from "@/lib/motion";

const AXIS = "--wdth";

/** Widths and offsets are in em, so the word still scales with its font size and FitText's refit
    converges. Reads, writes, then one read. */
export function lockLetters(
  heading: HTMLElement,
  masks: readonly HTMLElement[],
  chars: readonly HTMLElement[],
): number[] {
  const em = parseFloat(getComputedStyle(masks[0] ?? heading).fontSize) || 1;
  const finals = masks.map((m) => m.getBoundingClientRect().width / em);
  masks.forEach((m, i) => {
    m.style.width = `${String(finals[i] ?? 0)}em`;
  });
  heading.style.setProperty(AXIS, String(HOME.hero.wdthFrom));
  const narrows = chars.map((c) => c.getBoundingClientRect().width / em);
  return condensedOffsets(finals, narrows);
}

export function condensedOffsets(finals: readonly number[], narrows: readonly number[]): number[] {
  let rest = 0;
  let condensed = 0;
  return finals.map((width, i) => {
    const x = condensed - rest;
    rest += width;
    condensed += narrows[i] ?? width;
    return x;
  });
}

export function HeroWordmark() {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(ref, (mm) => {
    const heading = ref.current?.previousElementSibling;
    const letters = heading?.querySelector("[data-hero-letters]");
    if (!(heading instanceof HTMLElement) || !(letters instanceof HTMLElement)) return;

    mm.add(MEDIA.motion, (context) => {
      let alive = true;
      // Measured with the web font.
      void Promise.all([loadSplitText(), document.fonts.ready]).then(([SplitText]) => {
        if (!alive) return;
        context.add(() => {
          const split = SplitText.create(letters, {
            type: "chars",
            mask: "chars",
            // The letters are aria-hidden: the heading's name is its screen-reader sentence.
            aria: "none",
          });
          const chars = split.chars.filter((c): c is HTMLElement => c instanceof HTMLElement);
          const masks = split.masks.filter((m): m is HTMLElement => m instanceof HTMLElement);
          const offsets = lockLetters(heading, masks, chars);
          const { duration, stagger } = CHARS_PACE.hero;
          const intro = gsap
            .timeline({
              paused: true,
              onComplete: () => {
                for (const m of masks) m.style.width = "";
              },
            })
            .fromTo(
              heading,
              { [AXIS]: HOME.hero.wdthFrom },
              { [AXIS]: HOME.hero.wdthTo, duration: DURATION.heroWidth },
              0,
            )
            .fromTo(
              masks,
              { x: (i: number) => `${String(offsets[i] ?? 0)}em` },
              { x: 0, duration: DURATION.heroWidth },
              0,
            )
            .fromTo(
              chars,
              { yPercent: REVEAL.charsYPercent },
              { yPercent: 0, duration, stagger },
              0,
            );
          gate(intro);
        });
      });
      return () => {
        alive = false;
      };
    });
  });

  return <span ref={ref} hidden data-motion-leaf="" />;
}
