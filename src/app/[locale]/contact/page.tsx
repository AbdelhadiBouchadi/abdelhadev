import type { Metadata } from "next";
import { ContactChannels } from "@/components/sections/contact/ContactChannels";
import { ContactFormCard } from "@/components/sections/contact/ContactFormCard";
import { ContactHero } from "@/components/sections/contact/ContactHero";
import { NextSteps } from "@/components/sections/contact/NextSteps";
import { WhatsAppCard } from "@/components/sections/contact/WhatsAppCard";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata(locale, "contact");
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = await resolveLocale(params);
  return (
    <>
      <ContactHero />
      <ContactChannels>
        <ContactFormCard locale={locale} />
        <WhatsAppCard>
          <NextSteps />
        </WhatsAppCard>
      </ContactChannels>
    </>
  );
}
