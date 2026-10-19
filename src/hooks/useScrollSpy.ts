import { useState } from "react";
import { useMotion } from "@/hooks/useMotion";
import { ScrollTrigger } from "@/lib/gsap";
import { SPY } from "@/lib/motion";
import { lineRange, SPY_START, spyReduce } from "@/lib/scroll";

export interface ScrollSpyOptions {
  /** A fraction of the viewport height from the top. */
  line?: number;
}

export interface ScrollSpy {
  /** -1 before the first element reaches the line. */
  activeIndex: number;
  activeId: string | null;
}

/** Not an animation, so it runs with and without reduced motion. */
export function useScrollSpy(
  ids: readonly string[],
  { line = SPY.list }: ScrollSpyOptions = {},
): ScrollSpy {
  const [activeIndex, setActiveIndex] = useState(-1);
  const key = ids.join(" ");

  useMotion(undefined, () => {
    const { start, end } = lineRange(line);
    let state = SPY_START;
    ids.forEach((id, index) => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start,
        end,
        onToggle: (self) => {
          if (ScrollTrigger.maxScroll(window) <= 0) return;
          state = spyReduce(state, index, self.isActive);
          setActiveIndex(state.active);
        },
      });
    });
  }, [key, line]);

  return { activeIndex, activeId: ids[activeIndex] ?? null };
}
