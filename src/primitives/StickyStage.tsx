/* A tall section with a sticky full-viewport stage (the home manifesto, dusk and featured work, the
   about chapters, the case study tour). Server markup only: the height and the sticky stage are
   CSS under html.motion (src/styles/primitives.css), so without JavaScript, or under reduced
   motion, the section is in normal flow at its content height with nothing sticky. A section's
   client leaf animates the stage with useStageTimeline. */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { SectionTone } from "@/lib/tone";
import type { CSSVars } from "@/lib/utils";
import { ToneSection } from "@/primitives/ToneSection";

/** A section height: viewport units, or "auto" (content height, no sticky stage). */
export type StageHeight = `${number}vh` | `${number}svh` | "auto";

export interface StickyStageProps extends Omit<ComponentPropsWithoutRef<"section">, "style"> {
  /** Section height while motion runs, e.g. "240vh" (manifesto), "190vh" (dusk). */
  height: StageHeight;
  /** Under 761 px. "auto" puts the section in normal flow there (featured work on mobile); the
      default is `height`. */
  mobileHeight?: StageHeight;
  /** Declares the section's tone for the shell (ToneSection). */
  tone?: SectionTone;
  /** Classes of the sticky stage (layout inside the viewport-tall frame). */
  stageClassName?: string;
  children: ReactNode;
}

export function StickyStage({
  height,
  mobileHeight,
  tone,
  stageClassName,
  children,
  ...props
}: StickyStageProps) {
  const style: CSSVars = { "--stage-h": height, "--stage-h-mobile": mobileHeight ?? height };
  const stageProps = {
    ...props,
    style,
    "data-stage": "",
    "data-stage-mobile": mobileHeight === "auto" ? "flow" : "stage",
  };
  const stage = (
    <div data-stage-pin="" className={stageClassName}>
      {children}
    </div>
  );
  return tone ? (
    <ToneSection tone={tone} {...stageProps}>
      {stage}
    </ToneSection>
  ) : (
    <section {...stageProps}>{stage}</section>
  );
}
