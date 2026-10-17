/* Scrubs one element between two sets of plain values over a scroll range (the home hero word
   settling and its meta fading, the about arcs expanding, the home 3D layer dimming, the footer
   wordmark rising). The wrapper is the element that moves, so its children keep their own
   transforms. Only transform and opacity values: anything with several coordinated elements is a
   section's own timeline (useStageTimeline), not a Scrub. Under reduced motion, and without
   JavaScript, the element stays at its CSS state. */
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
