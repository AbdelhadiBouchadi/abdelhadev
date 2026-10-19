/* Only headings: SplitText's default `aria: "auto"` puts an aria-label on the split element, and
   ARIA prohibits aria-label on paragraphs and generic elements (axe aria-prohibited-attr). */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { SplitRevealMotion, type SplitRevealMotionProps } from "@/primitives/SplitRevealMotion";

export type SplitRevealTag = "h1" | "h2" | "h3" | "h4";

export interface SplitRevealProps
  extends Omit<ComponentPropsWithoutRef<"h2">, "children">, SplitRevealMotionProps {
  as?: SplitRevealTag;
  children: ReactNode;
}

export function SplitReveal({
  as: Tag = "h2",
  type,
  when,
  delay,
  start,
  end,
  trigger,
  pace,
  children,
  ...props
}: SplitRevealProps) {
  return (
    <>
      <Tag {...props} data-split-reveal={type}>
        {children}
      </Tag>
      <SplitRevealMotion
        type={type}
        when={when}
        delay={delay}
        start={start}
        end={end}
        trigger={trigger}
        pace={pace}
      />
    </>
  );
}
