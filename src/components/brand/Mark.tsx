/* Decorative by default; pass `title` when the mark is the only content of a link or image. */
import { cn } from "@/lib/utils";

export interface MarkProps {
  title?: string;
  tone?: "day" | "night";
  className?: string;
}

export function Mark({ title, tone = "day", className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-7 flex-none", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M13 35a19 19 0 0 1 38 0z" className="fill-glow" />
      <g className={tone === "night" ? "fill-majorelle-soft" : "fill-majorelle"}>
        <rect x="6" y="38.5" width="52" height="5" rx="2.5" />
        <rect x="18" y="47.5" width="28" height="4.5" rx="2.25" opacity="0.55" />
      </g>
    </svg>
  );
}
