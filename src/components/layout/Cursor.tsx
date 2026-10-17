"use client";

/* The cursor (prototype `initCursor`): a Majorelle dot that follows the pointer with a lerp of
   0.16 per 60 fps frame, made frame-rate independent with gsap.ticker.deltaRatio(). Over an
   element with `data-cursor` it grows into a label with that text. Delegated from the document,
   so elements mounted later (after a route change) work too. Fine pointers only, off under
   reduced motion, hidden when the pointer leaves the window. It follows the section tone
   (data-shell) and is invisible to assistive technology. */
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { CURSOR, MEDIA } from "@/lib/motion";
import { SHELL_ATTR } from "@/lib/tone";

const OFFSCREEN = -100;
const shell = { [SHELL_ATTR]: "" };

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const label = el?.querySelector<HTMLElement>("[data-cursor-label]");
      if (!el || !label) return;
      const mm = gsap.matchMedia();
      mm.add(`${MEDIA.finePointer} and ${MEDIA.motion}`, () => {
        const pos = { x: OFFSCREEN, y: OFFSCREEN };
        const aim = { x: OFFSCREEN, y: OFFSCREEN };
        const setX = gsap.quickSetter(el, "x", "px");
        const setY = gsap.quickSetter(el, "y", "px");

        const move = (e: PointerEvent) => {
          aim.x = e.clientX;
          aim.y = e.clientY;
          el.classList.add("is-on");
        };
        const out = (e: MouseEvent) => {
          if (!e.relatedTarget) el.classList.remove("is-on");
        };
        const over = (e: PointerEvent) => {
          const host = e.target instanceof Element ? e.target.closest("[data-cursor]") : null;
          const text = host?.getAttribute("data-cursor");
          if (text) {
            label.textContent = text;
            el.classList.add("is-label");
          } else {
            el.classList.remove("is-label");
          }
        };
        const tick = () => {
          const k = 1 - Math.pow(1 - CURSOR.lerp, gsap.ticker.deltaRatio());
          pos.x += (aim.x - pos.x) * k;
          pos.y += (aim.y - pos.y) * k;
          setX(pos.x);
          setY(pos.y);
        };

        window.addEventListener("pointermove", move, { passive: true });
        document.addEventListener("mouseout", out);
        document.addEventListener("pointerover", over, { passive: true });
        gsap.ticker.add(tick);
        return () => {
          window.removeEventListener("pointermove", move);
          document.removeEventListener("mouseout", out);
          document.removeEventListener("pointerover", over);
          gsap.ticker.remove(tick);
          el.classList.remove("is-on", "is-label");
        };
      });
      return () => {
        mm.revert();
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="cursor" data-tone="day" aria-hidden="true" {...shell}>
      <span className="cursor-label" data-cursor-label />
    </div>
  );
}
