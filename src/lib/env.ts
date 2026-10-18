/* Server environment, parsed once with zod. Importing this module from a Client Component fails
   the build (server-only), so server values never reach the browser. src/instrumentation.ts
   imports it when the server starts, so a bad production configuration stops the app at boot
   instead of at the first message. */
import "server-only";
import { z } from "zod";

/** Until the owner has verified abdelhadev.me in Resend, mail goes out from Resend's own domain. */
export const DEFAULT_CONTACT_FROM = "Abdelhadev <onboarding@resend.dev>";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    REQUIRE_CONTENT: z.enum(["0", "1"]).optional(),
    // Contact form (prompt 07). Required in production (below), optional elsewhere.
    RESEND_API_KEY: z.string().min(1).optional(),
    /** The private inbox that receives the form. Never published. */
    CONTACT_TO: z.email().optional(),
    /** "Name <address>" as Resend expects it. */
    CONTACT_FROM: z.string().min(3).default(DEFAULT_CONTACT_FROM),
    ARCJET_KEY: z.string().min(1).optional(),
    /** 1: the form validates and reports success without calling Resend or Arcjet (tests). */
    CONTACT_DRY_RUN: z.enum(["0", "1"]).default("0"),
  })
  .superRefine((value, ctx) => {
    if (value.VERCEL_ENV !== "production") return;
    if (value.CONTACT_DRY_RUN === "1") {
      ctx.addIssue({
        code: "custom",
        path: ["CONTACT_DRY_RUN"],
        message:
          "CONTACT_DRY_RUN=1 is not allowed in production: the contact form would report success without sending anything. Remove the variable from the production environment.",
      });
    }
    for (const name of ["RESEND_API_KEY", "CONTACT_TO", "ARCJET_KEY"] as const) {
      if (value[name] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [name],
          message: `${name} is required in production (the contact form cannot run without it).`,
        });
      }
    }
  });

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  // Empty strings (an unset name in .env files) mean "not set".
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ""));
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    // Names and rules only: the issues never echo a value.
    const lines = result.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment:\n${lines.join("\n")}`);
  }
  return result.data;
}

export const env: Env = parseEnv(process.env);
