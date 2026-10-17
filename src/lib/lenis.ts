/* Lenis driven by gsap.ticker, as in the prototype: one clock for scroll and animation.
   Mounted by SmoothScroll in 01; nothing creates it yet. */
import Lenis, { type LenisOptions } from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { LENIS } from "@/lib/motion";

export interface SmoothScroll {
  lenis: Lenis;
  /** Removes the ticker hook and destroys the instance. Safe to call twice (StrictMode). */
  destroy: () => void;
}

export function createLenis(options: Omit<LenisOptions, "autoRaf"> = {}): SmoothScroll {
  const lenis = new Lenis({ lerp: LENIS.lerp, ...options, autoRaf: false });
  const onTick = (time: number) => {
    lenis.raf(time * 1000);
  };

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(onTick);
  gsap.ticker.lagSmoothing(0);

  let destroyed = false;
  return {
    lenis,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      gsap.ticker.remove(onTick);
      lenis.destroy();
    },
  };
}
