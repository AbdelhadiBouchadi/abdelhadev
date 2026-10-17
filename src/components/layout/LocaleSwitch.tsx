"use client";

/* The locale switch is a plain link, so switching is a full page load (decision T2): a client-side
   switch re-rendered the root layout and dropped the html classes set before paint. It is a client
   component only to read the current route; the server renders the same href, so it works
   without JavaScript. */
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { getPathname, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function LocaleSwitch({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const target: Locale = locale === "fr" ? "en" : "fr";

  const href =
    pathname === "/work/[slug]"
      ? getPathname({
          locale: target,
          href: { pathname, params: { slug: params.slug ?? "" } },
        })
      : getPathname({ locale: target, href: pathname });

  return (
    <a href={href} hrefLang={target} lang={target} className={className}>
      {t("localeSwitch")}
    </a>
  );
}
