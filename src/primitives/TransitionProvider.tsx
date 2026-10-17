"use client";

/* The route curtain (decision T8, design from docs/spikes/route-curtain.md). A small state machine:
   idle → leaving (the panel rises, the sun sets) → covered (router.push) → arriving (the short
   loader runs on the new page, then the panel lifts) → idle.

   - The overlay itself is the Loader (components/layout/Loader.tsx), reached through the port in
     lib/shell.ts: one panel for the first visit, the curtain and the arrival, as in the prototype.
   - Arrival is a layout effect keyed on the pathname value (spike finding 3: idempotent under
     StrictMode). Back and Forward arrive without `leave`, so the effect covers the page before the
     browser paints it (finding 4).
   - After arrival: scroll to the top or the hash, ScrollTrigger.refresh() (the old page's triggers
     were already reverted by their own useGSAP scopes on unmount), focus on the new h1.
   - Clicks while a curtain is up are ignored. */
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useMemo, useRef, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { getPathname } from "@/i18n/navigation";
import { ScrollTrigger } from "@/lib/gsap";
import { isSamePath } from "@/lib/links";
import { LOADER, MEDIA, SHELL } from "@/lib/motion";
import { getOverlay, resetReady, routeKind, shellBusy, shellRegistry } from "@/lib/shell";
import { applyShellTone, toneAt } from "@/lib/tone";
import { useSmoothScroll } from "@/primitives/SmoothScroll";

/** An internal, typed href (the same type next-intl's router takes). */
export type TransitionHref = Parameters<typeof getPathname>[0]["href"];

export interface RouteTransitionApi {
  /** Covers the page, then navigates. `hash` is kept apart because router.push cannot carry one. */
  navigate: (href: TransitionHref, hash?: string) => void;
}

const RouteTransitionContext = createContext<RouteTransitionApi | null>(null);

/** Null outside the provider: links then navigate normally. */
export function useRouteTransition(): RouteTransitionApi | null {
  return use(RouteTransitionContext);
}

type Phase = "idle" | "leaving" | "covered" | "arriving";

function findHashTarget(hash: string): HTMLElement | null {
  if (!hash) return null;
  try {
    return document.getElementById(decodeURIComponent(hash));
  } catch {
    return null;
  }
}

export interface TransitionProviderProps {
  children: ReactNode;
}

export function TransitionProvider({ children }: TransitionProviderProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { scrollTo } = useSmoothScroll();

  const phase = useRef<Phase>("idle");
  const pendingHash = useRef("");
  const previousPath = useRef<string | null>(null);

  const api = useMemo<RouteTransitionApi>(
    () => ({
      navigate(href, hash = "") {
        if (phase.current !== "idle") return;
        const path = getPathname({ locale, href });
        const url = hash ? `${path}#${hash}` : path;

        // The current page: scroll there through Lenis, no curtain (prototype behaviour).
        if (isSamePath(path, location.pathname)) {
          const target = findHashTarget(hash);
          if (target) history.pushState(history.state, "", `#${hash}`);
          scrollTo(target ?? 0);
          return;
        }

        const overlay = getOverlay();
        if (!overlay) {
          router.push(url);
          return;
        }
        phase.current = "leaving";
        pendingHash.current = hash;
        shellBusy.set(true);
        void overlay.cover().then(() => {
          phase.current = "covered";
          // Only now, with the old page hidden, so its intro elements do not vanish in view.
          resetReady();
          // scroll: false, or Next scrolls the old page before the new one renders (finding 7).
          router.push(url, { scroll: false });
        });
      },
    }),
    [locale, router, scrollTo],
  );

  useIsomorphicLayoutEffect(() => {
    const previous = previousPath.current;
    previousPath.current = pathname;
    if (previous === null || previous === pathname) return;

    const overlay = getOverlay();
    if (!overlay) {
      phase.current = "idle";
      return;
    }
    if (phase.current !== "covered") {
      // Back, Forward, or a navigation that did not come through a TransitionLink.
      overlay.coverNow();
      shellBusy.set(true);
      resetReady();
      pendingHash.current = location.hash.slice(1);
    }
    phase.current = "arriving";

    const registry = shellRegistry();
    registry.reset(routeKind(matchMedia(MEDIA.reduce).matches));
    registry.track(LOADER.weights.fonts, document.fonts.ready);
    for (const img of document.querySelectorAll<HTMLImageElement>("main img[data-critical]")) {
      registry.track(LOADER.weights.image, img.decode());
    }

    const hash = pendingHash.current;
    pendingHash.current = "";
    void overlay
      .run({
        beforeExit: () => {
          scrollTo(findHashTarget(hash) ?? 0, { immediate: true });
          ScrollTrigger.refresh();
          // The new page's tone, read from the layout: its triggers were created while the old
          // scroll position was still in place.
          applyShellTone(document, toneAt(document, SHELL.toneLine));
        },
        afterExit: () => {
          document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
        },
      })
      .finally(() => {
        phase.current = "idle";
      });
  }, [pathname]);

  return <RouteTransitionContext value={api}>{children}</RouteTransitionContext>;
}
