/* The quiet link under the project list (08c): the owner's GitHub profile, from lib/site.ts. It
   leaves the site in a new tab, says so to assistive technology, and is server-rendered (a plain
   anchor, no curtain). The text link is 48 px tall (textLinkClass). */
import { getTranslations } from "next-intl/server";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SITE } from "@/lib/site";

export async function MoreOnGitHub() {
  const t = await getTranslations("work");
  const footer = await getTranslations("footer");

  return (
    <p className="work-more">
      <ArrowLink
        as="a"
        variant="external"
        href={SITE.github}
        target="_blank"
        rel="noopener noreferrer"
        data-github=""
      >
        {t("github")}
        <span className="sr"> ({footer("newTab")})</span>
      </ArrowLink>
    </p>
  );
}
