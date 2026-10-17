/* A top-level section that declares its tone (day, night or sheet) for its own styling
   (`data-tone`) and, through a client leaf, for the shell: while the section is under the header
   line, the header, the mobile pill and the cursor take its tone (prototype `initTone`). The
   markup is server-rendered; only the trigger is client code. */
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { SectionTone } from "@/lib/tone";
import { ToneTrigger } from "@/primitives/ToneTrigger";

export interface ToneSectionProps extends ComponentPropsWithoutRef<"section"> {
  tone: SectionTone;
  /** Where this section takes over the shell tone, as a ScrollTrigger start ("center 50px").
      Defaults to the top of the section reaching the header line. */
  start?: string;
  as?: "section" | "footer" | "div";
  children: ReactNode;
}

export function ToneSection({
  tone,
  start,
  as: Tag = "section",
  children,
  ...props
}: ToneSectionProps) {
  return (
    <Tag {...props} data-tone={tone}>
      <ToneTrigger tone={tone} start={start} />
      {children}
    </Tag>
  );
}
