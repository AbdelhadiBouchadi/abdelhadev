"use client";

/* The route is measured from the real layout, so it follows any width and either language. It is
   measured again only for a real change of the zone's size and only once the page is still: a
   rebuild during a scroll shows as the line shaking. The timeline is refitted to the new path, not
   recreated, so the line never restarts from zero and its trigger lives as long as the page. */
import { useLocale } from "next-intl";
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { motionAllowed } from "@/lib/css";
import { gsap, loadDrawSVG, loadMotionPath, ScrollTrigger } from "@/lib/gsap";
import { ABOUT, EASE, MEDIA } from "@/lib/motion";
import { marginX, resizeKind, threadPath, type Point, type ZoneSize } from "@/lib/thread";

/** px: below it, the mobile band (MEDIA.mobile). */
const NARROW = 761;

interface Parts {
  zone: HTMLElement;
  svg: SVGSVGElement;
  gradient: SVGLinearGradientElement;
  ghost: SVGPathElement;
  path: SVGPathElement;
  sun: SVGGElement;
}

function parts(leaf: Element | null): Parts | null {
  const zone = leaf?.closest<HTMLElement>(".thread-zone");
  const svg = zone?.querySelector<SVGSVGElement>(".thread");
  const gradient = svg?.querySelector<SVGLinearGradientElement>("linearGradient");
  const ghost = svg?.querySelector<SVGPathElement>(".thread-ghost");
  const path = svg?.querySelector<SVGPathElement>(".thread-path");
  const sun = svg?.querySelector<SVGGElement>(".thread-sun");
  if (!zone || !svg || !gradient || !ghost || !path || !sun) return null;
  return { zone, svg, gradient, ghost, path, sun };
}

/** The right edge of the section's own content: the widest child of its .wrap. */
function contentRight(anchor: Element): number {
  const wrap = anchor.closest("section")?.querySelector(".wrap") ?? anchor;
  let right = 0;
  for (const child of wrap.children) right = Math.max(right, child.getBoundingClientRect().right);
  return right;
}

/** Writes the measured route into the SVG; false when an anchor is missing. */
function measure({ zone, svg, gradient, ghost, path }: Parts): boolean {
  const t = ABOUT.thread;
  const box = zone.getBoundingClientRect();
  const width = zone.clientWidth;
  const height = zone.clientHeight;
  const xs = width < NARROW ? t.x.mobile : t.x.desktop;
  const q = (selector: string) => zone.querySelector(selector);
  const chapters = [...zone.querySelectorAll(".chapter")];
  const anchors: [Element | null, number, number][] = [
    ...chapters.map((c, i): [Element, number, number] => [
      c,
      i === 0 ? t.firstChapterAt : t.chapterAt,
      0,
    ]),
    [q("#services"), t.sectionAt, 0],
    [q("#process"), t.sectionAt, 0],
    [q(".timeline"), 0, 0],
    [q(".timeline"), 1, 0],
    [q(".stack-groups"), 1, t.stackGap],
  ];
  const points: Point[] = [{ x: width / 2, y: 0 }];
  for (const [i, [el, at, gap]] of anchors.entries()) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    points.push({
      x: marginX(xs[i] ?? xs[xs.length - 1] ?? 1, xs, width, contentRight(el) - box.left),
      y: r.top - box.top + r.height * at + gap,
    });
  }
  points.push({ x: width / 2, y: height });

  const d = threadPath(points);
  svg.setAttribute("viewBox", `0 0 ${String(width)} ${String(height)}`);
  gradient.setAttribute("y2", String(height));
  ghost.setAttribute("d", d);
  path.setAttribute("d", d);
  return true;
}

function sizeOf(zone: HTMLElement): ZoneSize {
  return {
    width: zone.clientWidth,
    height: zone.clientHeight,
    viewWidth: window.innerWidth,
    viewHeight: window.innerHeight,
  };
}

