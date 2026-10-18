/* The contact form's one schema, shared by the form (client validation before posting) and the
   server action (the authority). Error messages are keys under messages `contact.form.errors`,
   so each side renders them in the page language. No server-only imports: the form bundles it. */
import { z } from "zod";
import { routing } from "@/i18n/routing";

/** The form's id: the WhatsApp card listens to it (src/components/sections/contact). */
export const CONTACT_FORM_ID = "contact-form";

/** What the visitor needs, in the owner's order (docs/content.md, "What he builds"). */
export const TOPICS = ["clinic", "ai", "shop", "website", "other"] as const;
export type Topic = (typeof TOPICS)[number];

/** The visible fields, in form order: the first invalid one takes focus. */
export const CONTACT_FIELDS = ["name", "email", "topic", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

/** messages: contact.form.errors.<key>. One message per field, whatever the rule that failed. */
export type ContactErrorKey = ContactField;

export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 120 },
  message: { min: 20, max: 3000 },
} as const;

export const contactSchema = z.object({
  name: z.string().trim().min(LIMITS.name.min, "name").max(LIMITS.name.max, "name"),
  email: z.string().trim().max(LIMITS.email.max, "email").pipe(z.email("email")),
  topic: z.enum(TOPICS, "topic"),
  message: z.string().trim().min(LIMITS.message.min, "message").max(LIMITS.message.max, "message"),
  /** The honeypot: hidden from everyone, so only a bot fills it. */
  company: z.string().max(0),
  locale: z.enum(routing.locales),
});

export type ContactData = z.infer<typeof contactSchema>;

/** What the visitor typed, kept so a failed attempt can put it back in the fields. */
export type ContactValues = Record<ContactField, string>;

export type ContactErrors = Partial<Record<ContactField, ContactErrorKey>>;

/** The form's state, returned by the action (useActionState) and rendered by the server too, so a
    post without JavaScript shows the same errors and success. */
export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; errors: ContactErrors; values: ContactValues }
  | { status: "failed"; reason: "send" | "rateLimit"; values: ContactValues }
  | { status: "sent" };

export const INITIAL_CONTACT_STATE: ContactState = { status: "idle" };

const text = (data: FormData, name: string): string => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

/** Reads the posted fields as strings (a file or a missing field reads as empty). */
export function readContactForm(data: FormData) {
  return {
    name: text(data, "name"),
    email: text(data, "email"),
    topic: text(data, "topic"),
    message: text(data, "message"),
    company: text(data, "company"),
    locale: text(data, "locale"),
  };
}

export type ContactInput = ReturnType<typeof readContactForm>;

/** One value per visible field. */
export const mapFields = <T>(read: (field: ContactField) => T): Record<ContactField, T> => ({
  name: read("name"),
  email: read("email"),
  topic: read("topic"),
  message: read("message"),
});

export const valuesOf = (input: ContactInput): ContactValues => ({
  name: input.name,
  email: input.email,
  topic: input.topic,
  message: input.message,
});

function isField(key: unknown): key is ContactField {
  return (CONTACT_FIELDS as readonly unknown[]).includes(key);
}

/** Validates the input: the data, or one error key per invalid visible field. A wrong honeypot
    or locale is not a visitor's mistake and is reported apart (`tampered`). */
export function validateContact(
  input: ContactInput,
): { ok: true; data: ContactData } | { ok: false; errors: ContactErrors; tampered: boolean } {
  const result = contactSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: ContactErrors = {};
  let tampered = false;
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (isField(field)) errors[field] ??= field;
    else tampered = true;
  }
  return { ok: false, errors, tampered };
}

/** The first invalid field in form order, the one that takes focus. */
export const firstInvalid = (errors: ContactErrors): ContactField | undefined =>
  CONTACT_FIELDS.find((field) => errors[field] !== undefined);
