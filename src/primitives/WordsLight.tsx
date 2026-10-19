import type { HTMLAttributes, ReactNode } from "react";
import { WordsLightMotion, type WordsLightMotionProps } from "@/primitives/WordsLightMotion";

export interface WordsLightProps
  extends Omit<HTMLAttributes<HTMLElement>, "children">, WordsLightMotionProps {
  as?: "p" | "h2" | "h3" | "blockquote";
  children: ReactNode;
}

export function WordsLight({
  as: Tag = "p",
  trigger,
  start,
  end,
  children,
  ...props
}: WordsLightProps) {
  return (
    <>
      <Tag {...props} data-words-light="">
        {children}
      </Tag>
      <WordsLightMotion trigger={trigger} start={start} end={end} />
    </>
  );
}
