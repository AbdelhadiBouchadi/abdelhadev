"use client";

/* next-intl's Link with the route curtain. Without JavaScript (or outside the provider) it is a
   plain localised link, hash included. The curtain leaves alone: modified and middle clicks,
   target="_blank", downloads, and external, mailto: and tel: links (lib/links.ts). */
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { shouldTransition } from "@/lib/links";
import { useRouteTransition, type TransitionHref } from "@/primitives/TransitionProvider";

type LinkProps = ComponentProps<typeof Link>;

export interface TransitionLinkProps extends Omit<LinkProps, "href"> {
  href: TransitionHref;
  /** A fragment on the target page, without "#". */
  hash?: string;
}

function withHash(href: TransitionHref, hash: string | undefined): LinkProps["href"] {
  if (!hash) return href;
  return typeof href === "string" ? { pathname: href, hash } : { ...href, hash };
}

export function TransitionLink({ href, hash, onClick, ...props }: TransitionLinkProps) {
  const transition = useRouteTransition();
  return (
    <Link
      {...props}
      href={withHash(href, hash)}
      onClick={(e) => {
        onClick?.(e);
        if (!transition) return;
        const a = e.currentTarget;
        const anchor = {
          href: a.getAttribute("href") ?? "",
          target: a.target,
          download: a.hasAttribute("download"),
        };
        if (!shouldTransition(e, anchor)) return;
        e.preventDefault();
        transition.navigate(href, hash);
      }}
    />
  );
}
