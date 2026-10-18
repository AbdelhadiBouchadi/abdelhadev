import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { afterCommit } from "@/lib/schedule";

/** The setup every primitive shares (docs/primitives.md): useGSAP with a scope, a gsap.matchMedia
    for the motion and reduced-motion branches, and cleanup on unmount, with the setup itself run
    in one shared task after React's commit instead of inside it (lib/schedule.ts,
    docs/spikes/tbt.md). Everything the setup creates belongs to the useGSAP context (through
    contextSafe), so it is reverted with the component, including under StrictMode's simulated
    unmount, and a setup that has not run yet is cancelled. `dependencies` re-run the setup. */
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
