/* Temporary design lab (removed in 03): the tokens, type scale, brand and button, rendered from
   the real tokens so they can be compared with docs/prototype side by side. Token names and type
   class names are identifiers, not copy. */
import { getTranslations } from "next-intl/server";
import { Mark } from "@/components/brand/Mark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";

const TOKENS = {
  day: ["paper", "sheet", "sand", "sand-2", "sunset", "glow", "rose", "ink", "ink-soft", "line"],
  night: ["night", "night-2", "night-3", "moon", "moon-soft", "line-night"],
  accents: ["majorelle", "majorelle-soft", "danger"],
} as const satisfies Record<string, readonly string[]>;

const TYPE_SCALE = [
  { className: "display h-xl", spec: "h-xl clamp(44px, 8.4vw, 148px)" },
  { className: "display h-lg", spec: "h-lg clamp(38px, 6vw, 100px)" },
  { className: "display h-md", spec: "h-md clamp(30px, 3.8vw, 58px)" },
  { className: "display h-sm", spec: "h-sm clamp(24px, 2.2vw, 32px)" },
] as const;

const MARK_SIZES = ["size-7", "size-16", "size-28"] as const;
const WORDMARK_WIDTHS = ["w-40", "w-80", "w-[560px] max-w-full"] as const;

function Swatches({ names }: { names: readonly string[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 nav:grid-cols-4 split:grid-cols-5">
      {names.map((name) => (
        <li key={name} className="grid gap-2 text-sm">
          <span
            className="block h-16 rounded-media shadow-[inset_0_0_0_1px_var(--line)] night:shadow-[inset_0_0_0_1px_var(--line-night)]"
            style={{ background: `var(--${name})` }}
          />
          <code>--{name}</code>
        </li>
      ))}
    </ul>
  );
}

export async function LabSections() {
  const t = await getTranslations("pages.lab");
  const home = await getTranslations("pages.home");

  return (
    <>
      <section data-tone="day" className="wrap grid gap-6 py-16">
        <h2 className="display h-sm">{t("tokens")}</h2>
        <h3 className="m-0 text-base font-semibold">{t("day")}</h3>
        <Swatches names={[...TOKENS.day, ...TOKENS.accents]} />
      </section>
      <section data-tone="night" className="py-16">
        <div className="wrap grid gap-6">
          <h3 className="m-0 text-base font-semibold">{t("night")}</h3>
          <Swatches names={[...TOKENS.night, "glow", ...TOKENS.accents]} />
        </div>
      </section>

      <section data-tone="day" className="wrap grid gap-10 py-16">
        <h2 className="display h-sm">{t("type")}</h2>
        {TYPE_SCALE.map(({ className, spec }) => (
          <div key={spec} className="grid gap-2">
            <code className="text-sm muted">{spec}</code>
            <p className={className}>Abdelhadev</p>
          </div>
        ))}
        <div className="grid gap-2">
          <code className="text-sm muted">statement clamp(30px, 4.4vw, 66px)</code>
          <p className="statement">{home("lead")}</p>
        </div>
        <div className="grid gap-2">
          <code className="text-sm muted">lead clamp(18px, 1.4vw, 21px)</code>
          <p className="lead">{home("lead")}</p>
        </div>
        <div className="grid gap-2">
          <code className="text-sm muted">body 17px / 1.55</code>
          <p className="m-0 max-w-[65ch]">{home("lead")}</p>
        </div>
      </section>

      <section data-tone="day" className="wrap grid gap-8 py-16">
        <h2 className="display h-sm">{t("brand")}</h2>
        <div className="flex flex-wrap items-end gap-8">
          {MARK_SIZES.map((size) => (
            <Mark key={size} className={size} />
          ))}
        </div>
        <div className="grid gap-6 text-ink">
          {WORDMARK_WIDTHS.map((width) => (
            <Wordmark key={width} className={width} decorative />
          ))}
          <Wordmark />
        </div>
      </section>
      <section data-tone="night" className="py-16">
        <div className="wrap grid gap-8">
          <div className="flex flex-wrap items-end gap-8">
            {MARK_SIZES.map((size) => (
              <Mark key={size} className={size} tone="night" />
            ))}
          </div>
          <div className="grid gap-6 text-moon">
            {WORDMARK_WIDTHS.map((width) => (
              <Wordmark key={width} className={width} decorative />
            ))}
            <Wordmark className="text-glow" decorative />
          </div>
        </div>
      </section>

      <section data-tone="day" className="wrap grid gap-6 py-16">
        <h2 className="display h-sm">{t("buttons")}</h2>
        <div>
          <Button>{t("button")}</Button>
        </div>
      </section>
      <section data-tone="night" className="py-16">
        <div className="wrap">
          <Button>{t("button")}</Button>
        </div>
      </section>
    </>
  );
}
