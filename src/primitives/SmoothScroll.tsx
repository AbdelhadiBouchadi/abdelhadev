"use client";

/* history.scrollRestoration is "manual": the curtain decides where an arriving page starts.
   scrollTo falls back to native scrolling when Lenis is not running. */
import type Lenis from "lenis";
import { createContext, use, useMemo, useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { createLenis } from "@/lib/lenis";
import { MEDIA, SCROLL_TO } from "@/lib/motion";
import { shellBusy } from "@/lib/shell";

export type ScrollTarget = number | HTMLElement;

export interface SmoothScrollApi {
  scrollTo: (target: ScrollTarget, options?: { immediate?: boolean }) => void;
}

/** Less scroll-margin-top, as the browser's own fragment navigation does (the work sheets clear
    the header that way). */
function destinationOf(target: ScrollTarget): number {
  if (typeof target === "number") return target;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  return target.getBoundingClientRect().top + window.scrollY - margin;
}

function nativeScrollTo(target: ScrollTarget, immediate: boolean) {
  const top = destinationOf(target);
  const reduce = matchMedia(MEDIA.reduce).matches;
  window.scrollTo({ top, behavior: immediate || reduce ? "instant" : "smooth" });
}

const SmoothScrollContext = createContext<SmoothScrollApi>({
  scrollTo: (target, options) => {
    nativeScrollTo(target, options?.immediate ?? false);
  },
});

export function useSmoothScroll(): SmoothScrollApi {
  return use(SmoothScrollContext);
}

export interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const stopFollowing = useRef<(() => void) | null>(null);

  useGSAP(() => {
    history.scrollRestoration = "manual";
    const mm = gsap.matchMedia();
    mm.add(MEDIA.motion, () => {
      const smooth = createLenis();
      lenisRef.current = smooth.lenis;
      const follow = (busy: boolean) => {
        if (busy) smooth.lenis.stop();
        else smooth.lenis.start();
      };
      follow(shellBusy.get());
      const off = shellBusy.subscribe(follow);
      return () => {
        off();
        stopFollowing.current?.();
        lenisRef.current = null;
        smooth.destroy();
      };
    });
    return () => {
      mm.revert();
    };
  });

  const api = useMemo<SmoothScrollApi>(
    () => ({
      scrollTo: (target, options) => {
        const immediate = options?.immediate ?? false;
        const lenis = lenisRef.current;
        stopFollowing.current?.();
        if (!lenis || immediate) {
          // Immediate jumps (an arrival under the curtain, while Lenis is stopped) go through the
          // window, then Lenis takes the new position as its own.
          nativeScrollTo(target, true);
          lenis?.scrollTo(scrollY, { immediate: true, force: true });
          return;
        }
        // Lenis measures an element from its own last-known scroll (`animatedScroll`) and animates
        // from it. A native scroll it has not heard of yet (scroll events arrive on the next frame,
        // so a click can come first) would offset both the start and the destination by that
        // distance. Sync Lenis to the window, then take the destination from the page itself.
        lenis.resize();
        const destination = () => destinationOf(target);
        const userData = {};
        const started = performance.now();
        let aim = destination();
        const go = (duration: number) => {
          lenis.scrollTo(aim, {
            force: true,
            duration,
            easing: SCROLL_TO.easing,
            userData,
            onComplete: () => stopFollowing.current?.(),
          });
        };
        if (typeof target !== "number") {
          // Layout above the element can change during the scroll (an image, a late re-split):
          // re-aim at its live position for the time that is left. Lenis replaces `userData` when
          // the visitor scrolls, and following stops there.
          const observer = new ResizeObserver(() => {
            const elapsed = (performance.now() - started) / 1000;
            if (lenis.userData !== userData || elapsed >= SCROLL_TO.duration) {
              stopFollowing.current?.();
              return;
            }
            const next = destination();
            if (Math.abs(next - aim) < 1) return;
            aim = next;
            go(Math.max(SCROLL_TO.duration - elapsed, SCROLL_TO.minFollow));
          });
          observer.observe(document.body);
          stopFollowing.current = () => {
            observer.disconnect();
            stopFollowing.current = null;
          };
        }
        go(SCROLL_TO.duration);
      },
    }),
    [],
  );

  return <SmoothScrollContext value={api}>{children}</SmoothScrollContext>;
}
