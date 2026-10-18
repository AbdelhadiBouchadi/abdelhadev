/* A small four-node diagram for the LineDraw bench (removed in 03 with the lab). Nodes are
   data-node groups, wires are single-segment data-wire paths, as LineDraw expects. Colours come
   from tokens through Tailwind utilities and follow the section tone. */

export interface LabDiagramProps {
  /** Accessible description of the whole diagram. */
  label: string;
  /** Four node labels in reading order: top left, top right, bottom right, bottom left. */
  nodes: readonly string[];
}

const NODE = { w: 150, h: 60, r: 14 } as const;
const POSITIONS = [
  { x: 10, y: 20 },
  { x: 240, y: 20 },
  { x: 240, y: 180 },
  { x: 10, y: 180 },
] as const;

/** Top row left to right, right column down, bottom row right to left. */
const WIRES = [
  "M160 50 C 190 50, 210 50, 240 50",
  "M315 80 C 315 120, 315 140, 315 180",
  "M240 210 C 210 210, 190 210, 160 210",
];

export function LabDiagram({ label, nodes }: LabDiagramProps) {
  return (
    <svg
      viewBox="0 0 400 260"
      role="img"
      aria-label={label}
      className="block h-auto w-full max-w-[640px]"
    >
      {WIRES.map((d) => (
        <path
          key={d}
          d={d}
          data-wire=""
          className="fill-none stroke-majorelle night:stroke-glow"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {POSITIONS.map(({ x, y }, i) => (
        <g key={`${String(x)}-${String(y)}`} data-node="">
          <rect
            x={x}
            y={y}
            width={NODE.w}
            height={NODE.h}
            rx={NODE.r}
            className="fill-sheet stroke-line night:fill-night-2 night:stroke-line-night"
            strokeWidth={1.5}
          />
          <text
            x={x + NODE.w / 2}
            y={y + NODE.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-ink font-text text-[15px] font-semibold night:fill-moon"
          >
            {nodes[i] ?? ""}
          </text>
        </g>
      ))}
    </svg>
  );
}
