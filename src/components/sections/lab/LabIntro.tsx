"use client";

/* The lab's intro (removed in 03 with the lab): fades the elements marked data-intro in when the
   loader signals ready, to exercise useLoaderReady. Hidden until then only under html.motion (CSS
   in globals.css); under reduced motion nothing is hidden and nothing moves. */
import { useRef } from "react";
import { useLoaderReady } from "@/hooks/useLoaderReady";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, MEDIA } from "@/lib/motion";

export function LabIntro() {
  const ref = useRef<HTMLSpanElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  useLoaderReady(() => {
    contextSafe(() => {
      const section = ref.current?.parentElement;
      if (!section) return;
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          section.querySelectorAll("[data-intro]"),
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: DURATION.fadeUp },
        );
      });
    })();
  });

  return <span ref={ref} hidden />;
}
