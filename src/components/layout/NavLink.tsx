"use client";

/* With `nested`, a page below it (a case study under Work) gets aria-current="true". */
import { usePathname } from "@/i18n/navigation";
import { TransitionLink, type TransitionLinkProps } from "@/primitives/TransitionLink";

export interface NavLinkProps extends TransitionLinkProps {
  nested?: boolean;
}

export function NavLink({ href, nested = false, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const own: string = typeof href === "string" ? href : href.pathname;
  const current =
    pathname === own ? "page" : nested && pathname.startsWith(`${own}/`) ? "true" : undefined;
  return <TransitionLink href={href} aria-current={current} {...props} />;
}
