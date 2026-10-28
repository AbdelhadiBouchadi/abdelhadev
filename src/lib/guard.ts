/* Arcjet failing (network, quota, a bad key) never blocks a visitor: the guard fails open and logs
   it without personal data. */
import "server-only";
import arcjet, { detectBot, request, slidingWindow } from "@arcjet/next";
import type { ArcjetMode } from "@/lib/env";

/** About five messages an hour per IP address. */
export const CONTACT_RATE = { max: 5, interval: "1h" } as const;

/**
 * `other` is a denial from neither rule below, such as a rule set in the Arcjet dashboard.
 * `detail` holds Arcjet's reason type, conclusion, denied bot names and decision id, never the IP.
 */
export type GuardVerdict =
  { verdict: "allow" } | { verdict: "rateLimit" | "bot" | "other"; detail: string };

export interface Guard {
  check(): Promise<GuardVerdict>;
}

export function createArcjetGuard(
  key: string,
  botMode: ArcjetMode,
  log: (line: string) => void,
): Guard {
  const aj = arcjet({
    key,
    // Tracked by IP address (Arcjet's default characteristic); the address is never stored here.
    rules: [
      slidingWindow({ mode: "LIVE", interval: CONTACT_RATE.interval, max: CONTACT_RATE.max }),
      // Browsers only: every automated client is refused. Search engines never post this form.
      detectBot({ mode: botMode, allow: [] }),
    ],
  });
  return {
    async check() {
      try {
        const decision = await aj.protect(await request());
        if (decision.isErrored()) {
          log("contact: arcjet errored, failing open");
          return { verdict: "allow" };
        }
        if (!decision.isDenied()) return { verdict: "allow" };
        const { reason } = decision;
        const detail = [`arcjet=${reason.type ?? "UNKNOWN"}`, `conclusion=${decision.conclusion}`];
        if (reason.isBot()) {
          detail.push(`denied=${reason.denied.join(",") || "none"}`, `spoofed=${reason.spoofed}`);
        }
        // Finds the request in the Arcjet dashboard.
        detail.push(`id=${decision.id}`);
        const verdict = reason.isRateLimit() ? "rateLimit" : reason.isBot() ? "bot" : "other";
        return { verdict, detail: detail.join(" ") };
      } catch {
        log("contact: arcjet threw, failing open");
        return { verdict: "allow" };
      }
    },
  };
}
