/* The height and the sticky stage are CSS under html.motion (src/styles/primitives.css), so
   without JavaScript or under reduced motion the section is in normal flow. */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { SectionTone } from "@/lib/tone";
import type { CSSVars } from "@/lib/utils";
import { ToneSection } from "@/primitives/ToneSection";

/** Viewport units, or "auto": content height and no sticky stage. */
export type StageHeight = `${number}vh` | `${number}svh` | "auto";

export interface StickyStageProps extends Omit<ComponentPropsWithoutRef<"section">, "style"> {
  height: StageHeight;
  /** Under 761 px. Defaults to `height`. */
  mobileHeight?: StageHeight;
  tone?: SectionTone;
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
