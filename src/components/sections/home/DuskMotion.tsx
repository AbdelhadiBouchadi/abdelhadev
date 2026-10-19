"use client";

import { readColorTokens } from "@/lib/css-tokens";
import { motionAllowed } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { EASE, HOME } from "@/lib/motion";
import { duskToP3, sceneState } from "@/lib/scene-state";
import { useStageTimeline } from "@/primitives/useStageTimeline";

const COLOURS = ["paper", "sunset", "night", "ink", "ink-soft", "moon", "moon-soft"] as const;

/** Mirrored on <html data-dusk>: the night sections below show the sky through them only while
    the dusk is on screen, so their colours stay measurable by contrast checkers otherwise. */
type DuskPhase = "before" | "during" | "after";

function phaseOf(progress: number): DuskPhase {
  if (progress <= 0) return "before";
  return progress >= 1 ? "after" : "during";
}

function setPhase(phase: DuskPhase | null) {
  const html = document.documentElement;
  if (phase === null) delete html.dataset.dusk;
  else if (html.dataset.dusk !== phase) html.dataset.dusk = phase;
}

export function DuskMotion() {
  const { ref } = useStageTimeline<HTMLSpanElement>(
    ({ timeline, stage }) => {
      const title = stage.querySelector("[data-dusk-title]");
      const sub = stage.querySelector("[data-dusk-sub]");
      if (!timeline) {
        // Reduced motion switched on mid-visit: the CSS start state must not hide the sub.
        if (sub && motionAllowed()) gsap.set(sub, { opacity: 1, y: 0 });
        return undefined;
      }
      const sky = document.getElementById("sky");
      const c = readColorTokens(COLOURS);
      const d = HOME.dusk;
      const linear = { ease: EASE.none };
      if (sky) {
        timeline
          .fromTo(
            sky,
            { backgroundColor: c.paper },
            { ...linear, backgroundColor: c.sunset, duration: d.sunsetDuration },
            0,
          )
          .fromTo(
            sky,
            { backgroundColor: c.sunset },
            {
              ...linear,
              backgroundColor: c.night,
              duration: d.nightDuration,
              immediateRender: false,
            },
            d.nightAt,
          );
      }
      if (title) {
        timeline.fromTo(
          title,
          { color: c.ink },
          { ...linear, color: c.moon, duration: d.colourDuration },
          d.colourAt,
        );
      }
      if (sub) {
        timeline
          .fromTo(
            sub,
            { color: c["ink-soft"] },
            { ...linear, color: c["moon-soft"], duration: d.colourDuration },
            d.colourAt,
          )
          .fromTo(
            sub,
            { opacity: 0, y: d.subY },
            { opacity: 1, y: 0, duration: d.subDuration },
            d.subAt,
          );
      }
      setPhase(phaseOf(timeline.scrollTrigger?.progress ?? 0));
      return () => {
        sceneState.set("p3", 0);
        setPhase(null);
      };
    },
    {
      start: HOME.dusk.start,
      end: HOME.dusk.end,
      onUpdate: (progress) => {
        sceneState.set("p3", duskToP3(progress));
        setPhase(phaseOf(progress));
      },
    },
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
