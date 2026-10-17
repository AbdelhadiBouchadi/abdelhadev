"use client";

/* Lenis on gsap.ticker (lib/lenis.ts), as in the prototype's Lenis block:
   - created only when motion is allowed (gsap.matchMedia reverts it if the preference changes);
   - stopped while the loader or a curtain is on screen (lib/shell.ts `shellBusy`), started after;
   - `history.scrollRestoration = "manual"`: the curtain decides where an arriving page starts.
   `useSmoothScroll().scrollTo` goes through Lenis with the prototype's 1.6 s ease-out-quart, and
   falls back to native scrolling when Lenis is not running. */
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

function nativeScrollTo(target: ScrollTarget, immediate: boolean) {
  const top = typeof target === "number" ? target : target.getBoundingClientRect().top + scrollY;
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
        if (!lenis || immediate) {
          // Immediate jumps (an arrival under the curtain, while Lenis is stopped) go through the
          // window, then Lenis takes the new position as its own.
          nativeScrollTo(target, true);
          lenis?.scrollTo(scrollY, { immediate: true, force: true });
          return;
        }
        lenis.scrollTo(target, {
          force: true,
          duration: SCROLL_TO.duration,
          easing: SCROLL_TO.easing,
        });
      },
    }),
    [],
  );

  return <SmoothScrollContext value={api}>{children}</SmoothScrollContext>;
}
