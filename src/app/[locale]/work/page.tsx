import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MoreOnGitHub } from "@/components/sections/work/MoreOnGitHub";
import { ProjectList } from "@/components/sections/work/ProjectList";
import { ProjectRail } from "@/components/sections/work/ProjectRail";
import { WorkHero } from "@/components/sections/work/WorkHero";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { ToneSection } from "@/primitives/ToneSection";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "work.meta" });
  return pageMetadata("/work", locale, { title: t("title"), description: t("description") });
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "work" });
  return (
    <>
      <WorkHero />
      <ToneSection tone="day" aria-label={t("projects")}>
        <div className="work-layout wrap">
          <ProjectRail />
          <div className="work-main">
            <ProjectList />
            <MoreOnGitHub />
          </div>
        </div>
      </ToneSection>
    </>
  );
}
