/* Arcjet failing (network, quota, a bad key) never blocks a visitor: the guard fails open and logs
   it without personal data. */
import "server-only";
import arcjet, { detectBot, request, slidingWindow } from "@arcjet/next";

/** About five messages an hour per IP address. */
export const CONTACT_RATE = { max: 5, interval: "1h" } as const;

export type GuardVerdict = "allow" | "rateLimit" | "bot";

export interface Guard {
  check(): Promise<GuardVerdict>;
}

export function createArcjetGuard(key: string, log: (line: string) => void): Guard {
  const aj = arcjet({
    key,
    // Tracked by IP address (Arcjet's default characteristic); the address is never stored here.
    rules: [
      slidingWindow({ mode: "LIVE", interval: CONTACT_RATE.interval, max: CONTACT_RATE.max }),
      // Browsers only: every automated client would be refused. Search engines never post this form.
      // DRY_RUN until I have read the Arcjet dashboard for a while.
      detectBot({ mode: "DRY_RUN", allow: [] }),
    ],
  });
  return {
    async check() {
      try {
        const decision = await aj.protect(await request());
        if (decision.isErrored()) {
          log("contact: arcjet errored, failing open");
          return "allow";
        }
        if (!decision.isDenied()) return "allow";
        // Only the two rules above can deny; anything else is treated as automated.
        return decision.reason.isRateLimit() ? "rateLimit" : "bot";
      } catch {
        log("contact: arcjet threw, failing open");
        return "allow";
      }
    },
  };
}
