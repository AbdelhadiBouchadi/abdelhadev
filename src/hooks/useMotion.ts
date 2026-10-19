import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { afterCommit } from "@/lib/schedule";

/** The setup runs in one shared task after React's commit, not inside it (lib/schedule.ts).
    Everything it creates goes through contextSafe, so it is reverted with the component, also
    under StrictMode's simulated unmount, and a setup that has not run yet is cancelled. */
export function useMotion(
  scope: RefObject<Element | null> | undefined,
  setup: (mm: gsap.MatchMedia) => void,
  dependencies: readonly unknown[] = [],
): void {
  useGSAP(
    (_context, contextSafe) => {
      const mm = gsap.matchMedia();
      const run = () => {
        setup(mm);
      };
      const cancel = afterCommit(contextSafe ? contextSafe(run) : run);
      return () => {
        cancel();
        mm.revert();
      };
    },
    { scope, dependencies: [...dependencies], revertOnUpdate: true },
  );
}
