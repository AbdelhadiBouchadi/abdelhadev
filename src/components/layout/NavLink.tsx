"use client";

/* A shell link that knows whether it points at the current page. `aria-current="page"` on its own
   page; with `nested`, a page below it (a case study under Work) gets `aria-current="true"`, which
   the prototype styles the same way (dentaflow.html marks Work). next-intl's usePathname gives the
   internal path with its params filled in ("/work/dentaflow"). */
import { usePathname } from "@/i18n/navigation";
import { TransitionLink, type TransitionLinkProps } from "@/primitives/TransitionLink";

export interface NavLinkProps extends TransitionLinkProps {
  /** Pages below this link's path count as its section. */
  nested?: boolean;
}

export function NavLink({ href, nested = false, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const own: string = typeof href === "string" ? href : href.pathname;
  const current =
    pathname === own ? "page" : nested && pathname.startsWith(`${own}/`) ? "true" : undefined;
  return <TransitionLink href={href} aria-current={current} {...props} />;
}
