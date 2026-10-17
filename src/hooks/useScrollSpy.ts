import { useState } from "react";
import { useMotion } from "@/hooks/useMotion";
import { ScrollTrigger } from "@/lib/gsap";
import { SPY } from "@/lib/motion";
import { lineRange, SPY_START, spyReduce } from "@/lib/scroll";

export interface ScrollSpyOptions {
  /** The activation line as a fraction of the viewport height from the top: SPY.list (0.45) for
      lists such as the work rail, SPY.tour (0.55) for the case study tour. */
  line?: number;
}

export interface ScrollSpy {
  /** Index into `ids` of the element crossing the line, or -1 before the first one reaches it. */
  activeIndex: number;
  activeId: string | null;
}

/** Which of the elements with these ids is crossing the activation line (prototype Pages.work rail
    and Pages.case tour), through one ScrollTrigger per element and its onToggle. Not an animation,
    so it runs with and without reduced motion. The triggers die with the component; nothing
    updates while the page cannot scroll. */
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
