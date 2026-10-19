/* A short page body: one heading, one sentence and its actions (the 404 and the error pages). */
import type { ReactNode, Ref } from "react";

export interface PagePlaceholderProps {
  title: string;
  lead: string;
  children?: ReactNode;
  /** The heading, for a page that moves focus to it (the error page). */
  headingRef?: Ref<HTMLHeadingElement>;
}

export function PagePlaceholder({ title, lead, children, headingRef }: PagePlaceholderProps) {
  return (
    <section
      data-tone="day"
      className="wrap grid min-h-[70svh] content-start gap-6 pt-[calc(var(--header-h)+env(safe-area-inset-top,0px)+clamp(64px,12vh,140px))] pb-[clamp(72px,12vh,140px)]"
    >
      <h1 ref={headingRef} tabIndex={-1} className="display max-w-[12em] h-lg outline-none">
        {title}
      </h1>
      <p className="lead muted">{lead}</p>
      {children}
    </section>
  );
}
