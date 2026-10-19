"use client";

/* Real #slug anchors; with JavaScript they scroll through Lenis, without the curtain. */
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { SPY } from "@/lib/motion";
import { TransitionLink } from "@/primitives/TransitionLink";

export interface RailLinksProps {
  items: readonly { id: string; label: string }[];
}

export function RailLinks({ items }: RailLinksProps) {
  const { activeId } = useScrollSpy(
    items.map(({ id }) => id),
    { line: SPY.list },
  );
  return (
    <ul className="rail-list" data-spy-active={activeId ?? ""}>
      {items.map(({ id, label }) => (
        <li key={id}>
          <TransitionLink
            href="/work"
            hash={id}
            className="rail-link"
            aria-current={id === activeId ? "true" : undefined}
          >
            <span className="rail-name">{label}</span>
          </TransitionLink>
        </li>
      ))}
    </ul>
  );
}
