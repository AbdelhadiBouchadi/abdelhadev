/* Read from about.process so the two pages never disagree. */
import { getTranslations } from "next-intl/server";
import { PROCESS } from "@/lib/content/about";

/** Delivery belongs to the about page's full process. */
const SHOWN = PROCESS.slice(0, 4);

export async function NextSteps() {
  const t = await getTranslations("contact.next");
  const steps = await getTranslations("about.process.steps");
  return (
    <div className="grid gap-3.5">
      <h3 className="next-title">{t("title")}</h3>
      <ol className="next-steps">
        {SHOWN.map((key) => (
          <li key={key}>
            <p>
              <strong>{steps(`${key}.title`)}</strong>
              {steps(`${key}.text`)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
