import { useEffect, useRef } from "react";
import { shellReady } from "@/lib/shell";

/** Runs on mount if the signal already fired. The ref survives StrictMode's simulated remount,
    so the second effect run does not call it again. */
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
