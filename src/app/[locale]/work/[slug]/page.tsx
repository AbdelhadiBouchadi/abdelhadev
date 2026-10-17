import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { resolveLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/routing";
import { PROJECT_SLUGS } from "@/lib/content/projects";
import { pageMetadata } from "@/lib/seo";
import { isKeyOf } from "@/lib/utils";

// Case studies are statically generated from lib/content/projects.ts; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECT_SLUGS.map((slug) => ({ slug }));
}

async function projectCopy(locale: Locale, slug: string) {
  const { projects } = await getMessages({ locale });
  if (!isKeyOf(projects, slug)) notFound();
  return projects[slug];
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const copy = await projectCopy(locale, slug);
  return pageMetadata({ pathname: "/work/[slug]", params: { slug } }, locale, {
    title: copy.name,
  });
}

export default async function CaseStudyPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const copy = await projectCopy(locale, slug);
  const t = await getTranslations({ locale, namespace: "pages.case" });
  return <PagePlaceholder title={copy.name} lead={t("lead", { name: copy.name })} />;
}
