"use client";

/* The prototype's `fit()`: sets the font size so a one-line word fills its column (the content box
   of the nearest `.wrap`). Measured at 100 px with the final width axis, then scaled. Refitted
   whenever the word stops matching its column: a resize, or the web font swapping in (which can
   happen after document.fonts.ready has already resolved). A fitted word matches, so the observer
   never loops. The text is rendered on the server (children) and keeps the CSS clamp size until
   the first fit, and without JavaScript. */
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

export interface FitTextProps extends Omit<ComponentPropsWithoutRef<"span">, "style"> {
  /** One word or line, rendered on the server. */
  children: ReactNode;
}

const PROBE_PX = 100;

/** Sub-pixel rounding tolerance between a fitted word and its column. */
const TOLERANCE_PX = 1;

function available(column: HTMLElement): number {
  const cs = getComputedStyle(column);
  return column.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd);
}

function fit(el: HTMLElement, column: HTMLElement) {
  const room = available(column);
  el.style.fontSize = `${String(PROBE_PX)}px`;
  const width = el.offsetWidth;
  if (width > 0) el.style.fontSize = `${((PROBE_PX * room) / width).toFixed(2)}px`;
}

export function FitText({ children, className, ...props }: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    const column = el?.closest<HTMLElement>(".wrap") ?? el?.parentElement;
    if (!el || !column) return;
    let alive = true;
    const refit = () => {
      if (alive && Math.abs(el.offsetWidth - available(column)) > TOLERANCE_PX) fit(el, column);
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
