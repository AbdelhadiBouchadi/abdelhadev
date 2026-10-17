/* Placeholder page body: one heading and one sentence, until the page's own branch replaces it. */
import type { ReactNode } from "react";

export interface PagePlaceholderProps {
  title: string;
  lead: string;
  children?: ReactNode;
}

export function PagePlaceholder({ title, lead, children }: PagePlaceholderProps) {
  return (
    <section
      data-tone="day"
      className="wrap grid min-h-[70svh] content-start gap-6 pt-[calc(var(--header-h)+env(safe-area-inset-top,0px)+clamp(64px,12vh,140px))] pb-[clamp(72px,12vh,140px)]"
    >
      <h1 tabIndex={-1} className="display max-w-[12em] h-lg outline-none">
        {title}
      </h1>
      <p className="lead muted">{lead}</p>
      {children}
    </section>
  );
}
