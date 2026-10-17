"use client";

/* Agadir local time (prototype `tick`). The server and hydration render the placeholder; the
   client time arrives right after hydration and refreshes every 30 s, so the markup never
   mismatches. */
import { useSyncExternalStore } from "react";
import { CLOCK_PLACEHOLDER, CLOCK_REFRESH_MS, formatClock } from "@/lib/clock";

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, CLOCK_REFRESH_MS);
  return () => {
    window.clearInterval(id);
  };
}

const now = () => formatClock(new Date());
const placeholder = () => CLOCK_PLACEHOLDER;

export function Clock() {
  const time = useSyncExternalStore(subscribe, now, placeholder);
  return <time className="tabular-nums">{time}</time>;
}
