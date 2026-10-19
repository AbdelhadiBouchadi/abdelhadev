import { useId } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedMarkProps {
  className?: string;
}

export function AnimatedMark({ className }: AnimatedMarkProps) {
  const clip = useId();
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("overflow-visible", className)}>
      <defs>
        <clipPath id={clip}>
          <rect x="0" y="0" width="64" height="35" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <circle
          data-sun-disc
          cx="32"
          cy="35"
          r="19"
          transform="translate(0 19)"
          className="fill-glow"
        />
      </g>
      <rect data-horizon x="6" y="38.5" width="52" height="5" rx="2.5" className="fill-majorelle" />
      <rect
        data-reflection
        x="18"
        y="47.5"
        width="28"
        height="4.5"
        rx="2.25"
        opacity="0.7"
        className="fill-majorelle-soft"
      />
    </svg>
  );
}
