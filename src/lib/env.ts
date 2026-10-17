/* Server environment, parsed once with zod. Importing this module from a Client Component fails
   the build (server-only), so server values never reach the browser. */
import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  REQUIRE_CONTENT: z.enum(["0", "1"]).optional(),
  // Contact form (prompt 07): optional until then.
  RESEND_API_KEY: z.string().min(1).optional(),
  CONTACT_TO_EMAIL: z.email().optional(),
  CONTACT_FROM_EMAIL: z.email().optional(),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  // Empty strings (an unset name in .env files) mean "not set".
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
  return schema.parse(cleaned);
}

export const env: Env = parseEnv(process.env);