/** The same timeline on the new path: invalidated, DrawSVG and MotionPath read the path again. Only
    this trigger is refreshed, and the line is drawn at once where the page is. */
function refit(timeline: gsap.core.Timeline) {
  const trigger = timeline.scrollTrigger;
  trigger?.refresh();
  const progress = trigger
    ? gsap.utils.clamp(
        0,
        1,
        (trigger.scroll() - trigger.start) / (trigger.end - trigger.start || 1),
      )
    : timeline.progress();
  timeline.invalidate().progress(0, true).progress(progress, true);
}

export function ThreadMotion() {
  const ref = useRef<HTMLSpanElement>(null);
  const locale = useLocale();

  useMotion(
    ref,
    (mm) => {
      const p = parts(ref.current);
      if (!p) return;
      const t = ABOUT.thread;

      /** Measures now, then again when the zone changes size (fonts and images included), once
          the page has been still for `quietMs`. */
      const watch = (build: () => void) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let active = true;
        let built = sizeOf(p.zone);
        let scrolled = 0;
        const later = (delay: number = t.rebuildMs) => {
          clearTimeout(timer);
          if (active) timer = setTimeout(attempt, delay);
        };
        const attempt = () => {
          const now = sizeOf(p.zone);
          const kind = resizeKind(built, now, ScrollTrigger.isTouch === 1);
          if (kind === "same") return;
          if (kind === "viewport") {
            built = now;
            return;
          }
          const still = performance.now() - scrolled;
          if (still < t.quietMs) {
            later(t.quietMs - still);
            return;
          }
          built = now;
          build();
        };
        const onScroll = () => {
          scrolled = performance.now();
        };
        const onChange = () => {
          later();
        };
        build();
        const observer = new ResizeObserver(onChange);
        observer.observe(p.zone);
        window.addEventListener("scroll", onScroll, { passive: true });
        void document.fonts.ready.then(onChange);
        if (document.readyState !== "complete") window.addEventListener("load", onChange);
        return () => {
          active = false;
          clearTimeout(timer);
          observer.disconnect();
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("load", onChange);
        };
      };

      mm.add(MEDIA.motion, (context) => {
        let alive = true;
        let stop: (() => void) | undefined;
        let timeline: gsap.core.Timeline | null = null;
        const kill = () => {
          timeline?.scrollTrigger?.kill();
          timeline?.kill();
          timeline = null;
        };
        void Promise.all([loadDrawSVG(), loadMotionPath()]).then(() => {
          if (!alive) return;
          stop = watch(() => {
            context.add(() => {
              if (!measure(p)) {
                kill();
                return;
              }
              if (timeline) {
                refit(timeline);
                return;
              }
              timeline = gsap.timeline({
                defaults: { ease: EASE.none },
                scrollTrigger: { trigger: p.zone, start: t.start, end: t.end, scrub: t.scrub },
              });
              timeline
                .fromTo(p.path, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: t.draw }, 0)
                .fromTo(p.sun, { opacity: 0 }, { opacity: 1, duration: t.sunIn }, 0)
                .to(
                  p.sun,
                  {
                    motionPath: {
                      path: p.path,
                      align: p.path,
                      alignOrigin: [0.5, 0.5],
                      autoRotate: false,
                    },
                    duration: t.draw,
                  },
                  0,
                )
                .to(p.sun, { opacity: 0, duration: t.sunOut }, t.sunOutAt);
              // Hidden by CSS until DrawSVG has collapsed it, so its round cap never shows a dot.
              gsap.set(p.path, { visibility: "visible" });
            });
          });
        });
        return () => {
          alive = false;
          stop?.();
          kill();
        };
      });

      // Still and fully drawn. html.motion stays when the preference changes mid-visit.
      mm.add(MEDIA.reduce, () => {
        const stop = watch(() => {
          measure(p);
        });
        if (motionAllowed()) gsap.set(p.path, { visibility: "visible" });
        return stop;
      });
    },
    [locale],
  );

  return <span ref={ref} hidden data-motion-leaf="" />;
}
