"use client";

/* Writes one value of the 3D scene's progress (lib/scene-state.ts) from a scroll range, as the
   prototype's `st.p1` (hero) and `st.p2` (manifesto) triggers. Raw progress, not scrubbed: the
   smooth scroll already eases it. Only while motion runs; the still scene reads nothing. The
   value goes back to 0 when the leaf unmounts. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { ScrollTrigger } from "@/lib/gsap";
import { MEDIA } from "@/lib/motion";
import { sceneState, type SceneKey } from "@/lib/scene-state";

export interface SceneProgressProps {
  value: Exclude<SceneKey, "p3">;
  /** Selector of the section whose range drives the value. */
  trigger: string;
  start: string;
  end: string;
}

export function SceneProgress({ value, trigger, start, end }: SceneProgressProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useMotion(
    ref,
    (mm) => {
      mm.add(MEDIA.motion, () => {
        // An element, not a selector: useGSAP's scope would look for a selector inside this leaf.
        const section = document.querySelector(trigger);
        if (!section) return undefined;
        ScrollTrigger.create({
          trigger: section,
          start,
          end,
          onUpdate: (self) => {
            sceneState.set(value, self.progress);
          },
        });
        return () => {
          sceneState.set(value, 0);
        };
      });
    },
    [value, trigger, start, end],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
