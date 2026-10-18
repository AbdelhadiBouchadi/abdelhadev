/* One shared task after React's commit, for the primitives' GSAP setup (docs/spikes/tbt.md).

   useGSAP runs inside the hydration commit, where every primitive's setup would interleave GSAP's
   style writes with ScrollTrigger's layout reads in the one long task React is already running.
   Primitives queue their setup here instead: it runs in the next macrotask, all together, under
   the loader overlay (or the route curtain), and before the intro is allowed to start. A queued
   task that is cancelled (unmount, StrictMode's simulated unmount) never runs.

   Framework-free and timer-injectable so tests/unit can drive it. */

export type Task = () => void;

export interface Scheduler {
  /** Queues `task` for the next flush. Returns a cancel function. */
  afterCommit: (task: Task) => () => void;
  /** Runs every queued task now (tests). */
  flush: () => void;
}

export function createScheduler(
  defer: (run: () => void) => void = (run) => {
    setTimeout(run, 0);
  },
): Scheduler {
  const queue = new Set<Task>();
  let scheduled = false;

  function flush() {
    scheduled = false;
    const tasks = [...queue];
    queue.clear();
    for (const task of tasks) task();
  }

  return {
    afterCommit(task) {
      // Wrapped so the same function queued twice runs twice, and cancel removes only its own.
      const entry: Task = () => {
        task();
      };
      queue.add(entry);
      if (!scheduled) {
        scheduled = true;
        defer(flush);
      }
      return () => {
        queue.delete(entry);
      };
    },
    flush,
  };
}

const shared = createScheduler();

/** Queues `task` for the shared flush after the current commit. Returns a cancel function. */
export const afterCommit: Scheduler["afterCommit"] = shared.afterCommit;
