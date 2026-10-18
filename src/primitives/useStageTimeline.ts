import { useEffect, useRef, useState, type RefObject } from "react";
import { useMotion } from "@/hooks/useMotion";
import { gsap } from "@/lib/gsap";
import { MEDIA, SCRUB, STAGE } from "@/lib/motion";
import { stageCondition, type StageCondition } from "@/lib/scroll";

export type { StageCondition };

export interface StageBuild {
  /** Scrubbed (SCRUB) over the stage section's range; null under reduced motion and on mobile when
      the section is in normal flow there (mobileHeight "auto"). Add tweens to it; give scrubbed
      maps that must stay linear `ease: EASE.none` (the house ease is the default). */
  timeline: gsap.core.Timeline | null;
  condition: StageCondition;
  /** The StickyStage section and its sticky stage. */
  section: HTMLElement;
  stage: HTMLElement;
}

export interface StageTimelineOptions {
  /** Default STAGE.start ("top top"); home dusk uses "top bottom". */
  start?: string;
  /** Default STAGE.end ("bottom bottom"); home dusk uses "bottom top". */
  end?: string;
  /** Called with the range's progress on every update (not smoothed by the scrub). */
  onUpdate?: (progress: number) => void;
}

export interface StageTimeline<T extends Element> {
  /** Attach to any element inside the StickyStage. */
  ref: RefObject<T | null>;
  /** The range's progress in [0, 1], for things that are not tweens (the 3D scene in 03). 1 under
      reduced motion, where everything is at its final state. */
  progress: RefObject<number>;
  /** The active media condition, null until the first setup has run. */
  condition: StageCondition | null;
}

/** Gives a StickyStage's content a scrubbed timeline. `build` runs once per media condition
    (desktop ≥ 761 px, mobile, reduced) and may return a cleanup; what it creates is reverted when
    the condition changes and on unmount. On mobile flow and under reduced motion it gets no
    timeline: featured work then builds per-element reveals, and the reduced branch leaves
    everything at rest. The latest `build` is used, so it may close over props. */
export function useStageTimeline<T extends Element = HTMLDivElement>(
  build: (stage: StageBuild) => (() => void) | undefined,
  { start = STAGE.start, end = STAGE.end, onUpdate }: StageTimelineOptions = {},
): StageTimeline<T> {
  const ref = useRef<T>(null);
  const progress = useRef(0);
  const [condition, setCondition] = useState<StageCondition | null>(null);
  const latest = useRef({ build, onUpdate });

  useEffect(() => {
    latest.current = { build, onUpdate };
  });

  useMotion(
    ref,
    (mm) => {
      const section = ref.current?.closest<HTMLElement>("[data-stage]");
      const stage = section?.querySelector<HTMLElement>(":scope > [data-stage-pin]");
      if (!section || !stage) return;
      const flowOnMobile = section.dataset.stageMobile === "flow";

      mm.add(
        {
          desktop: `${MEDIA.motion} and ${MEDIA.desktop}`,
          mobile: `${MEDIA.motion} and ${MEDIA.mobile}`,
          reduced: MEDIA.reduce,
        },
        (context) => {
          const now = stageCondition(context.conditions ?? {});
          setCondition(now);
          const scrubbed = now === "desktop" || (now === "mobile" && !flowOnMobile);
          progress.current = now === "reduced" ? 1 : 0;
          const timeline = scrubbed
            ? gsap.timeline({
                scrollTrigger: {
                  trigger: section,
                  start,
                  end,
                  scrub: SCRUB,
                  onUpdate: (self) => {
                    progress.current = self.progress;
                    latest.current.onUpdate?.(self.progress);
                  },
                },
              })
            : null;
          return latest.current.build({ timeline, condition: now, section, stage });
        },
      );
    },
    [start, end],
  );

  return { ref, progress, condition };
}
