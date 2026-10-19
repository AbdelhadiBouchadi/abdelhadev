"use client";

/* Refitted whenever the word stops matching its column: a resize, or the web font swapping in,
   which can happen after document.fonts.ready has resolved. A fitted word matches, so the observer
   never loops. */
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

export interface FitTextProps extends Omit<ComponentPropsWithoutRef<"span">, "style"> {
  children: ReactNode;
}

/** Sub-pixel rounding tolerance. */
const TOLERANCE_PX = 1;

function available(column: HTMLElement): number {
  const cs = getComputedStyle(column);
  return column.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd);
}

/** One line scales linearly with its font size (letter spacing is in em), so every value is read
    before the one write and fitting forces no extra layout (docs/spikes/tbt.md). */
function fit(el: HTMLElement, room: number, width: number) {
  const size = parseFloat(getComputedStyle(el).fontSize);
  if (width > 0 && size > 0) el.style.fontSize = `${((size * room) / width).toFixed(2)}px`;
}

export function FitText({ children, className, ...props }: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    const column = el?.closest<HTMLElement>(".wrap") ?? el?.parentElement;
    if (!el || !column) return;
    let alive = true;
    const refit = () => {
      if (!alive) return;
      const width = el.offsetWidth;
      const room = available(column);
      if (Math.abs(width - room) > TOLERANCE_PX) fit(el, room, width);
    };
    refit();
    void document.fonts.ready.then(refit);
    const observer = new ResizeObserver(refit);
    observer.observe(column);
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);

  return (
    // transition-none: under reduced motion the global rule in globals.css that shortens every
    // transition (transition-property's initial value is `all`) would transition font-size too,
    // and measuring mid-way makes the observer oscillate.
    <span
      ref={ref}
      className={cn("inline-block whitespace-nowrap transition-none", className)}
      {...props}
    >
      {children}
    </span>
  );
}
