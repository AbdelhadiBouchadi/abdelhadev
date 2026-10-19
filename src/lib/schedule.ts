/* useGSAP runs inside the hydration commit, where every primitive's setup would interleave GSAP's
   style writes with ScrollTrigger's layout reads in one long task. Queued here, they run together
   in the next macrotask, under the loader or the curtain (docs/spikes/tbt.md). */

export type Task = () => void;

export interface Scheduler {
  afterCommit: (task: Task) => () => void;
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

export const afterCommit: Scheduler["afterCommit"] = shared.afterCommit;
