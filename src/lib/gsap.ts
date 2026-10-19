/* The only module that imports GSAP (ESLint enforces it). SplitText and DrawSVGPlugin are needed
   by a few leaves only, so they load on demand (docs/spikes/tbt.md): each loader registers its
   plugin once and returns the same promise after that. */
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import type { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { DURATION, EASE, WARM_CURVE } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);
  CustomEase.create(EASE.warm, WARM_CURVE.join(", "));
  gsap.defaults({ ease: EASE.warm, duration: DURATION.base });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

let splitText: Promise<typeof SplitText> | null = null;
let drawSVG: Promise<typeof DrawSVGPlugin> | null = null;

export function loadSplitText(): Promise<typeof SplitText> {
  splitText ??= import("gsap/SplitText").then(({ SplitText: plugin }) => {
    gsap.registerPlugin(plugin);
    return plugin;
  });
  return splitText;
}

export function loadDrawSVG(): Promise<typeof DrawSVGPlugin> {
  drawSVG ??= import("gsap/DrawSVGPlugin").then(({ DrawSVGPlugin: plugin }) => {
    gsap.registerPlugin(plugin);
    return plugin;
  });
  return drawSVG;
}

export { gsap, CustomEase, ScrollTrigger, useGSAP };
