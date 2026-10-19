/* The start state is CSS under html.motion (src/styles/primitives.css). Without JavaScript or
   under reduced motion the media is fully open. */
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
