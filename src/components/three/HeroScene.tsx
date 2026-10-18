"use client";

/* The home 3D scene's client component: the lazy chunk (next/dynamic, ssr: false, from
   SceneLayer). It creates its own canvas, builds the scene (scene.ts) and either
   - `live`: renders on gsap.ticker (no second rAF loop), reading the scroll progress from
     lib/scene-state.ts, with pointer parallax on fine pointers; it stops rendering when the dusk's
     p3 reaches STOP_AT (and hides the canvas), when the document is hidden, when the canvas is
     out of view and while the loader or a curtain covers the page; or
   - `still` (reduced motion): one frame of the resting composition, redrawn only on resize; no
     ticker, no pointer.
   The first frame compiles the shaders and uploads the textures; `onFrame` fires once it has been
   presented, and the canvas fades in (DURATION.scene) at the loader's ready signal or at once if
   the signal already fired. Any failure (no context, a lost context, a missing token) calls
   `onFail` and SceneLayer shows the poster.

   The canvas is created here rather than rendered by React: forceContextLoss() on unmount leaves a
   canvas whose context can never be recreated, and StrictMode mounts twice. */
import { useEffect, useRef } from "react";
import { SCENE_TOKENS } from "@/components/three/palette";
import { createScene, MAX_PIXEL_RATIO, STOP_AT, type SceneHandle } from "@/components/three/scene";
import { useReadyGate } from "@/hooks/useReadyGate";
import { readColorTokens } from "@/lib/css-tokens";
import { gsap } from "@/lib/gsap";
import { DURATION, HOME, MEDIA } from "@/lib/motion";
import { sceneState } from "@/lib/scene-state";
import { shellBusy } from "@/lib/shell";

export type SceneMode = "live" | "still";

export interface HeroSceneProps {
  mode: SceneMode;
  /** The first frame has been presented. */
  onFrame: () => void;
  /** The scene could not be created, or its context was lost. */
  onFail: (error: unknown) => void;
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export default function HeroScene({ mode, onFrame, onFail }: HeroSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gate = useReadyGate();
  const callbacks = useRef({ onFrame, onFail });

  useEffect(() => {
    callbacks.current = { onFrame, onFail };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const canvas = document.createElement("canvas");
    canvas.className = "scene-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);

    let scene: SceneHandle;
    try {
      scene = createScene({
        canvas,
        colors: readColorTokens(SCENE_TOKENS),
        mobile: window.matchMedia(MEDIA.mobile).matches,
        pixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
        makeCanvas,
      });
    } catch (error) {
      canvas.remove();
      callbacks.current.onFail(error);
      return undefined;
    }

    let alive = true;
    const cleanups: (() => void)[] = [];
    const listen = (target: EventTarget, type: string, handler: EventListener) => {
      target.addEventListener(type, handler);
      cleanups.push(() => {
        target.removeEventListener(type, handler);
      });
    };

    const fit = () => {
      scene.size(host.clientWidth, host.clientHeight);
    };
    fit();

    listen(canvas, "webglcontextlost", () => {
      if (alive) callbacks.current.onFail(new Error("WebGL context lost"));
    });

    // First frame (the resting composition, as the prototype's render(0)); onFrame once the
    // browser has presented it.
    scene.renderStatic();
    const raf = requestAnimationFrame(() => {
      if (alive) callbacks.current.onFrame();
    });
    cleanups.push(() => {
      cancelAnimationFrame(raf);
    });

    if (mode === "still") {
      const resize = new ResizeObserver(() => {
        fit();
        scene.renderStatic();
      });
      resize.observe(host);
      cleanups.push(() => {
        resize.disconnect();
      });
    } else {
      const fade = gsap.fromTo(
        canvas,
        { opacity: 0 },
        { opacity: 1, duration: DURATION.scene, delay: HOME.scene.delay, paused: true },
      );
      gate(fade);
      cleanups.push(() => {
        fade.kill();
      });

      const resize = new ResizeObserver(fit);
      resize.observe(host);
      cleanups.push(() => {
        resize.disconnect();
      });

      let inView = true;
      const view = new IntersectionObserver((entries) => {
        inView = entries.some((e) => e.isIntersecting);
      });
      view.observe(host);
      cleanups.push(() => {
        view.disconnect();
      });

      if (window.matchMedia(MEDIA.finePointer).matches) {
        listen(window, "pointermove", (e) => {
          if (!(e instanceof PointerEvent)) return;
          scene.aim(
            (e.clientX / window.innerWidth) * 2 - 1,
            -((e.clientY / window.innerHeight) * 2 - 1),
          );
        });
      }

      let shown = true;
      const tick = (seconds: number) => {
        const visible = sceneState.progress.p3 < STOP_AT;
        if (visible !== shown) {
          shown = visible;
          canvas.style.visibility = visible ? "" : "hidden";
        }
        // Nothing is seen under the loader or a curtain: the first frame is drawn, the loop waits,
        // so it never competes with the overlay's own animation for the main thread.
        if (!visible || !inView || document.hidden || shellBusy.get()) return;
        scene.render(seconds, sceneState.progress, gsap.ticker.deltaRatio());
      };
      gsap.ticker.add(tick);
      cleanups.push(() => {
        gsap.ticker.remove(tick);
      });
    }

    return () => {
      alive = false;
      for (const cleanup of cleanups.reverse()) cleanup();
      scene.dispose();
      canvas.remove();
    };
  }, [mode, gate]);

  return <div ref={hostRef} className="scene-host" />;
}
