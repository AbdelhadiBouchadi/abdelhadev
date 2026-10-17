/* Next 16 request interceptor (decision T4). `/` and unprefixed paths redirect to a locale:
   the NEXT_LOCALE cookie first, then Accept-Language, then `fr` (next-intl locale detection). */
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next and Vercel internals, and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
