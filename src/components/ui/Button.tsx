/* Prototype .btn: espresso pill on day, glow on night; the hover fill sweeps up from the bottom
   (Majorelle on day, moon on night) and the sun dot lifts. Tone comes from the nearest
   [data-tone="night"] ancestor, as in the prototype. */
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonClass = cn(
  "group relative isolate inline-flex min-h-12 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-pill border-0 bg-ink px-[22px] font-text text-[15px] leading-none font-semibold whitespace-nowrap text-paper no-underline",
  "transition-colors duration-(--dur-hover) ease-warm hover:text-sheet",
  "before:absolute before:inset-0 before:-z-1 before:translate-y-[101%] before:rounded-[inherit] before:bg-majorelle before:transition-transform before:duration-(--dur-base) before:ease-warm before:content-[''] hover:before:translate-y-0",
  "night:bg-glow night:text-night night:before:bg-moon night:hover:text-night",
);

/** Prototype .btn-sm (header) and .btn-xl (footer call to action); merge after buttonClass. */
export const buttonSize = {
  sm: "min-h-11 px-[18px] text-[14px]",
  md: "",
  xl: "min-h-16 px-[30px] text-[17px]",
} as const;

/** Prototype .link: the secondary text link next to a button. */
export const textLinkClass =
  "inline-flex min-h-12 items-center text-[15px] font-semibold underline decoration-[color-mix(in_srgb,currentColor_35%,transparent)] decoration-[1.5px] underline-offset-[6px] transition-[text-decoration-color] duration-(--dur-quick) ease-warm hover:decoration-current";

export function SunDot() {
  return (
    <span
      aria-hidden="true"
      className="size-[9px] flex-none rounded-pill bg-glow transition-transform duration-(--dur-base) ease-warm group-hover:-translate-y-0.5 group-hover:scale-115 night:bg-night"
    />
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  sun?: boolean;
}

export function Button({
  sun = true,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    // eslint-disable-next-line react/button-has-type -- `type` defaults to "button" above.
    <button type={type} className={cn(buttonClass, className)} {...props}>
      {sun ? <SunDot /> : null}
      {children}
    </button>
  );
}
