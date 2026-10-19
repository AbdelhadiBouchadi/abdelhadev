import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { localizedPath } from "@/lib/paths";
import { notFoundMetadata } from "@/lib/seo";
import "@/styles/globals.css";

// Paths with a file extension skip the proxy, so there is no locale to read: default locale,
// never indexed.
export function generateMetadata(): Promise<Metadata> {
  return notFoundMetadata(routing.defaultLocale);
}

export default async function GlobalNotFound() {
  const locale = routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "pages.notFound" });
  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <main id="main">
          <PagePlaceholder title={t("title")} lead={t("lead")}>
            {/* Plain links: this page sits outside the localised layout and its providers. */}
            <p className="m-0 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href={localizedPath(locale, "/")}
                className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
              >
                {t("back")}
              </a>
              <ArrowLink as="a" href={localizedPath(locale, "/work")}>
                {t("work")}
              </ArrowLink>
            </p>
          </PagePlaceholder>
        </main>
      </body>
    </html>
  );
}
