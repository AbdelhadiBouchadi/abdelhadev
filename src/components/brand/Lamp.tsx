/* The mark's sun over a single bar: the lamp in a testimonial window. Always decorative. */
export interface LampProps {
  className?: string;
}

export function Lamp({ className }: LampProps) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true" focusable="false">
      <path d="M13 35a19 19 0 0 1 38 0z" className="fill-glow" />
      <rect x="6" y="36" width="52" height="4" rx="2" className="fill-majorelle" />
    </svg>
  );
}
