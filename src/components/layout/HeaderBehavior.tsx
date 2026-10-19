"use client";

/* Never hidden while focus is inside it. */
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
