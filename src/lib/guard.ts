/* Arcjet in front of the contact form: a rate limit per IP address and bot detection. The contact
   handler depends on the `Guard` interface, so its tests pass a fake. Arcjet failing (network,
   quota, a bad key) never blocks a visitor: the guard fails open and says so in a log line that
   holds no personal data. */
import "server-only";
import arcjet, { detectBot, request, slidingWindow } from "@arcjet/next";

/** Messages one IP address may send per window (prompt 07: about five an hour). */
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
      // Flip to "LIVE" in 10-launch after reviewing the Arcjet dashboard.
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
