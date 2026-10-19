import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { SectionTone } from "@/lib/tone";
import { ToneTrigger } from "@/primitives/ToneTrigger";

export interface ToneSectionProps extends ComponentPropsWithoutRef<"section"> {
  tone: SectionTone;
  /** A ScrollTrigger start such as "center 50px". Defaults to the top reaching the header line. */
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
