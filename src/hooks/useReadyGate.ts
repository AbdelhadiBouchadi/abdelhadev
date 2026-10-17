import { useCallback, useRef } from "react";
import { useLoaderReady } from "@/hooks/useLoaderReady";
import type { gsap } from "@/lib/gsap";

/** Holds a paused intro animation until the loader (or the route curtain) signals ready, then
    plays it; an animation handed over after the signal plays at once. The latest one wins, so a
    rebuilt intro (SplitText re-splitting under autoSplit) replaces the one it supersedes. */
export function useReadyGate(): (animation: gsap.core.Animation) => void {
  const ready = useRef(false);
  const pending = useRef<gsap.core.Animation | null>(null);

  useLoaderReady(() => {
    ready.current = true;
    pending.current?.play();
  });

  return useCallback((animation: gsap.core.Animation) => {
    pending.current = animation;
    if (ready.current) animation.play();
  }, []);
}
