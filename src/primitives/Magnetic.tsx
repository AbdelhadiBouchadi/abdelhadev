"use client";

/* The prototype's `.magnetic` (initCursor): the wrapper follows the pointer by 22 % horizontally
   and 30 % vertically of its offset from the centre, through quickTo (0.6 s, warm), and returns on
   leave. Fine pointers only, off under reduced motion. GSAP moves the wrapper, never the child,
   so the child keeps its own Tailwind transforms (AGENTS.md, Motion rules). */
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, EASE, MAGNETIC, MEDIA } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface MagneticProps {
  children: ReactNode;
  className?: string;
}

export function Magnetic({ children, className }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(`${MEDIA.finePointer} and ${MEDIA.motion}`, () => {
        const options = { duration: DURATION.base, ease: EASE.warm };
        const toX = gsap.quickTo(el, "x", options);
        const toY = gsap.quickTo(el, "y", options);
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          toX((e.clientX - (r.left + r.width / 2)) * MAGNETIC.x);
          toY((e.clientY - (r.top + r.height / 2)) * MAGNETIC.y);
        };
        const leave = () => {
          toX(0);
          toY(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      });
      return () => {
        mm.revert();
      };
    },
    { scope: ref },
  );

  return (
    <span ref={ref} data-magnetic className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
