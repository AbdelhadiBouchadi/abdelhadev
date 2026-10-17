/* The site header (decision D8, prototype .site-header): the brand left, the pill nav in the
   centre, the Agadir clock, the locale switch and the Contact button right. Under 761 px only the
   brand and Contact stay; the rest of the navigation moves to the floating pill (MobileNav).
   Server-rendered; the client leaves are the links (current page), the clock, the locale switch
   and the hide-on-scroll behaviour. It follows the tone of the section under it (data-shell). */
import { getTranslations } from "next-intl/server";
import { Mark } from "@/components/brand/Mark";
import { Clock } from "@/components/layout/Clock";
import { HeaderBehavior } from "@/components/layout/HeaderBehavior";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";
import { NavLink } from "@/components/layout/NavLink";
import { buttonClass, buttonSize, SunDot } from "@/components/ui/Button";
import { SITE } from "@/lib/site";
import { SHELL_CONTENT_ATTR } from "@/lib/shell";
import { SHELL_ATTR } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/primitives/TransitionLink";

const content = { [SHELL_CONTENT_ATTR]: "" };
const shell = { [SHELL_ATTR]: "" };

export async function Header() {
  const t = await getTranslations("nav");
  const cursor = await getTranslations("cursor");
  return (
    <header className="site-header" data-tone="day" {...shell} {...content}>
      <HeaderBehavior />
      <div className="site-header-row wrap">
        <TransitionLink
          href="/"
          className="brand"
          aria-label={t("brandLabel", { brand: SITE.brand })}
        >
          <Mark className="size-7" />
          <span>{SITE.brand}</span>
        </TransitionLink>
        <nav className="nav-pill" aria-label={t("label")}>
          <NavLink href="/">{t("home")}</NavLink>
          <NavLink href="/work" nested>
            {t("work")}
          </NavLink>
          <NavLink href="/about">{t("about")}</NavLink>
        </nav>
        <div className="header-end">
          <span className="clock-chip">
            {SITE.city} <Clock />
          </span>
          <LocaleSwitch className="header-locale" />
          <NavLink
            href="/contact"
            className={cn(buttonClass, buttonSize.sm)}
            data-cursor={cursor("write")}
          >
            <SunDot />
            {t("contact")}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
