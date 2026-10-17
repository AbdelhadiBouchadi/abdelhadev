import { useEffect, useRef } from "react";
import { shellReady } from "@/lib/shell";

/** Runs `callback` once, when the loader (or the route curtain) signals that the page intro may
    start, 0.55 s into its exit. If the signal already fired, it runs on mount.

    Safe under StrictMode: the ref survives React's simulated unmount and remount, so the second
    effect run does not call it again. The latest callback is used, so it may close over props. */
export function useLoaderReady(callback: () => void): void {
  const latest = useRef(callback);
  const done = useRef(false);

  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    const run = () => {
      if (done.current) return;
      done.current = true;
      latest.current();
    };
    if (shellReady.fired()) {
      run();
      return undefined;
    }
    return shellReady.subscribe(run);
  }, []);
}
