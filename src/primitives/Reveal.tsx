/* The hidden start state is CSS under html.motion (src/styles/primitives.css), so it is in place
   at first paint. Without JavaScript or under reduced motion nothing is hidden. */
import type { HTMLAttributes, ReactNode } from "react";
import { REVEAL } from "@/lib/motion";
import type { CSSVars } from "@/lib/utils";
import { RevealMotion, type RevealMotionProps } from "@/primitives/RevealMotion";

export interface RevealProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "style">, Omit<RevealMotionProps, "y"> {
  as?: "div" | "ul" | "ol" | "dl" | "p" | "section" | "header";
  targets?: "children" | "self";
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
