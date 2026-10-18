/* The localised copy of one case study (messages.projects.<slug>, with its `case` group), for the
   page, its metadata and its footer. A slug whose project has no case study copy is a 404. Both
   catalogues have the same keys (pnpm check:i18n), so the French one gives the type. */
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { isKeyOf } from "@/lib/utils";
import type fr from "@messages/fr.json";

type ProjectMessages = (typeof fr)["projects"];
/** A project's messages that carry a case study. */
export type CaseStudyCopy = Extract<ProjectMessages[keyof ProjectMessages], { case: unknown }>;

function hasCase(entry: ProjectMessages[keyof ProjectMessages]): entry is CaseStudyCopy {
  return "case" in entry;
}

export async function caseCopy(locale: Locale, slug: string): Promise<CaseStudyCopy> {
  const { projects } = await getMessages({ locale });
  const entry = isKeyOf(projects, slug) ? projects[slug] : undefined;
  if (!entry || !hasCase(entry)) notFound();
  return entry;
}

/** Looks up `key` in a group of the case study copy (tour, adapt, arch, screens), so the data's
    keys (src/lib/content/case-studies.ts) and the messages can never drift apart silently. */
export function pick<T>(group: Readonly<Record<string, T>>, key: string, where: string): T {
  const value = isKeyOf(group, key) ? group[key] : undefined;
  if (value === undefined) throw new Error(`messages: ${where}.${key} is missing`);
  return value;
}
