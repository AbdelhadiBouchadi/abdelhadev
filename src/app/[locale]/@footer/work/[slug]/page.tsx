import { Footer } from "@/components/layout/Footer";
import { caseCopy } from "@/components/sections/case/case-copy";
import { resolveLocale } from "@/i18n/locale";
import { caseStudyProjects } from "@/lib/content/projects";

// The case study's footer, with the product's call to action.
export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudyProjects().map(({ slug }) => ({ slug }));
}

export default async function CaseStudyFooter({ params }: PageProps<"/[locale]/work/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const copy = await caseCopy(locale, slug);
  return <Footer cta={copy.case.footer} />;
}
