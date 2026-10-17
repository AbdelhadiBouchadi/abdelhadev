import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return pageMetadata("/contact", locale, { title: t("title") });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return <PagePlaceholder title={t("title")} lead={t("lead")} />;
}
