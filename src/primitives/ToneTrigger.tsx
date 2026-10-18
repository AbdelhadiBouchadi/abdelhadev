"use client";

/* The client half of ToneSection: an empty, hidden span whose parent is the section. One
   ScrollTrigger per section sets the shell tone while the section is active. Tone changes are not
   an animation (CSS transitions the colours, and reduced motion shortens them), so it runs in both
   motion branches. */
import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { SHELL } from "@/lib/motion";
import { applyShellTone, shellToneOf, untriggeredToneAt, type SectionTone } from "@/lib/tone";

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
        // Leaving: a section without its own trigger under the header line gives the tone;
        // otherwise the tone stays until the next trigger becomes active (prototype initTone). A
        // section with a later takeover point (the home dusk, "center 50px") must not take over
        // as soon as its top reaches the line.
        onToggle: (self) => {
          const tone = self.isActive ? shellTone : untriggeredToneAt(document, SHELL.toneLine);
          if (tone) applyShellTone(document, tone);
        },
      });
    },
    { scope: ref, dependencies: [tone, start] },
  );

  return <span ref={ref} hidden data-tone-trigger />;
}
