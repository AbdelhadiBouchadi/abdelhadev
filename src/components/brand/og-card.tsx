/* The fonts are static WOFF files in src/assets/og/ (next/og cannot read WOFF2), read from the
   repository so the build makes no network call. */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_SIZE, type OgCopy } from "@/lib/og";
import { SITE } from "@/lib/site";
import { cssToken } from "@/lib/tokens";

const FONTS_DIR = join(process.cwd(), "src/assets/og");
const fonts = Promise.all([
  readFile(join(FONTS_DIR, "BricolageGrotesque-Bold.woff")),
  readFile(join(FONTS_DIR, "InstrumentSans-Medium.woff")),
]);

/** px on the 1200 x 630 card. */
const SUN = 440;
const HORIZON_Y = 452;
const SUN_X = 742;

export async function ogCard({ title, line }: Pick<OgCopy, "title" | "line">): Promise<ImageResponse> {
  const [display, text] = await fonts;
  const c = {
    night: cssToken("night"),
    night2: cssToken("night-2"),
    sunset: cssToken("sunset"),
    glow: cssToken("glow"),
    rose: cssToken("rose"),
    majorelle: cssToken("majorelle"),
    moon: cssToken("moon"),
    moonSoft: cssToken("moon-soft"),
  };
  // Longer titles step down so they keep to two lines beside the sun.
  const titleSize = title.length > 26 ? 66 : title.length > 14 ? 80 : 104;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundImage: `linear-gradient(180deg, ${c.night} 0%, ${c.night} 38%, ${c.night2} 100%)`,
          fontFamily: "Instrument Sans",
          color: c.moon,
        }}
      >
        {/* A full-canvas layer, so the haze has no edge: next/og draws a gradient to transparent
            with a visible box. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `radial-gradient(circle at ${String(SUN_X + SUN / 2)}px ${String(HORIZON_Y)}px, ${c.sunset} 0%, ${c.night2} 42%, ${c.night} 75%)`,
            opacity: 0.32,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SUN_X,
            top: HORIZON_Y - SUN / 2,
            width: SUN,
            height: SUN / 2,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: SUN,
              height: SUN,
              borderRadius: SUN / 2,
              backgroundImage: `linear-gradient(180deg, ${c.glow} 0%, ${c.rose} 100%)`,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: SUN_X - 70,
            top: HORIZON_Y + 12,
            width: SUN + 140,
            height: 16,
            borderRadius: 8,
            backgroundColor: c.majorelle,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SUN_X + SUN / 2 - 140,
            top: HORIZON_Y + 52,
            width: 280,
            height: 14,
            borderRadius: 7,
            backgroundColor: c.majorelle,
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SUN_X + SUN / 2 - 70,
            top: HORIZON_Y + 86,
            width: 140,
            height: 12,
            borderRadius: 6,
            backgroundColor: c.majorelle,
            opacity: 0.3,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 80,
            top: 72,
            bottom: 72,
            width: 640,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="52" height="52" viewBox="0 0 64 64">
              <path d="M13 35a19 19 0 0 1 38 0z" fill={c.glow} />
              <rect x="6" y="38.5" width="52" height="5" rx="2.5" fill={c.majorelle} />
              <rect
                x="18"
                y="47.5"
                width="28"
                height="4.5"
                rx="2.25"
                fill={c.majorelle}
                opacity="0.55"
              />
            </svg>
            <div
              style={{
                fontFamily: "Bricolage Grotesque",
                fontSize: 34,
                letterSpacing: -1,
                color: c.moon,
              }}
            >
              {SITE.brand}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div
              style={{
                fontFamily: "Bricolage Grotesque",
                fontSize: titleSize,
                lineHeight: 1.02,
                letterSpacing: -titleSize * 0.035,
                color: c.moon,
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.35, color: c.moonSoft, maxWidth: 600 }}>
              {line}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 26, color: c.moonSoft }}>
            {SITE.url.replace(/^https:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Bricolage Grotesque", data: display, weight: 700, style: "normal" },
        { name: "Instrument Sans", data: text, weight: 500, style: "normal" },
      ],
    },
  );
}
