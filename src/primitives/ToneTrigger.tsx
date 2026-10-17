"use client";

/* The client half of ToneSection: an empty, hidden span whose parent is the section. One
   ScrollTrigger per section sets the shell tone while the section is active. Tone changes are not
   an animation (CSS transitions the colours, and reduced motion shortens them), so it runs in both
   motion branches. */
import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SHELL } from "@/lib/motion";
import { applyShellTone, shellToneOf, toneAt, type SectionTone } from "@/lib/tone";

export interface ToneTriggerProps {
  tone: SectionTone;
  start?: string;
}

export function ToneTrigger({ tone, start = SHELL.toneStart }: ToneTriggerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const section = ref.current?.parentElement;
      if (!section) return;
      const shellTone = shellToneOf(tone);
      ScrollTrigger.create({
        trigger: section,
        start,
        end: SHELL.toneEnd,
        // Leaving: whatever is under the header line now (a section without its own trigger
        // included) gives the tone.
        onToggle: (self) => {
          applyShellTone(document, self.isActive ? shellTone : toneAt(document, SHELL.toneLine));
        },
      });
    },
    { scope: ref, dependencies: [tone, start] },
  );

  return <span ref={ref} hidden data-tone-trigger />;
}
