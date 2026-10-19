import type { Metadata } from "next";
import { AboutHero } from "@/components/sections/about/AboutHero";
import { Chapters } from "@/components/sections/about/Chapters";
import { Experience } from "@/components/sections/about/Experience";
import { Process } from "@/components/sections/about/Process";
import { RightNow } from "@/components/sections/about/RightNow";
import { Services } from "@/components/sections/about/Services";
import { Stack } from "@/components/sections/about/Stack";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata(locale, "about");
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = await resolveLocale(params);
  return (
    <>
      <AboutHero />
      <Chapters />
      <Services />
      <Process />
      <Experience locale={locale} />
      <Stack />
      <RightNow />
    </>
  );
}
