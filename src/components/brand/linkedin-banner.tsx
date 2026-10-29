/* The LinkedIn profile banner, drawn like the OG card (src/components/brand/og-card.tsx).
   1584 x 396 is LinkedIn's banner size. The left 480 px stay empty: the profile photo covers
   the bottom left on desktop and the left side on phones. */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";
import { cssToken } from "@/lib/tokens";

export const BANNER_SIZE = { width: 1584, height: 396 } as const;

const FONTS_DIR = join(process.cwd(), "src/assets/og");
const fonts = Promise.all([
  readFile(join(FONTS_DIR, "BricolageGrotesque-Bold.woff")),
  readFile(join(FONTS_DIR, "InstrumentSans-Medium.woff")),
]);

/** px on the 1584 x 396 banner. */
const SUN = 300;
const HORIZON_Y = 250;
const SUN_X = 1130;
const TEXT_X = 500;

const LINE = "I build the software clinics and teams run on.";
const FACTS = ["Freelance full-stack", "Agadir, remote"] as const;

export async function linkedinBanner(): Promise<ImageResponse> {
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
  const facts = [SITE.url.replace(/^https:\/\//, ""), ...FACTS];

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
            left: SUN_X - 60,
            top: HORIZON_Y + 10,
            width: SUN + 120,
            height: 12,
            borderRadius: 6,
            backgroundColor: c.majorelle,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SUN_X + SUN / 2 - 100,
            top: HORIZON_Y + 40,
            width: 200,
            height: 11,
            borderRadius: 5.5,
            backgroundColor: c.majorelle,
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: SUN_X + SUN / 2 - 50,
            top: HORIZON_Y + 66,
            width: 100,
            height: 10,
            borderRadius: 5,
            backgroundColor: c.majorelle,
            opacity: 0.3,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: TEXT_X,
            top: 52,
            bottom: 52,
            width: 580,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="38" height="38" viewBox="0 0 64 64">
              <path d="M13 35a19 19 0 0 1 38 0z" fill={c.glow} />
              <rect x="6" y="38.5" width="52" height="5" rx="2.5" fill={c.majorelle} />
              <rect x="18" y="47.5" width="28" height="4.5" rx="2.25" fill={c.majorelle} opacity="0.55" />
            </svg>
            <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 26, letterSpacing: -0.8 }}>
              {SITE.brand}
            </div>
          </div>

          <div
            style={{
              fontFamily: "Bricolage Grotesque",
              fontSize: 50,
              lineHeight: 1.04,
              letterSpacing: -1.75,
            }}
          >
            {LINE}
          </div>

          <div style={{ display: "flex", gap: 12, fontSize: 22, color: c.moonSoft, whiteSpace: "nowrap" }}>
            {facts.flatMap((fact, i) => [
              ...(i > 0 ? [<div key={`dot-${String(i)}`} style={{ color: c.glow }}>·</div>] : []),
              <div key={fact}>{fact}</div>,
            ])}
          </div>
        </div>
      </div>
    ),
    {
      ...BANNER_SIZE,
      fonts: [
        { name: "Bricolage Grotesque", data: display, weight: 700, style: "normal" },
        { name: "Instrument Sans", data: text, weight: 500, style: "normal" },
      ],
    },
  );
}
