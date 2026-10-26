/* Decoration: hidden from assistive technology, never a pointer target. The server draws a rough
   route so the line is there without JavaScript; ThreadMotion measures the real one. */
import { FALLBACK_BOX, FALLBACK_PATH } from "@/lib/thread";

const GRADIENT = "thread-gradient";

export function ThreadLine() {
  return (
    <svg
      className="thread"
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${String(FALLBACK_BOX)} ${String(FALLBACK_BOX)}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={GRADIENT}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={FALLBACK_BOX}
        >
          <stop offset="0" className="thread-stop-glow" />
          <stop offset="0.5" className="thread-stop-majorelle" />
          <stop offset="1" className="thread-stop-rose" />
        </linearGradient>
      </defs>
      <path className="thread-ghost" d={FALLBACK_PATH} vectorEffect="non-scaling-stroke" />
      <path
        className="thread-path"
        d={FALLBACK_PATH}
        stroke={`url(#${GRADIENT})`}
        vectorEffect="non-scaling-stroke"
      />
      <g className="thread-sun">
        <circle r="16" className="thread-sun-halo" />
        <circle r="8" className="thread-sun-disc" />
        <circle r="8" className="thread-sun-ring" />
      </g>
    </svg>
  );
}
