import { linkedinBanner } from "@/components/brand/linkedin-banner";

// Rendered with next/og once at build: /brand/linkedin-banner.png, to download and upload to LinkedIn.
export const dynamic = "force-static";

export function GET() {
  return linkedinBanner();
}
