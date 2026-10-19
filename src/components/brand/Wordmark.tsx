/* Inline so GSAP can animate each letter. The path data comes from brand/wordmark-animated.svg
   (pnpm brand:paths). */
import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from "@/components/brand/wordmark-paths";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface WordmarkProps {
  decorative?: boolean;
  className?: string;
}

export function Wordmark({ decorative = false, className }: WordmarkProps) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      className={cn("block h-auto w-full overflow-visible fill-current", className)}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : SITE.brand}
      aria-hidden={decorative ? true : undefined}
    >
      {WORDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} data-letter={i} />
      ))}
    </svg>
  );
}
