"use client";

/* The featured work's stage timeline (prototype Pages.home, #build).
   - Desktop (sticky 300 vh): the copy fades up, then the four screens open from the bottom
     (clip-path) while their inner screens settle from 1.22, one after another, scrubbed.
   - Mobile (normal flow): the copy fades up when it enters; each screen opens on its own range as
     it enters.
   - Reduced motion: nothing is built and everything is at rest.
   The start states are CSS under html.motion (styles/home.css). */
import { readToken, motionAllowed } from "@/lib/css";
import { gsap } from "@/lib/gsap";
import { EASE, HOME, SCRUB, STAGGER } from "@/lib/motion";
import { insetClip } from "@/lib/scroll";
import { useStageTimeline } from "@/primitives/useStageTimeline";

export function FeaturedMotion() {
  const { ref } = useStageTimeline<HTMLSpanElement>(({ timeline, condition, stage }) => {
    const copyBox = stage.querySelector("[data-featured-copy]");
    const copy = copyBox ? [...copyBox.children] : [];
    const tiles = [...stage.querySelectorAll<HTMLElement>("[data-tile]")];
    const inners = tiles.flatMap((tile) => [...tile.querySelectorAll("[data-media-inner]")]);
    const f = HOME.featured;
    const radius = readToken("r-frame");
    const closed = { clipPath: insetClip([100, 0, 0, 0], radius) };
    const open = { clipPath: insetClip([0, 0, 0, 0], radius) };

    if (timeline) {
      timeline
        .fromTo(
          copy,
          { opacity: 0, y: f.copyY },
          { opacity: 1, y: 0, stagger: f.copyStagger, duration: f.copyDuration },
          0,
        )
        .fromTo(
          tiles,
          closed,
          { ...open, stagger: STAGGER.tiles, duration: f.tileDuration },
          f.tilesAt,
        )
        .fromTo(
          inners,
          { scale: f.innerFrom },
          { scale: 1, stagger: STAGGER.tiles, duration: f.innerDuration },
          f.tilesAt,
        )
        .to({}, { duration: f.tail });
      return undefined;
    }

    if (condition === "mobile") {
      if (copyBox) {
        gsap.fromTo(
          copy,
          { opacity: 0, y: f.mobileCopyY },
          {
            opacity: 1,
            y: 0,
            stagger: f.mobileCopyStagger,
            duration: f.mobileCopyDuration,
            scrollTrigger: { trigger: copyBox, start: f.mobileCopyStart, once: true },
          },
        );
      }
      tiles.forEach((tile) => {
        const tl = gsap.timeline({
          defaults: { ease: EASE.none },
          scrollTrigger: {
            trigger: tile,
            start: f.mobileTileStart,
            end: f.mobileTileEnd,
            scrub: SCRUB,
          },
        });
        tl.fromTo(tile, closed, open, 0);
        const inner = tile.querySelector("[data-media-inner]");
        if (inner) tl.fromTo(inner, { scale: f.innerFrom }, { scale: 1 }, 0);
      });
      return undefined;
    }

    // Reduced motion switched on mid-visit: the CSS start states must not hide anything.
    if (motionAllowed()) {
      gsap.set(copy, { opacity: 1, y: 0 });
      gsap.set(tiles, { clipPath: "none" });
      gsap.set(inners, { scale: 1 });
    }
    return undefined;
  });

  return <span ref={ref} hidden data-motion-leaf="" />;
}
