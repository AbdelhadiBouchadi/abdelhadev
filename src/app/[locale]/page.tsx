import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Dusk } from "@/components/sections/home/Dusk";
import { Featured } from "@/components/sections/home/Featured";
import { Hero } from "@/components/sections/home/Hero";
import { Manifesto } from "@/components/sections/home/Manifesto";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return pageMetadata("/", locale, { title: t("title"), description: t("description") });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  await resolveLocale(params);
  return (
    <>
      <Hero />
      <Manifesto />
      <Dusk />
      <Featured />
    </>
  );
}
