"use client";

/* The arrival animates each .arc; the scrub animates other layers (the .arc-light inside each arc,
   the .arcs wrapper, .dawn-lift), so a scroll during the arrival composes with it instead of
   fighting it, and the scrub starts from the arrival's end state. The last arc in the markup is
   the innermost: the dawn opens from the core outwards (`from: "end"`) and rises from the outside
   in. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { motionAllowed } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { ABOUT, DURATION, EASE, MEDIA, STAGGER } from "@/lib/motion";

type Amplitude = (typeof ABOUT.dawn)["pinned" | "flow"];

interface Layers {
  lights: HTMLElement[];
  sky: HTMLElement;
  lift: HTMLElement;
}

function rise(timeline: gsap.core.Timeline, { lights, sky, lift }: Layers, amp: Amplitude) {
  const d = ABOUT.dawn;
  timeline
    .fromTo(
      lights,
      { scale: 1 },
      { scale: amp.scale, duration: d.arcRise, stagger: d.arcStagger },
      0,
    )
    .fromTo(sky, { yPercent: 0 }, { yPercent: amp.yPercent, duration: d.riseEnd }, 0)
    .fromTo(
      sky,
      { "--arc-day": "0%" },
      { "--arc-day": `${String(d.dayAtRise)}%`, duration: d.riseEnd - d.dayFrom },
      d.dayFrom,
    )
    .fromTo(
      lift,
      { y: 0, opacity: 1 },
      {
        y: () => (-window.innerHeight * amp.liftVh) / 100,
        opacity: amp.liftOpacity,
        duration: d.riseEnd,
      },
      0,
    )
    // Not rendered at creation, or it would overwrite the rise's start values.
    .fromTo(
      sky,
      { "--arc-day": `${String(d.dayAtRise)}%`, opacity: 1 },
      { "--arc-day": "100%", opacity: 0, duration: d.handOff, immediateRender: false },
      d.riseEnd,
    );
}

export function DawnMotion() {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(ref, (mm) => {
    const section = ref.current?.closest<HTMLElement>(".dawn");
    const sky = section?.querySelector<HTMLElement>(".arcs");
    const lift = section?.querySelector<HTMLElement>(".dawn-lift");
    if (!section || !sky || !lift) return;
    const arcs = [...sky.querySelectorAll<HTMLElement>(".arc")];
    const lights = [...sky.querySelectorAll<HTMLElement>(".arc-light")];
    if (arcs.length === 0 || lights.length === 0) return;
    const layers = { lights, sky, lift };
    const d = ABOUT.dawn;
    // `y: 0` too: GSAP reads the CSS start state's translateY(18%) as a pixel `y`, which the
    // yPercent tween alone would leave in place.
    const rest = { y: 0, yPercent: 0, scale: 1, opacity: 1 };

    mm.add(MEDIA.motion, () => {
      gate(
        gsap.fromTo(
          arcs,
          { ...d.arcsFrom, y: 0, opacity: 0, transformOrigin: "50% 50%" },
          {
            ...rest,
            duration: DURATION.intro,
            stagger: { each: STAGGER.arcs, from: "end" },
            paused: true,
          },
        ),
      );
    });

    mm.add(`${MEDIA.motion} and ${MEDIA.dawnPin}`, () => {
      const willChange = (on: boolean) => {
        for (const light of lights) light.style.willChange = on ? "transform" : "";
      };
      const timeline = gsap.timeline({
        defaults: { ease: EASE.none },
        scrollTrigger: {
          trigger: section,
          pin: true,
          start: d.start,
          end: d.pinEnd,
          scrub: d.scrub,
          invalidateOnRefresh: true,
          refreshPriority: d.refreshPriority,
          onToggle: (self) => {
            willChange(self.isActive);
          },
        },
      });
      rise(timeline, layers, d.pinned);
      return () => {
        willChange(false);
      };
    });

    mm.add(`${MEDIA.motion} and ${MEDIA.dawnFlow}`, () => {
      const timeline = gsap.timeline({
        defaults: { ease: EASE.none },
        scrollTrigger: {
          trigger: section,
          start: d.start,
          end: d.flowEnd,
          scrub: d.scrub,
          invalidateOnRefresh: true,
        },
      });
      rise(timeline, layers, d.flow);
    });

    mm.add(MEDIA.reduce, () => {
      if (motionAllowed()) gsap.set(arcs, rest);
    });
  });

  return <span ref={ref} hidden data-motion-leaf="" />;
}
