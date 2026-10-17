/* "Abdelhadev", outlined from Bricolage Grotesque Bold, inline so GSAP can animate each letter
   (the loader builds it letter by letter). Fill is currentColor; each path carries its index in
   `data-letter`. Path data is generated from brand/wordmark-animated.svg. */
import { WORDMARK_PATHS, WORDMARK_VIEWBOX } from "@/components/brand/wordmark-paths";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface WordmarkProps {
  /** Hide from assistive technology when the name is already given nearby. */
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
