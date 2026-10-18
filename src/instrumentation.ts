/* Runs once when the server starts. Parsing the environment here makes a bad production
   configuration (a dry run, a missing key) stop the app at boot with the reason, instead of
   surfacing at the first message (src/lib/env.ts). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("@/lib/env");
}
