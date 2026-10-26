"use client";

/* Lights each window once, when it comes into view; windows that arrive together light one after
   another. Plays once and reads no scroll position, so it behaves the same on touch. */
import { useEffect, useRef } from "react";
import { motionAllowed } from "@/lib/css";
import { WINDOW } from "@/lib/motion";

const LIT = "is-lit";

export function TestimonialsMotion() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const panes =
      ref.current?.previousElementSibling?.querySelectorAll<HTMLElement>("[data-testimonial]");
    if (!panes || panes.length === 0) return undefined;
    if (!motionAllowed() || !("IntersectionObserver" in window)) {
      for (const pane of panes) pane.classList.add(LIT);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        let order = 0;
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting || !(target instanceof HTMLElement)) continue;
          target.style.setProperty("--d", `${String(order * WINDOW.stagger)}s`);
          target.classList.add(LIT);
          observer.unobserve(target);
          order++;
        }
      },
      { threshold: WINDOW.threshold },
    );
    for (const pane of panes) observer.observe(pane);
    return () => observer.disconnect();
  }, []);

  return <span ref={ref} hidden data-motion-leaf="" />;
}
