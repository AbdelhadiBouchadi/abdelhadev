"use client";

/* The client leaf of Sky (prototype Pages.home): while motion runs it puts `sky` on <html> (the
   sections turn transparent over the fixed sky), rises the sun glow at the loader's ready signal
   (DURATION.intro), and sinks and fades the sun from the top of the hero to the centre of the dusk,
   scrubbed. Everything is reverted on unmount: leaving the home page removes `sky`. Under reduced
   motion nothing runs and the CSS shows the still sun inside the hero. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, HOME, MEDIA, SCRUB } from "@/lib/motion";

export function SkyMotion() {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(ref, (mm) => {
    const sun = ref.current?.previousElementSibling;
    const glow = sun?.firstElementChild;
    if (!(sun instanceof HTMLElement) || !(glow instanceof HTMLElement)) return;

    mm.add(MEDIA.motion, () => {
      const html = document.documentElement;
      // Elements, not selectors: useGSAP's scope would look for a selector inside this leaf.
      const hero = document.getElementById("hero");
      const dusk = document.getElementById("dusk");
      html.classList.add("sky");

      // y: 0 drops the CSS start state's translateY, which GSAP reads as pixels.
      gate(
        gsap.fromTo(
          glow,
          { y: 0, yPercent: HOME.sun.fromYPercent, opacity: 0 },
          { y: 0, yPercent: 0, opacity: 1, duration: DURATION.intro, paused: true },
        ),
      );

      const { sink, sinkDuration, fadeAt, fadeDuration } = HOME.sun;
      gsap
        .timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            endTrigger: dusk,
            end: "center center",
            scrub: SCRUB,
          },
        })
        .fromTo(sun, { yPercent: 0, scale: 1 }, { ...sink, duration: sinkDuration }, 0)
        .fromTo(sun, { opacity: 1 }, { opacity: 0, duration: fadeDuration }, fadeAt);

      return () => {
        html.classList.remove("sky");
      };
    });
  });

  return <span ref={ref} hidden data-motion-leaf="" />;
}
