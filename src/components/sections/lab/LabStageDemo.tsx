"use client";

/* The StickyStage bench (removed in 03 with the lab): a stage timeline in the manner of the home
   featured work. Desktop: the copy fades up, then four screens open one after another from the
   bottom while their inner screens settle, scrubbed over the 300 vh section. Mobile (the section is
   in normal flow there): each screen opens as it enters, on its own scrubbed range. Reduced motion:
   nothing is built and everything is at rest. The active condition is mirrored on data-condition
   so tests and videos can show which branch runs. */
import type { ReactNode } from "react";
import { readToken } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { EASE, MEDIA_REVEAL, REVEAL, SCRUB, STAGGER } from "@/lib/motion";
import { insetClip } from "@/lib/scroll";
import { useStageTimeline } from "@/primitives/useStageTimeline";

export interface LabStageDemoProps {
  children: ReactNode;
}

export function LabStageDemo({ children }: LabStageDemoProps) {
  const { ref, condition } = useStageTimeline<HTMLDivElement>(
    ({ timeline, condition: now, stage }) => {
      const copy = stage.querySelectorAll("[data-stage-copy] > *");
      const tiles = [...stage.querySelectorAll<HTMLElement>("[data-tile]")];
      const inners = tiles.map((tile) => tile.querySelector("[data-media-inner]"));
      const bar = stage.querySelector("[data-stage-bar]");
      const radius = readToken("r-frame");
      const closed = { clipPath: insetClip([100, 0, 0, 0], radius) };
      const open = { clipPath: insetClip([0, 0, 0, 0], radius) };
      const zoom = { scale: MEDIA_REVEAL.scrub.scale };

      if (timeline) {
        timeline
          .fromTo(
            copy,
            { opacity: 0, y: REVEAL.fadeY },
            { opacity: 1, y: 0, stagger: STAGGER.projectHead },
            0,
          )
          .fromTo(tiles, closed, { ...open, stagger: STAGGER.tiles }, 0.15)
          .fromTo(inners, zoom, { scale: 1, stagger: STAGGER.tiles }, 0.15);
        if (bar)
          timeline.fromTo(
            bar,
            { scaleX: 0 },
            { scaleX: 1, ease: EASE.none, duration: timeline.duration() },
            0,
          );
        return undefined;
      }
      if (now !== "mobile") return undefined;
      const { start, end } = MEDIA_REVEAL.scrub;
      tiles.forEach((tile, i) => {
        const tl = gsap.timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: { trigger: tile, start, end, scrub: SCRUB },
        });
        tl.fromTo(tile, closed, open, 0);
        const inner = inners[i];
        if (inner) tl.fromTo(inner, zoom, { scale: 1 }, 0);
      });
      return undefined;
    },
  );

  return (
    <div ref={ref} data-condition={condition ?? ""} className="grid w-full gap-8">
      {children}
    </div>
  );
}
