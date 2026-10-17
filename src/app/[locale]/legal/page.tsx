import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { resolveLocale } from "@/i18n/locale";
import { pageMetadata } from "@/lib/seo";
import { placeName, SITE } from "@/lib/site";
import { isTodo } from "@/lib/todo";
import { ToneSection } from "@/primitives/ToneSection";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.legal" });
  return pageMetadata("/legal", locale, { title: t("title") });
}

const inlineLink = "font-semibold underline decoration-1 underline-offset-4";

function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <h2 id={id} className="display h-sm">
        {title}
      </h2>
      {children}
    </section>
  );
}

// The legal notice from docs/content.md ("Legal"). No ID, registration or ICE numbers and no street
// address of the publisher. Placeholders (the email, the retention period) stay visible until the
// owner supplies them, and site.ts keeps legalReview "pending" until the owner confirms the text.
export default async function LegalPage({ params }: PageProps<"/[locale]/legal">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.legal" });
  const name = SITE.legalName;
  const updated = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(SITE.legalUpdated));
  const email = isTodo(SITE.email) ? (
    <span>{SITE.email}</span>
  ) : (
    <a href={`mailto:${SITE.email}`} className={inlineLink}>
      {SITE.email}
    </a>
  );

  return (
    <ToneSection
      tone="day"
      className="wrap grid gap-12 pt-[calc(var(--header-h)+env(safe-area-inset-top,0px)+clamp(64px,12vh,140px))] pb-[clamp(72px,12vh,140px)]"
    >
      <div className="grid gap-6">
        <h1 tabIndex={-1} className="display max-w-[12em] h-lg outline-none">
          {t("title")}
        </h1>
        <p className="lead muted">{t("updated", { date: updated })}</p>
      </div>

      <div className="grid max-w-[65ch] gap-10 [&_p]:m-0">
        <Part id="legal-publisher" title={t("publisher.title")}>
          <p>{t("publisher.body", { name, place: placeName(locale) })}</p>
          <p>
            {t("publisher.contact")} {email}
          </p>
        </Part>

        <Part id="legal-director" title={t("director.title")}>
          <p>{t("director.body", { name })}</p>
        </Part>

        <Part id="legal-host" title={t("host.title")}>
          <p>{t("host.body", { host: SITE.host.name, address: SITE.host.address })}</p>
          <p>
            {t("host.site")}{" "}
            <a href={SITE.host.url} className={inlineLink} rel="noopener noreferrer">
              {SITE.host.url.replace(/^https:\/\//, "")}
            </a>
          </p>
        </Part>

        <Part id="legal-ip" title={t("ip.title")}>
          <p>{t("ip.body", { brand: SITE.brand })}</p>
          <p>{t("ip.names")}</p>
        </Part>

        <Part id="legal-data" title={t("data.title")}>
          <p>{t("data.collected")}</p>
          <p>{t("data.processor")}</p>
          <p>{t("data.whatsapp")}</p>
          <p>{t("data.retention", { retention: t("data.retentionValue") })}</p>
          <p>{t("data.rights")}</p>
        </Part>

        <Part id="legal-storage" title={t("storage.title")}>
          <p>{t("storage.cookies")}</p>
          <p>{t("storage.language")}</p>
          <p>{t("storage.session")}</p>
        </Part>

        <Part id="legal-links" title={t("links.title")}>
          <p>{t("links.body")}</p>
        </Part>
      </div>
    </ToneSection>
  );
}
