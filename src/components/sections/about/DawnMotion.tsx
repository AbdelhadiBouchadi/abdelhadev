"use client";

/* The arrival grows the .dawn-glow wrapper and the scrub the .dawn-glow-light inside it, so a
   scroll during the arrival composes with it instead of fighting it. Every scrubbed tween is a
   fromTo, so a refresh mid-scene (invalidateOnRefresh) never records a scrolled state as a start. */
import { useRef } from "react";
import { useMotion } from "@/hooks/useMotion";
import { useReadyGate } from "@/hooks/useReadyGate";
import { motionAllowed, readToken } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { ABOUT, EASE, MEDIA } from "@/lib/motion";

export function DawnMotion() {
  const ref = useRef<HTMLSpanElement>(null);
  const gate = useReadyGate();

  useMotion(ref, (mm) => {
    const section = ref.current?.closest<HTMLElement>(".dawn");
    const q = (selector: string) => section?.querySelector<HTMLElement>(selector) ?? null;
    const stage = q(".dawn-stage");
    const glow = q(".dawn-glow");
    const light = q(".dawn-glow-light");
    const sky = q(".dawn-sky");
    const copy = q(".dawn-copy");
    const horizon = q(".sun-horizon");
    const disc = q(".sun-disc");
    const reflection = q(".sun-reflection");
    const halos = section ? [...section.querySelectorAll<HTMLElement>(".halo")] : [];
    if (!section || !stage || !glow || !light || !sky || !copy || !horizon || !disc || !reflection)
      return;
    const d = ABOUT.dawn;
    const later = { immediateRender: false };

    mm.add(MEDIA.motion, () => {
      gate(
        gsap.fromTo(
          glow,
          { ...d.glowFrom, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: d.glowRise, ease: EASE.settle, paused: true },
        ),
      );

      const willChange = (on: boolean) => {
        for (const halo of halos) halo.style.willChange = on ? "transform, opacity" : "";
      };
      const timeline = gsap.timeline({
        defaults: { ease: EASE.none },
        scrollTrigger: {
          trigger: section,
          start: d.start,
          // The chapters cover the last screen and the sticky stage holds one more. A screen is the
          // stage's 100svh: innerHeight changes while a phone's address bar moves.
          end: () => `+=${String(section.offsetHeight - d.tailScreens * stage.offsetHeight)}`,
          scrub: d.scrub,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            willChange(self.isActive);
          },
        },
      });

      timeline
        .fromTo(
          copy,
          { yPercent: 0, opacity: 1 },
          { yPercent: d.copy.yPercent, opacity: 0, duration: d.copy.duration },
          0,
        )
        .fromTo(
          light,
          { scaleY: 1, opacity: 1 },
          { scaleY: d.glow.scaleY, duration: d.glow.duration },
          0,
        )
        .fromTo(sky, { opacity: 0 }, { opacity: 1, duration: d.sky.duration }, d.sky.at);

      const h = d.halos;
      halos.forEach((halo, i) => {
        const at = h.at + i * h.step;
        timeline
          .fromTo(
            halo,
            { scale: h.from },
            { scale: h.to, duration: h.rise, ease: EASE.halo, ...later },
            at,
          )
          .fromTo(halo, { opacity: 0 }, { opacity: 1, duration: h.fadeIn, ...later }, at)
          .fromTo(
            halo,
            { opacity: 1 },
            { opacity: 0, duration: h.fadeOut, ...later },
            at + h.fadeOutAt,
          );
      });

      const s = d.sun;
      timeline
        .fromTo(
          sky,
          { backgroundColor: readToken("sunset") },
          { backgroundColor: readToken("sheet"), duration: s.dayDuration, ...later },
          s.dayAt,
        )
        .fromTo(
          light,
          { opacity: 1 },
          { opacity: s.glowOpacity, duration: s.dayDuration, ...later },
          s.dayAt,
        )
        .fromTo(
          horizon,
          { scaleX: 0 },
          { scaleX: 1, duration: s.barDuration, ease: EASE.settle, ...later },
          s.horizonAt,
        )
        // `y: 0` too: GSAP reads the CSS start state's translateY(100%) as a pixel `y`.
        .fromTo(
          disc,
          { yPercent: 100, y: 0 },
          { yPercent: 0, y: 0, duration: s.discDuration, ease: EASE.settle, ...later },
          s.discAt,
        )
        .fromTo(
          reflection,
          { scaleX: 0 },
          { scaleX: 1, duration: s.barDuration, ease: EASE.settle, ...later },
          s.reflectionAt,
        )
        .set({}, {}, d.end);

      return () => {
        willChange(false);
      };
    });

    // The preference changed after the boot script set html.motion: show the still sunrise.
    mm.add(MEDIA.reduce, () => {
      if (!motionAllowed()) return;
      gsap.set([glow, light], { scaleY: 1, opacity: 1 });
      gsap.set([horizon, reflection], { scaleX: 1 });
      gsap.set(disc, { yPercent: 0, y: 0 });
    });
  });

  return <span ref={ref} hidden data-motion-leaf="" />;
}
