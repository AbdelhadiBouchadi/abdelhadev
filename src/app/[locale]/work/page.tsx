import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.work" });
  return pageMetadata("/work", locale, { title: t("title") });
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.work" });
  return <PagePlaceholder title={t("title")} lead={t("lead")} />;
}
