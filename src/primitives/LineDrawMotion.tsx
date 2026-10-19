"use client";

import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { motionAllowed } from "@/lib/css";
import { gsap, loadDrawSVG } from "@/lib/gsap";
import { DURATION, EASE, LINE_DRAW, MEDIA, SCRUB } from "@/lib/motion";
import { resolveTrigger } from "@/lib/scroll";

export interface LineDrawMotionProps {
  /** The nearest matching ancestor, else the first match on the page. */
  trigger?: string;
  start?: string;
  end?: string;
}

export function LineDrawMotion({
  trigger,
  start = LINE_DRAW.start,
  end = LINE_DRAW.end,
}: LineDrawMotionProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useMotion(
    ref,
    (mm) => {
      const el = ref.current?.previousElementSibling;
      if (!(el instanceof HTMLElement)) return;
      const nodes = [...el.querySelectorAll<SVGElement>("[data-node]")];
      const wires = [...el.querySelectorAll<SVGElement>("[data-wire]")];

      mm.add(MEDIA.motion, (context) => {
        let alive = true;
        void loadDrawSVG().then(() => {
          if (!alive) return;
          context.add(() => {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: resolveTrigger(el, trigger), start, end, scrub: SCRUB },
            });
            nodes.forEach((node, i) => {
              tl.fromTo(
                node,
                { opacity: 0, y: LINE_DRAW.nodeY },
                { opacity: 1, y: 0, duration: DURATION.node },
                i * LINE_DRAW.step,
              );
            });
            wires.forEach((wire, i) => {
              tl.fromTo(
                wire,
                { drawSVG: "0%" },
                { drawSVG: "100%", duration: DURATION.wire, ease: EASE.none },
                LINE_DRAW.wireOffset + i * LINE_DRAW.step,
              );
            });
            // The wires are hidden by CSS until DrawSVG has collapsed them to nothing.
            gsap.set(wires, { visibility: "visible" });
          });
        });
        return () => {
          alive = false;
        };
      });
      mm.add(MEDIA.reduce, () => {
        if (!motionAllowed()) return;
        gsap.set(nodes, { opacity: 1, y: 0 });
        gsap.set(wires, { visibility: "visible" });
      });
    },
    [trigger, start, end],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
