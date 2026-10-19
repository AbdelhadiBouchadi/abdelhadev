import { notFound } from "next/navigation";
import { ogCard } from "@/components/brand/og-card";
import { routing } from "@/i18n/routing";
import { ogCardName, ogCopy, ogLocale, ogPageOf, ogPages } from "@/lib/og";

// Rendered with next/og once at build. Any other name is a 404.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    ogPages().map((page) => ({ locale, card: ogCardName(page) })),
  );
}

export async function GET(_: Request, { params }: RouteContext<"/[locale]/og/[card]">) {
  const { locale, card } = await params;
  const page = ogPageOf(card);
  if (!page) notFound();
  return ogCard(await ogCopy(ogLocale(locale), page));
}
