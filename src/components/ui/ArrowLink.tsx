/* The prototype's .link and .back-link as one component, with a lucide-react arrow.
   - `forward` (.link): underlined secondary link, arrow after the label.
   - `back` (.back-link): quiet link, arrow before the label (the case study's "All projects").
   - `external`: .link with an up-right arrow, for links that leave the site.

   ui may import lib only (docs/architecture.md, "Import boundaries"), so the link element is
   passed in with `as`: TransitionLink for internal links (the route curtain and localised
   pathnames through @/i18n/navigation), "a" for external ones. The arrow is decorative. */
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { textLinkClass } from "@/components/ui/Button";

export type ArrowLinkVariant = "forward" | "back" | "external";

export type ArrowLinkProps<C extends ElementType> = {
  as: C;
  variant?: ArrowLinkVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<C>, "as" | "className" | "children">;

const backClass =
  "inline-flex min-h-11 items-center gap-2.5 text-[15px] no-underline muted transition-colors duration-(--dur-quick) ease-warm hover:text-ink night:hover:text-moon";

const ICON = { forward: ArrowRight, back: ArrowLeft, external: ArrowUpRight } as const;

export function ArrowLink<C extends ElementType>({
  as,
  variant = "forward",
  className,
  children,
  ...props
}: ArrowLinkProps<C>) {
  // Widened to a plain element type: the props were checked against C in ArrowLinkProps above.
  const Link: ElementType = as;
  const Icon = ICON[variant];
  const icon = <Icon aria-hidden="true" className="size-4 flex-none" strokeWidth={2} />;
  return (
    <Link
      {...props}
      className={cn(variant === "back" ? backClass : cn(textLinkClass, "gap-2"), className)}
    >
      {variant === "back" ? icon : null}
      {children}
      {variant === "back" ? null : icon}
    </Link>
  );
}
