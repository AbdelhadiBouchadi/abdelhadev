/* Fade-and-rise for a group (prototype fadeUpOnEnter, and the "later" groups of the page intros):
   the children (or the element itself) rise from `y` px and fade in, staggered, once.
   - `ready`: when the loader signals ready, after `delay`.
   - `enter`: when the group reaches `start` (default REVEAL.enterStart).
   The hidden start state is CSS under html.motion (src/styles/primitives.css), so it is in place
   at first paint; without JavaScript, or under reduced motion, nothing is hidden. */
import type { HTMLAttributes, ReactNode } from "react";
import { REVEAL } from "@/lib/motion";
import type { CSSVars } from "@/lib/utils";
import { RevealMotion, type RevealMotionProps } from "@/primitives/RevealMotion";

export interface RevealProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "style">, Omit<RevealMotionProps, "y"> {
  as?: "div" | "ul" | "ol" | "dl" | "p" | "section" | "header";
  /** "children" animates each child element (the default); "self" animates the element. */
  targets?: "children" | "self";
  /** Px the targets rise from. Default REVEAL.fadeY (28). */
  y?: number;
  children: ReactNode;
}

export function Reveal({
  as: Tag = "div",
  targets = "children",
  when,
  y = REVEAL.fadeY,
  duration,
  stagger,
  delay,
  start,
  children,
  ...props
}: RevealProps) {
  const style: CSSVars = { "--reveal-y": `${String(y)}px` };
  return (
    <>
      <Tag {...props} data-reveal={targets} style={style}>
        {children}
      </Tag>
      <RevealMotion
        when={when}
        y={y}
        duration={duration}
        stagger={stagger}
        delay={delay}
        start={start}
      />
    </>
  );
}
