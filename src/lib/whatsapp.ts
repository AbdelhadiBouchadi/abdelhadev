/* The WhatsApp composer (prototype initForms → compose): the form's fields as a message in the
   page language, URL-encoded onto the wa.me link. Pure; the wording comes in from messages
   (contact.whatsapp) as templates, so this module holds no copy. */

export interface WhatsAppCopy {
  /** "Bonjour Abdelhadi," */
  greeting: string;
  /** "Je m'appelle {name}." */
  name: string;
  /** "Mon projet : {topic}." */
  topic: string;
}

export interface WhatsAppFields {
  name?: string;
  /** The topic as the form shows it (its label, not its key). */
  topic?: string;
  message?: string;
}

const fill = (template: string, key: string, value: string) =>
  template.replaceAll(`{${key}}`, value);

/** The message: the greeting, then the name and the topic when given, then the message. */
export function composeWhatsApp(copy: WhatsAppCopy, fields: WhatsAppFields): string {
  const name = fields.name?.trim() ?? "";
  const topic = fields.topic?.trim() ?? "";
  const message = fields.message?.trim() ?? "";
  const lines = [copy.greeting];
  if (name) lines.push(fill(copy.name, "name", name));
  if (topic) lines.push(fill(copy.topic, "topic", topic));
  if (message) lines.push("", message);
  return lines.join("\n");
}

/** The wa.me link with the text, or the bare link when there is none. */
export function whatsAppHref(base: string, text?: string): string {
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
