/* Parsing the environment at startup stops a bad production config (a dry run, a missing key) at
   boot with the reason, instead of at the first message. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("@/lib/env");
}
