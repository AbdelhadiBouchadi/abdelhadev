import { getTranslations } from "next-intl/server";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

// Requests outside any locale that the proxy does not redirect (paths with a file extension).
// There is no locale to read, so it renders in the default locale.
export default async function GlobalNotFound() {
  const locale = routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "pages.notFound" });
  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <main id="main">
          <PagePlaceholder title={t("title")} lead={t("lead")}>
            <p className="m-0">
              {/* A plain link: this page sits outside the localised layout and its providers. */}
              <a href={`/${locale}`} className="font-semibold underline underline-offset-4">
                {t("back")}
              </a>
            </p>
          </PagePlaceholder>
        </main>
      </body>
    </html>
  );
}
