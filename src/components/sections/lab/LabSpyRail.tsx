"use client";

/* The useScrollSpy bench (removed in 03 with the lab): a sticky rail in the manner of the work
   rail (prototype .rail), whose active item follows the block crossing 45 % of the viewport. The
   links scroll to their block through the transition link (same page: Lenis, no curtain). */
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { SPY } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/primitives/TransitionLink";

export interface LabSpyRailProps {
  label: string;
  items: readonly { id: string; label: string }[];
}

const item = cn(
  "inline-flex min-h-11 items-center gap-2.5 rounded-pill px-3 text-[15px] no-underline",
  "transition-colors duration-(--dur-hover) ease-warm",
  "before:size-[7px] before:flex-none before:rounded-pill before:bg-current before:opacity-45 before:content-['']",
  "data-active:bg-[color-mix(in_srgb,var(--ink)_7%,transparent)] data-active:before:bg-majorelle data-active:before:opacity-100",
);

export function LabSpyRail({ label, items }: LabSpyRailProps) {
  const { activeId } = useScrollSpy(
    items.map(({ id }) => id),
    { line: SPY.list },
  );
  return (
    <nav
      aria-label={label}
      data-spy-active={activeId ?? ""}
      className="sticky top-[calc(var(--header-h)+16px)] z-10 self-start rounded-card bg-paper/90 py-1"
    >
      <ul className="m-0 flex list-none flex-wrap gap-0.5 p-0 split:grid">
        {items.map(({ id, label: name }) => (
          <li key={id}>
            <TransitionLink
              href="/lab"
              hash={id}
              className={item}
              data-active={id === activeId ? "" : undefined}
              aria-current={id === activeId ? "true" : undefined}
            >
              {name}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
