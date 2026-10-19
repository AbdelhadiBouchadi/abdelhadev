"use client";

/* SplitText re-splits on resize and font load (`autoSplit`), so the tween is rebuilt in onSplit.
   Once the reveal has played, a re-split leaves the text in place. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { gsap, loadSplitText } from "@/lib/gsap";
import { CHARS_PACE, DURATION, MEDIA, REVEAL, SCRUB, STAGGER } from "@/lib/motion";
import { resolveTrigger } from "@/lib/scroll";

export interface SplitRevealMotionProps {
  type: "lines" | "chars";
  when: "ready" | "enter" | "scrub";
  /** `ready` only; a DELAY or DURATION constant. */
  delay?: number;
  start?: string;
  end?: string;
  /** The nearest matching ancestor, else the first match on the page. */
  trigger?: string;
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
