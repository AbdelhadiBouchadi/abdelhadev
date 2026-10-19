import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Adaptation } from "@/components/sections/case/Adaptation";
import { Architecture } from "@/components/sections/case/Architecture";
import { CaseHero } from "@/components/sections/case/CaseHero";
import { CaseProblem } from "@/components/sections/case/CaseProblem";
import { caseCopy } from "@/components/sections/case/case-copy";
import { NextProject } from "@/components/sections/case/NextProject";
import { ProductTour } from "@/components/sections/case/ProductTour";
import { JsonLd } from "@/components/ui/JsonLd";
import { resolveLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/routing";
import { getCaseStudy } from "@/lib/content/case-studies";
import { caseStudyProjects } from "@/lib/content/projects";
import { caseMetadata, workBreadcrumb } from "@/lib/seo";

// Only the public projects with a case study have a page (decision P7, caseStudyProjects); any
// other slug, a project without a case study or with a pending permission, is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudyProjects().map(({ slug }) => ({ slug }));
}

async function load(locale: Locale, slug: string) {
  const project = caseStudyProjects().find((p) => p.slug === slug);
  const study = getCaseStudy(slug);
  if (!project || !study) notFound();
  return { project, study, copy: await caseCopy(locale, slug) };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/work/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  await load(locale, slug);
  return caseMetadata(locale, slug);
}

// Tones: hero night, problem, tour and adaptation day, architecture night, next project day,
// then the night footer with the product's call to action (the @footer slot).
export default async function CaseStudyPage({ params }: PageProps<"/[locale]/work/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const { project, study, copy } = await load(locale, slug);
  return (
    <>
      <JsonLd data={await workBreadcrumb(locale, { slug, name: copy.name })} />
      <CaseHero project={project} study={study} copy={copy} />
      <CaseProblem copy={copy} />
      <ProductTour slug={slug} study={study} copy={copy} />
      <Adaptation study={study} copy={copy} />
      <Architecture study={study} copy={copy} />
      <NextProject slug={slug} />
    </>
  );
}
