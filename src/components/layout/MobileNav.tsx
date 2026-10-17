/* The floating pill under 761 px (decision D8, prototype .pill): Work, the home mark, About.
   Shown and hidden by the same breakpoint as the prototype, above the bottom safe area, every tap
   target at least 44 px. Follows the section tone (data-shell). */
import { getTranslations } from "next-intl/server";
import { Mark } from "@/components/brand/Mark";
import { NavLink } from "@/components/layout/NavLink";
import { SHELL_CONTENT_ATTR } from "@/lib/shell";
import { SHELL_ATTR } from "@/lib/tone";
import { TransitionLink } from "@/primitives/TransitionLink";

const attrs = { [SHELL_CONTENT_ATTR]: "", [SHELL_ATTR]: "" };

export async function MobileNav() {
  const t = await getTranslations("nav");
  return (
    <nav className="pill" data-tone="day" aria-label={t("mobileLabel")} {...attrs}>
      <NavLink href="/work" nested>
        {t("work")}
      </NavLink>
      <TransitionLink href="/" className="pill-home" aria-label={t("home")}>
        <Mark className="size-6.5" />
      </TransitionLink>
      <NavLink href="/about">{t("about")}</NavLink>
    </nav>
  );
}
