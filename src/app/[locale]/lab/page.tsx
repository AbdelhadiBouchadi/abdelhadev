import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LabIntro } from "@/components/sections/lab/LabIntro";
import { LabSections } from "@/components/sections/lab/LabSections";
import { LabShell } from "@/components/sections/lab/LabShell";
import { resolveLocale } from "@/i18n/locale";
import { env } from "@/lib/env";
import { textLinkClass } from "@/components/ui/Button";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

// Temporary (removed in 03): never in production, never indexed, not in the sitemap.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LabPage({ params }: PageProps<"/[locale]/lab">) {
  if (env.VERCEL_ENV === "production") notFound();
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.lab" });
  return (
    <>
      <ToneSection
        tone="day"
        className="wrap grid min-h-[70svh] content-start gap-6 pt-[calc(var(--header-h)+env(safe-area-inset-top,0px)+clamp(64px,12vh,140px))] pb-[clamp(72px,12vh,140px)]"
      >
        <LabIntro />
        <h1 tabIndex={-1} className="display max-w-[12em] h-lg outline-none">
          {t("title")}
        </h1>
        <p className="lead muted" data-intro>
          {t("lead")}
        </p>
        <h2 className="display h-sm" data-intro>
          {t("shell")}
        </h2>
        <p className="m-0">
          <TransitionLink href="/lab" hash="lab-night" className={textLinkClass}>
            {t("jumpToNight")}
          </TransitionLink>
        </p>
      </ToneSection>
      <LabShell />
      <LabSections />
    </>
  );
}
