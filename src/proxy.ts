/* `/` and unprefixed paths redirect to a locale: the NEXT_LOCALE cookie, then Accept-Language,
   then `fr`. */
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next and Vercel internals, and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
