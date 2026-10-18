/* The architecture diagram of the case study (prototype .diagram, viewBox 720 × 420): six nodes
   and six wires at the prototype's coordinates. Nodes are data-node groups (data-hot for the app
   and the database, glow-tinted), wires are single-segment data-wire paths (data-soft for the two
   dashed Majorelle links), as LineDraw expects: nodes arrive in document order, wires draw in
   document order. Colours come from tokens in src/styles/case.css. Technology names are proper
   nouns and stay as they are; the browser's name and every subtitle come from messages. The
   whole diagram is one image named by `label`. */

export type ArchNodeKey = "browser" | "app" | "api" | "orm" | "database" | "auth";

export interface ArchNode {
  name: string;
  sub: string;
}

export interface ArchDiagramProps {
  /** Describes the whole flow for assistive technology. */
  label: string;
  nodes: Readonly<Record<ArchNodeKey, ArchNode>>;
}

const NODES: readonly {
  key: ArchNodeKey;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Baselines of the name and the subtitle. */
  name: number;
  sub: number;
  hot?: boolean;
}[] = [
  { key: "browser", x: 20, y: 40, w: 130, h: 80, name: 76, sub: 98 },
  { key: "app", x: 285, y: 40, w: 150, h: 80, name: 76, sub: 98, hot: true },
  { key: "api", x: 570, y: 40, w: 130, h: 80, name: 76, sub: 98 },
  { key: "orm", x: 285, y: 180, w: 150, h: 100, name: 220, sub: 242 },
  { key: "database", x: 20, y: 190, w: 130, h: 80, name: 226, sub: 248, hot: true },
  { key: "auth", x: 285, y: 330, w: 150, h: 70, name: 362, sub: 382 },
];

/** Browser → app → API, API down to the ORM, ORM → database; app ↔ ORM and ORM ↔ auth dashed. */
const WIRES: readonly { d: string; soft?: boolean }[] = [
  { d: "M150 80 H285" },
  { d: "M435 80 H570" },
  { d: "M645 120 V210 Q645 230 625 230 H435" },
  { d: "M285 230 H150" },
  { d: "M360 120 V180", soft: true },
  { d: "M360 280 V330", soft: true },
];

/** The text inset from a node's left edge. */
const PAD = 20;

export function ArchDiagram({ label, nodes }: ArchDiagramProps) {
  return (
    <svg className="diagram" viewBox="0 0 720 420" role="img" aria-label={label}>
      {WIRES.map(({ d, soft }) => (
        <path key={d} d={d} data-wire="" data-soft={soft ? "" : undefined} />
      ))}
      {NODES.map(({ key, x, y, w, h, name, sub, hot }) => (
        <g key={key} data-node={key} data-hot={hot ? "" : undefined}>
          <rect x={x} y={y} width={w} height={h} rx={18} />
          <text x={x + PAD} y={name}>
            {nodes[key].name}
          </text>
          <text x={x + PAD} y={sub} data-sub="">
            {nodes[key].sub}
          </text>
        </g>
      ))}
    </svg>
  );
}
