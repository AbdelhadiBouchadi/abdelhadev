import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.legal" });
  return pageMetadata("/legal", locale, { title: t("title") });
}

export default async function LegalPage({ params }: PageProps<"/[locale]/legal">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.legal" });
  return <PagePlaceholder title={t("title")} lead={t("lead")} />;
}
