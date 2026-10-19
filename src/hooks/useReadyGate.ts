import { useCallback, useRef } from "react";
import { useLoaderReady } from "@/hooks/useLoaderReady";
import type { gsap } from "@/lib/gsap";

/** The latest animation wins, so a rebuilt intro (SplitText re-splitting) replaces the old one. */
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
