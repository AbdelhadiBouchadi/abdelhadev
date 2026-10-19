import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Dusk } from "@/components/sections/home/Dusk";
import { Featured } from "@/components/sections/home/Featured";
import { Hero } from "@/components/sections/home/Hero";
import { Manifesto } from "@/components/sections/home/Manifesto";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { resolveLocale } from "@/i18n/locale";
import { publicTestimonials } from "@/lib/content/testimonials";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return pageMetadata("/", locale, { title: t("title"), description: t("description") });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "testimonials" });
  const home = await getTranslations({ locale, namespace: "home.testimonials" });
  // Only confirmed testimonials (decision P10); with none, the section renders nothing.
  const testimonials = publicTestimonials().map(({ id }) => ({
    id,
    role: t(`${id}.role`),
    organisation: t(`${id}.organisation`),
    text: t(`${id}.text`),
  }));
  return (
    <>
      <Hero />
      <Manifesto />
      <Dusk />
      <Featured />
      <Testimonials title={home("title")} items={testimonials} />
    </>
  );
}
