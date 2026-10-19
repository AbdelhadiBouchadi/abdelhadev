import { useEffect, useRef } from "react";
import { shellRegistry } from "@/lib/shell";

/** The ref keeps StrictMode's second effect run from registering the task twice. */
export function useLoaderTask(weight: number, promiseFactory: () => PromiseLike<unknown>): void {
  const factory = useRef(promiseFactory);
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    shellRegistry().track(weight, factory.current());
  }, [weight]);
}
