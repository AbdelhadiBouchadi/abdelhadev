/* The site footer (prototype .site-footer), night tone, on every page: the call to action, the
   Contact button (magnetic) and the link to the work, four columns (pages, elsewhere, Agadir with
   the live time, legal), and the giant wordmark fitted to the column.

   The legal name is plain, server-rendered text here on every page (AGENTS.md, "Content, identity
   and legal"). A channel the owner has not supplied yet shows its visible placeholder, never an
   empty link; the build lists it (scripts/report-todos.mjs). The copy makes no availability or
   client claims (decision P6). */
import { getLocale, getTranslations } from "next-intl/server";
import { Clock } from "@/components/layout/Clock";
import { FooterMotion } from "@/components/layout/FooterMotion";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { NavLink } from "@/components/layout/NavLink";
import { buttonClass, buttonSize, SunDot, textLinkClass } from "@/components/ui/Button";
import { SHELL_CONTENT_ATTR } from "@/lib/shell";
import { placeName, SITE } from "@/lib/site";
import { isTodo } from "@/lib/todo";
import { cn } from "@/lib/utils";
import { FitText } from "@/primitives/FitText";
import { Magnetic } from "@/primitives/Magnetic";
import { ToneSection } from "@/primitives/ToneSection";
import { TransitionLink } from "@/primitives/TransitionLink";

const content = { [SHELL_CONTENT_ATTR]: "" };

const colHeading = "m-0 mb-1.5 font-text text-[13px] leading-[1.4] font-semibold text-moon";
const colLink =
  "inline-flex min-h-11 items-center no-underline transition-colors duration-(--dur-quick) ease-warm hover:text-moon hover:underline hover:underline-offset-[5px]";
const colList = "m-0 grid list-none p-0";

const CHANNELS = [
  { key: "linkedin", label: "LinkedIn", value: SITE.linkedin },
  { key: "github", label: "GitHub", value: SITE.github },
] as const;

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const cursor = await getTranslations("cursor");
  const locale = await getLocale();
  const year = new Date().getFullYear();

  return (
    <ToneSection as="footer" tone="night" className="site-footer overflow-hidden" {...content}>
      <FooterMotion />
      <div className="wrap">
        <div className="grid gap-7 pt-[clamp(96px,16vh,180px)] pb-[clamp(48px,8vh,96px)]">
          <h2 className="display max-w-[14em] h-lg" data-footer-cta>
            {t("cta")}
          </h2>
          <div className="flex flex-wrap items-center gap-5.5">
            <Magnetic>
              <NavLink
                href="/contact"
                className={cn(buttonClass, buttonSize.xl)}
                data-cursor={cursor("write")}
              >
                <SunDot />
                {nav("contact")}
              </NavLink>
            </Magnetic>
            <TransitionLink href="/work" className={textLinkClass}>
              {t("seeWork")}
            </TransitionLink>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 border-t border-line-night py-7 text-sm text-moon-soft max-nav:pb-[calc(96px+env(safe-area-inset-bottom,0px))] nav:grid-cols-2 split:grid-cols-4">
          <nav aria-labelledby="footer-pages">
            <h2 id="footer-pages" className={colHeading}>
              {t("pages")}
            </h2>
            <ul className={colList}>
              <li>
                <TransitionLink href="/" className={colLink}>
                  {nav("home")}
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/work" className={colLink}>
                  {nav("work")}
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/about" className={colLink}>
                  {nav("about")}
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/contact" className={colLink}>
                  {nav("contact")}
                </TransitionLink>
              </li>
              <li>
                <TransitionLink href="/legal" className={colLink}>
                  {t("legal")}
                </TransitionLink>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className={colHeading}>{t("elsewhere")}</h2>
            <ul className={colList}>
              {CHANNELS.map(({ key, label, value }) => (
                <li key={key} className="flex min-h-11 flex-wrap items-center gap-x-2">
                  {isTodo(value) ? (
                    <>
                      <span>{label}</span>
                      <span className="text-moon">{value}</span>
                    </>
                  ) : (
                    <a href={value} className={colLink} target="_blank" rel="noopener noreferrer">
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={colHeading}>{placeName(locale)}</h2>
            <p className="m-0 flex min-h-11 items-center gap-1.5">
              {t("localTime")} <Clock />
            </p>
          </div>

          <div>
            <h2 className={colHeading}>{t("legalHeading")}</h2>
            <p className="m-0 text-moon">{t("copyright", { year, name: SITE.legalName })}</p>
            <LocaleSwitch className={colLink} />
          </div>
        </div>

        <div className="footer-word-wrap" aria-hidden="true">
          <FitText className="footer-word" data-footer-word="">
            {SITE.brand}
          </FitText>
        </div>
      </div>
    </ToneSection>
  );
}
