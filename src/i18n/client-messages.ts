/* The messages the browser receives. Server Components translate on the server with the whole
   catalogue; NextIntlClientProvider passes only the namespaces Client Components use, so the rest
   stays out of every page's payload (docs/spikes/tbt.md). tests/unit/client-messages.test.ts fails
   when a Client Component translates with a namespace missing here. */
import type { AbstractIntlMessages } from "next-intl";

/** Loader: loader. LocaleSwitch: common. */
export const CLIENT_NAMESPACES = ["loader", "common"] as const;

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  return Object.fromEntries(
    CLIENT_NAMESPACES.flatMap((ns) => {
      const value = messages[ns];
      return value === undefined ? [] : [[ns, value]];
    }),
  );
}
