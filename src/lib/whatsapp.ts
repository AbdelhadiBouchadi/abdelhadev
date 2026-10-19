/* Pure: the wording comes from messages (contact.whatsapp) as templates, so this module holds no
   copy. */

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
  /** Its label, not its key. */
  topic?: string;
  message?: string;
}

const fill = (template: string, key: string, value: string) =>
  template.replaceAll(`{${key}}`, value);

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

export function whatsAppHref(base: string, text?: string): string {
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
