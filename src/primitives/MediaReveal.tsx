/* The clip-path media reveal (prototype revealMedia and the case study hero shot). The frame opens
   from an inset shape with round corners while the screen inside (the element marked
   data-media-inner, which Screen renders) settles from a slight zoom.
   - `scrub`: inset(18% 6% 0 6% round --r-media) → inset(0), inner 1.16 → 1, scrubbed from
     "top 95%" to "top 45%".
   - `intro`: inset(30% 8% 0 8% round --r-shot) → inset(0), inner 1.2 → 1, 1.6 s and 1.8 s, 0.5 s
     after the ready signal.
   The start state is CSS under html.motion (src/styles/primitives.css); without JavaScript, or
   under reduced motion, the media is fully open. */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { MediaRevealMotion } from "@/primitives/MediaRevealMotion";

export interface MediaRevealProps extends ComponentPropsWithoutRef<"div"> {
  variant: "scrub" | "intro";
  as?: "div" | "figure";
  children: ReactNode;
}

export function MediaReveal({ variant, as: Tag = "div", children, ...props }: MediaRevealProps) {
  return (
    <>
      <Tag {...props} data-media-reveal={variant}>
        {children}
      </Tag>
      <MediaRevealMotion variant={variant} />
    </>
  );
}
