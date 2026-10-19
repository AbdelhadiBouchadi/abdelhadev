/* Chips marks every [TODO: …] label as todo by itself, so an unconfirmed fact never passes for a
   real one. */
import type { ComponentPropsWithoutRef } from "react";
import { isTodo } from "@/lib/todo";
import { cn } from "@/lib/utils";

export type ChipVariant = "default" | "warm" | "todo";

export interface ChipProps extends ComponentPropsWithoutRef<"span"> {
  variant?: ChipVariant;
}

export function Chip({ variant = "default", className, ...props }: ChipProps) {
  return <span {...props} className={cn("chip", className)} data-variant={variant} />;
}

export type ChipItem = string | { label: string; variant?: ChipVariant };

export interface ChipsProps extends Omit<ComponentPropsWithoutRef<"ul">, "children"> {
  items: readonly ChipItem[];
}

export function Chips({ items, className, ...props }: ChipsProps) {
  return (
    <ul {...props} className={cn("chips", className)}>
      {items.map((item) => {
        const { label, variant } =
          typeof item === "string" ? { label: item, variant: undefined } : item;
        return (
          <li key={label}>
            <Chip variant={variant ?? (isTodo(label) ? "todo" : "default")}>{label}</Chip>
          </li>
        );
      })}
    </ul>
  );
}
