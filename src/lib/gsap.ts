/* The only module that imports GSAP packages (ESLint enforces it). Plugins are registered once,
   in the browser only; everything else imports them from here. */
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { DURATION, EASE, WARM_CURVE } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin, useGSAP);
  CustomEase.create(EASE.warm, WARM_CURVE.join(", "));
  gsap.defaults({ ease: EASE.warm, duration: DURATION.base });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, CustomEase, DrawSVGPlugin, ScrollTrigger, SplitText, useGSAP };
