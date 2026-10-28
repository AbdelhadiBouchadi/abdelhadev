/* server-only: importing this from a Client Component fails the build. src/instrumentation.ts
   imports it at startup, so a bad production config stops the app at boot, not at the first
   message. */
import "server-only";
import { z } from "zod";
import { SITE } from "@/lib/site";

/** The domain verified in Resend. */
const MAIL_DOMAIN = new URL(SITE.url).hostname;

/** "Name <address>" or a bare address. */
const addressOf = (from: string) => (/<([^<>]+)>\s*$/.exec(from)?.[1] ?? from).trim();

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    REQUIRE_CONTENT: z.enum(["0", "1"]).optional(),
    // Contact form: required in production (below), optional elsewhere.
    RESEND_API_KEY: z.string().min(1).optional(),
    CONTACT_TO: z.email().optional(),
    /** "Name <address>", as Resend expects it. One line: it becomes a mail header. */
    CONTACT_FROM: z
      .string()
      .min(3)
      .regex(/^[^\r\n]+$/)
      .optional(),
    ARCJET_KEY: z.string().min(1).optional(),
    /** 1: validate and report success without calling Resend or Arcjet (tests only). */
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
    for (const name of ["RESEND_API_KEY", "CONTACT_TO", "CONTACT_FROM", "ARCJET_KEY"] as const) {
      if (value[name] === undefined) {
        ctx.addIssue({
          code: "custom",
          path: [name],
          message: `${name} is required in production (the contact form cannot run without it).`,
        });
      }
    }
    if (value.CONTACT_FROM && !addressOf(value.CONTACT_FROM).endsWith(`@${MAIL_DOMAIN}`)) {
      ctx.addIssue({
        code: "custom",
        path: ["CONTACT_FROM"],
        message: `CONTACT_FROM must be an address on ${MAIL_DOMAIN} in production (the domain verified in Resend).`,
      });
    }
  });

export type Env = z.infer<typeof schema>;

export type ArcjetMode = "LIVE" | "DRY_RUN";

/** Arcjet blocks only on the production deployment; previews and local runs just log. */
export const arcjetMode = (vercelEnv: Env["VERCEL_ENV"]): ArcjetMode =>
  vercelEnv === "production" ? "LIVE" : "DRY_RUN";

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
