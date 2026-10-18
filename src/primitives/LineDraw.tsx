/* DrawSVG for diagrams (Pages.case architecture): inside it, the elements marked data-node arrive
   in document order and the paths marked data-wire draw, scrubbed over the range. The diagram
   itself (inline <svg>) lives in a section's diagrams/ folder. The start state is CSS under
   html.motion (src/styles/primitives.css); without JavaScript, or under reduced motion, the
   diagram is fully drawn. */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LineDrawMotion, type LineDrawMotionProps } from "@/primitives/LineDrawMotion";

export interface LineDrawProps extends ComponentPropsWithoutRef<"div">, LineDrawMotionProps {
  children: ReactNode;
}

export function LineDraw({ trigger, start, end, children, ...props }: LineDrawProps) {
  return (
    <>
      <div {...props} data-line-draw="">
        {children}
      </div>
      <LineDrawMotion trigger={trigger} start={start} end={end} />
    </>
  );
}
