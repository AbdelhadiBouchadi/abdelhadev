import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LabBench } from "@/components/sections/lab/LabBench";
import { textLinkClass } from "@/components/ui/Button";
import { resolveLocale } from "@/i18n/locale";
import { env } from "@/lib/env";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

// Temporary (removed in 05): never in production, never indexed, not in the sitemap. Since 03 it
// shows only the primitives no real page uses yet; the home page exercises the others.
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
        <h1 tabIndex={-1} className="display max-w-[12em] h-lg outline-none">
          {t("title")}
        </h1>
        <p className="lead muted">{t("lead")}</p>
        <p className="m-0">
          <TransitionLink href="/lab" hash="lab-night" className={textLinkClass}>
            {t("jumpToNight")}
          </TransitionLink>
        </p>
      </ToneSection>
      <LabBench />
    </>
  );
}
