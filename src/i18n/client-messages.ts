/* Only the namespaces Client Components use, so the rest stays out of every page's payload.
   tests/unit/client-messages.test.ts fails when one is missing here. */
import type { AbstractIntlMessages } from "next-intl";

/** Loader: loader. LocaleSwitch: common. [locale]/error.tsx: errors. */
export const CLIENT_NAMESPACES = ["loader", "common", "errors"] as const;

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  return Object.fromEntries(
    CLIENT_NAMESPACES.flatMap((ns) => {
      const value = messages[ns];
      return value === undefined ? [] : [[ns, value]];
    }),
  );
}
