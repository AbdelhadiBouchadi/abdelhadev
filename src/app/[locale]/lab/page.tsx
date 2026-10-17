import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LabSections } from "@/components/sections/lab/LabSections";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { resolveLocale } from "@/i18n/locale";
import { env } from "@/lib/env";

// Temporary (removed in 03): never in production, never indexed, not in the sitemap.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LabPage({ params }: PageProps<"/[locale]/lab">) {
  if (env.VERCEL_ENV === "production") notFound();
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.lab" });
  return (
    <>
      <PagePlaceholder title={t("title")} lead={t("lead")} />
      <LabSections />
    </>
  );
}
