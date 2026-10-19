/* The wrapper is the element that moves, so its children keep their own transforms. Several
   coordinated elements belong in a section's own timeline (useStageTimeline), not a Scrub. */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ScrubMotion, type ScrubMotionProps } from "@/primitives/ScrubMotion";

export type { ScrubVars } from "@/primitives/ScrubMotion";

export interface ScrubProps extends ComponentPropsWithoutRef<"div">, ScrubMotionProps {
  as?: "div" | "span" | "p";
  children: ReactNode;
}

export function Scrub({
  as: Tag = "div",
  from,
  to,
  trigger,
  start,
  end,
  children,
  ...props
}: ScrubProps) {
  return (
    <>
      <Tag {...props} data-scrub="">
        {children}
      </Tag>
      <ScrubMotion from={from} to={to} trigger={trigger} start={start} end={end} />
    </>
  );
}
