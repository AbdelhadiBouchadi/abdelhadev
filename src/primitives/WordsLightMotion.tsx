"use client";

/* The client leaf of WordsLight. Words are split as inline spans with `aria: "none"`: the text
   stays in the accessibility tree word by word, in order, so the statement can stay a paragraph
   (SplitText's "auto" would put an aria-label on it, which ARIA prohibits on a <p>). The tween is
   rebuilt in onSplit (`autoSplit`), as every SplitText use in this repository. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { gsap, loadSplitText } from "@/lib/gsap";
import { EASE, MEDIA, REVEAL, SCRUB, STAGGER } from "@/lib/motion";
import { resolveTrigger } from "@/lib/scroll";

export interface WordsLightMotionProps {
  /** Selector of the element whose range drives the lighting: the nearest matching ancestor (the
      home manifesto's whole sticky section: "[data-stage]"), else the first match on the page.
      Default: the statement itself. */
  trigger?: string;
  /** Default REVEAL.wordsStart ("top 75%"). */
  start?: string;
  /** Default REVEAL.wordsEnd ("bottom 40%"). */
  end?: string;
}

export function WordsLightMotion({
  trigger,
  start = REVEAL.wordsStart,
  end = REVEAL.wordsEnd,
}: WordsLightMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useMotion(
    ref,
    (mm) => {
      const el = ref.current?.previousElementSibling;
      if (!(el instanceof HTMLElement)) return;
      mm.add(MEDIA.motion, (context) => {
        let alive = true;
        void loadSplitText().then((SplitText) => {
          if (!alive) return;
          context.add(() => {
            SplitText.create(el, {
              type: "words",
              tag: "span",
              aria: "none",
              autoSplit: true,
              onSplit: (self) =>
                gsap.fromTo(
                  self.words,
                  { opacity: REVEAL.wordsFrom },
                  {
                    opacity: 1,
                    stagger: STAGGER.words,
                    ease: EASE.none,
                    scrollTrigger: {
                      trigger: resolveTrigger(el, trigger),
                      start,
                      end,
                      scrub: SCRUB,
                    },
                  },
                ),
            });
          });
        });
        return () => {
          alive = false;
        };
      });
    },
    [trigger, start, end],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
