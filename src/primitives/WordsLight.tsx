/* Scrubbed word-by-word lighting (prototype wordsLight): the statement's words go from
   REVEAL.wordsFrom to full opacity as its range scrolls by. Server-rendered text; the client leaf
   after it splits words and scrubs them. Without JavaScript, or under reduced motion, the text is
   plain and fully opaque. */
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
