/* Formatted after mount, so the server HTML never disagrees with the browser. */
import { SITE } from "@/lib/site";

export const CLOCK_REFRESH_MS = 30_000;

export const CLOCK_PLACEHOLDER = "--:--";

export function formatClock(date: Date, timeZone: string = SITE.timeZone): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
  } catch {
    // An unknown time zone in an old engine: show nothing rather than a wrong time.
    return CLOCK_PLACEHOLDER;
  }
}
