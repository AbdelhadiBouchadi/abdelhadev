import { useEffect, useRef } from "react";
import { shellRegistry } from "@/lib/shell";

/** Registers a task the page needs before the loader may lift (a critical image, the 3D scene).
    `weight` follows docs/choreography.md: image 1, scene 3. The factory runs once per mount (the
    ref keeps StrictMode's second effect run from registering it twice). A task registered after
    the loader is ready is ignored by the registry. */
export function useLoaderTask(weight: number, promiseFactory: () => PromiseLike<unknown>): void {
  const factory = useRef(promiseFactory);
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    shellRegistry().track(weight, factory.current());
  }, [weight]);
}
