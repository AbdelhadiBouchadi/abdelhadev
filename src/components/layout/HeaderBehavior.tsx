"use client";

/* Hide on scroll for the header (prototype `initTone`, header block): hidden when scrolling down
   past 240 px, back on any upward scroll, never hidden while focus is inside it. CSS moves it
   (`.site-header.is-hidden`, 0.7 s warm); reduced motion shortens the transition to nothing. */
import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SHELL } from "@/lib/motion";

export function HeaderBehavior() {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const header = ref.current?.closest("header");
      if (!header) return;
      const focusInside = () => header.contains(document.activeElement);
      const show = () => {
        header.classList.remove("is-hidden");
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const hide =
            self.direction === 1 && self.scroll() > SHELL.headerHideAfter && !focusInside();
          header.classList.toggle("is-hidden", hide);
        },
      });
      header.addEventListener("focusin", show);
      return () => {
        header.removeEventListener("focusin", show);
        show();
      };
    },
    { scope: ref },
  );

  return <span ref={ref} hidden />;
}
