"use client";

/* The client leaf of SplitReveal: splits the element before it and reveals the pieces.
   - `ready`: plays when the loader signals ready (after `delay`). The text is painted under the
     overlay first (it may be the LCP element, decision T7); the split hides it before the overlay
     lifts.
   - `enter`: plays once when the element reaches `start` (default REVEAL.enterStart).
   - `scrub`: tied to the scroll range `start`..`end` of `trigger` (default: the element).
   SplitText loads on demand (lib/gsap.ts) and re-splits on resize and font load (`autoSplit`), so
   the tween is rebuilt in onSplit; once the reveal has played, a re-split leaves the text in place.
   SplitText's default `aria` handling stays: the element keeps its accessible name. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { gsap, loadSplitText } from "@/lib/gsap";
import { CHARS_PACE, DURATION, MEDIA, REVEAL, SCRUB, STAGGER } from "@/lib/motion";
import { resolveTrigger } from "@/lib/scroll";

export interface SplitRevealMotionProps {
  type: "lines" | "chars";
  when: "ready" | "enter" | "scrub";
  /** Seconds after the ready signal (`ready` only); a DELAY or DURATION constant. */
  delay?: number;
  /** ScrollTrigger start (`enter`, `scrub`). */
  start?: string;
  /** ScrollTrigger end (`scrub`). */
  end?: string;
  /** Selector of the element whose scroll range drives the reveal: the nearest matching ancestor,
      else the first match on the page. Default: the heading itself. */
  trigger?: string;
  /** Chars only: the home hero wordmark pace or the case study product name pace. */
  pace?: keyof typeof CHARS_PACE;
}

export function SplitRevealMotion({
  type,
  when,
  delay = 0,
  start = REVEAL.enterStart,
  end = "bottom top",
  trigger,
  pace = "hero",
}: SplitRevealMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(
    ref,
    (mm) => {
      const el = ref.current?.previousElementSibling;
      if (!(el instanceof HTMLElement)) return;
      const chars = type === "chars";
      const from = chars ? REVEAL.charsYPercent : REVEAL.linesYPercent;
      const { duration, stagger } = chars
        ? CHARS_PACE[pace]
        : { duration: DURATION.lines, stagger: STAGGER.lines };

      mm.add(MEDIA.motion, (context) => {
        let alive = true;
        let played = false;
        void loadSplitText().then((SplitText) => {
          if (!alive) return;
          context.add(() => {
            SplitText.create(el, {
              type,
              mask: type,
              autoSplit: true,
              smartWrap: chars,
              onSplit: (self) => {
                if (played) return undefined;
                const targets = chars ? self.chars : self.lines;
                if (when === "scrub") {
                  return gsap.fromTo(
                    targets,
                    { yPercent: from },
                    {
                      yPercent: 0,
                      duration,
                      stagger,
                      scrollTrigger: {
                        trigger: resolveTrigger(el, trigger),
                        start,
                        end,
                        scrub: SCRUB,
                      },
                    },
                  );
                }
                if (when === "enter") {
                  return gsap.fromTo(
                    targets,
                    { yPercent: from },
                    {
                      yPercent: 0,
                      duration,
                      stagger,
                      scrollTrigger: {
                        trigger: resolveTrigger(el, trigger),
                        start,
                        once: true,
                        onEnter: () => {
                          played = true;
                        },
                      },
                    },
                  );
                }
                const intro = gsap.fromTo(
                  targets,
                  { yPercent: from },
                  {
                    yPercent: 0,
                    duration,
                    stagger,
                    delay,
                    paused: true,
                    onComplete: () => {
                      played = true;
                    },
                  },
                );
                gate(intro);
                return intro;
              },
            });
          });
        });
        return () => {
          alive = false;
        };
      });
    },
    [type, when, delay, start, end, trigger, pace],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
