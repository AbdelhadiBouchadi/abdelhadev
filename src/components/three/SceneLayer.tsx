"use client";

/* Server-rendered with its poster, so the page is complete without JavaScript. The chunk download
   starts right after hydration: it dominates the first frame, so it must not wait for the hero to
   scroll into view. */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSceneProps, SceneMode } from "@/components/three/HeroScene";
import { useLoaderTask } from "@/hooks/useLoaderTask";
import { LOADER, MEDIA } from "@/lib/motion";
import { sceneState } from "@/lib/scene-state";
import { shellBusy, shellRegistry } from "@/lib/shell";

export type SceneLayerState = "loading" | SceneMode | "poster";

const importScene = () => import("@/components/three/HeroScene");

const HeroScene = dynamic<HeroSceneProps>(importScene, { ssr: false });

/** The throwaway context is released at once. */
function hasWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
}

function deferred(): Deferred {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // A failed scene is not an unhandled rejection: the registry counts it as settled.
  promise.catch(() => undefined);
  return { promise, resolve, reject };
}

export const SCENE_POSTER = {
  desktop: { src: "/media/scene-poster-desktop.webp", width: 1440, height: 900 },
  mobile: { src: "/media/scene-poster-mobile.webp", width: 780, height: 1688 },
} as const;

export function SceneLayer() {
  const [state, setState] = useState<SceneLayerState>("loading");
  const [mode, setMode] = useState<SceneMode | null>(null);
  const firstFrame = useRef<Deferred | null>(null);
  firstFrame.current ??= deferred();

  useLoaderTask(LOADER.weights.scene, () => firstFrame.current?.promise ?? Promise.resolve());

  useEffect(() => {
    let alive = true;
    const webgl = hasWebGL();
    // Without WebGL the chunk is never requested.
    const scene = webgl ? importScene() : Promise.reject(new Error("WebGL is not available"));
    let stopWaiting: () => void = () => undefined;
    scene.then(
      () => {
        if (!alive) return;
        const mount = () => {
          setMode(window.matchMedia(MEDIA.reduce).matches ? "still" : "live");
        };
        // A chunk that arrives once the loader has stopped waiting (its exit is playing) would
        // compile shaders and upload textures in the middle of the exit and stall it. It waits
        // until the overlay is gone, then fades in late, as a late scene does.
        if (shellRegistry().isReady() && shellBusy.get()) {
          const unsubscribe = shellBusy.subscribe((busy) => {
            if (busy) return;
            unsubscribe();
            if (alive) mount();
          });
          stopWaiting = unsubscribe;
        } else {
          mount();
        }
      },
      (error: unknown) => {
        if (!alive) return;
        setState("poster");
        // No WebGL is the designed fallback, not a failure; a chunk that failed to load is.
        if (webgl) firstFrame.current?.reject(error);
        else firstFrame.current?.resolve();
      },
    );
    return () => {
      alive = false;
      stopWaiting();
      sceneState.reset();
    };
  }, []);

  const onFrame = useCallback(() => {
    setState((current) => (current === "poster" ? current : (mode ?? current)));
    firstFrame.current?.resolve();
  }, [mode]);

  const onFail = useCallback((error: unknown) => {
    setState("poster");
    setMode(null);
    firstFrame.current?.reject(error);
  }, []);

  return (
    <div className="scene-layer" data-scene={state} aria-hidden="true">
      <picture>
        <source
          media={MEDIA.mobile}
          srcSet={SCENE_POSTER.mobile.src}
          width={SCENE_POSTER.mobile.width}
          height={SCENE_POSTER.mobile.height}
        />
        {/* Plain <img>: next/image does not render <picture> art direction. Lazy, so it is never
            fetched while CSS hides it. */}
        <img
          className="scene-poster"
          src={SCENE_POSTER.desktop.src}
          width={SCENE_POSTER.desktop.width}
          height={SCENE_POSTER.desktop.height}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </picture>
      {mode ? <HeroScene mode={mode} onFrame={onFrame} onFail={onFail} /> : null}
    </div>
  );
}
