"use client";

/* The hero wordmark's intro (prototype Pages.home): at the loader's ready signal the width axis
   settles from 75 to 100 (DURATION.heroWidth) while the letters rise through their masks
   (CHARS_PACE.hero). Page-specific, and not the SplitReveal primitive, because the width axis
   reflows text: animated naively, every letter's layout box moves on every frame, which the
   browser counts as layout shift (CLS 0.058 measured at 1440 px).

   So the layout never moves. The word is painted at its final width under the loader (it is
   fitted by FitText and is an LCP candidate, decision T7). Once the web fonts are in, it is split
   into masked letters and each mask's width is frozen at its final value; the axis is set to 75
   on the heading, so only the glyphs narrow inside their fixed boxes, and each mask is moved left
   by a transform (x) to close the gaps, which paints the condensed word. The intro tweens the axis
   back to 100 and the transforms back to 0 together. Transforms and glyph widths inside a fixed box
   are not layout shifts. At the end the frozen widths are released (they equal the natural ones).

   Reduced motion and no JavaScript: nothing is split, the word rests at its final width. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { gsap, loadSplitText } from "@/lib/gsap";
import { CHARS_PACE, DURATION, HOME, MEDIA, REVEAL } from "@/lib/motion";

const AXIS = "--wdth";

/** Freezes each mask at its current (final) width, narrows the glyphs, and returns the x offset,
    in em, that puts each mask where it would sit in the condensed word. Widths and offsets are in
    em so the word still scales linearly with its font size: FitText may refit it (the split word
    is a little wider than the unsplit one, without kerning) and must converge. Reads, writes,
    then one read. */
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

/** x offset of each box: where it starts in the condensed run minus where it starts at rest. */
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
      // The letters are measured with the web font, as the prototype waited for fonts.ready.
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
