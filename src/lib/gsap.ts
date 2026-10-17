/* The only module that imports GSAP packages (ESLint enforces it). Plugins are registered once,
   in the browser only; everything else imports them from here.

   The core, ScrollTrigger and CustomEase are needed on every page and load with it. SplitText and
   DrawSVGPlugin are only needed by some leaves, so they load on demand (docs/spikes/tbt.md): their
   loaders import and register the plugin the first time they are called, and return the same
   promise after that. */
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

/** SplitText, registered once. Browser only. */
export function loadSplitText(): Promise<typeof SplitText> {
  splitText ??= import("gsap/SplitText").then(({ SplitText: plugin }) => {
    gsap.registerPlugin(plugin);
    return plugin;
  });
  return splitText;
}

/** DrawSVGPlugin, registered once. Browser only. */
export function loadDrawSVG(): Promise<typeof DrawSVGPlugin> {
  drawSVG ??= import("gsap/DrawSVGPlugin").then(({ DrawSVGPlugin: plugin }) => {
    gsap.registerPlugin(plugin);
    return plugin;
  });
  return drawSVG;
}

export { gsap, CustomEase, ScrollTrigger, useGSAP };
