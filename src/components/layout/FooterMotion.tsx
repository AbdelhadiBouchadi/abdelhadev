"use client";

/* The footer's motion (prototype `footerWord`): the call-to-action heading rises by lines when it
   reaches 80 % of the viewport, and the giant wordmark rises from yPercent 60 to 14 as the footer
   scrolls in (scrubbed). Under reduced motion nothing moves: the wordmark keeps its resting offset
   from CSS and the heading is never split. */
import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, LOADER_MOVE, MEDIA, SCRUB, SHELL, STAGGER } from "@/lib/motion";

export function FooterMotion() {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const footer = ref.current?.closest("footer");
      const word = footer?.querySelector<HTMLElement>("[data-footer-word]");
      const cta = footer?.querySelector<HTMLElement>("[data-footer-cta]");
      if (!footer || !word || !cta) return;

      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          word,
          { yPercent: SHELL.footerWordFrom },
          {
            yPercent: SHELL.footerWordTo,
            ease: EASE.none,
            scrollTrigger: {
              trigger: footer,
              start: "top bottom",
              end: "bottom bottom",
              scrub: SCRUB,
            },
          },
        );

        // Lines are measured after the fonts load (autoSplit re-splits then). Once the heading has
        // played, a re-split (resize, fonts) keeps it in place instead of hiding it again.
        let played = false;
        SplitText.create(cta, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            if (played) return undefined;
            return gsap.fromTo(
              self.lines,
              { yPercent: LOADER_MOVE.linesYPercent },
              {
                yPercent: 0,
                duration: DURATION.lines,
                stagger: STAGGER.lines,
                scrollTrigger: {
                  trigger: cta,
                  start: SHELL.footerCtaStart,
                  once: true,
                  onEnter: () => {
                    played = true;
                  },
                },
              },
            );
          },
        });
      });
      return () => {
        mm.revert();
      };
    },
    { scope: ref },
  );

  return <span ref={ref} hidden />;
}
