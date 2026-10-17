"use client";

/* The locale switch is a plain link, so switching is a full page load (decision T2): a client-side
   switch re-rendered the root layout and dropped the html classes set before paint. It is a client
   component only to read the current route; the server renders the same href, so it works
   without JavaScript. Visible as "FR / EN" with the current locale marked; the accessible name
   adds the target language in that language. */
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface LocaleSwitchProps {
  className?: string;
}

export function LocaleSwitch({ className }: LocaleSwitchProps) {
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
    <a href={href} hrefLang={target} className={cn("locale-switch", className)}>
      {/* One inline run: as separate flex items the spaces around "/" would be trimmed. */}
      <span>
        {routing.locales.map((l, i) => (
          <span key={l}>
            {i > 0 ? " / " : null}
            <span data-current={l === locale ? "" : undefined}>{l.toUpperCase()}</span>
          </span>
        ))}
        <span className="sr" lang={target}>
          {" "}
          {t("localeSwitch")}
        </span>
      </span>
    </a>
  );
}
