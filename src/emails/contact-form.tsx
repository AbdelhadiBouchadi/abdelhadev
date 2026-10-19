/* Email clients ignore CSS variables, stylesheets and web fonts, so this file breaks the token rule
   on purpose: each value is copied from src/styles/tokens.css and named beside it. React escapes
   every value, so a message containing HTML arrives as text. Always French: it is only for me. */
import type { CSSProperties, ReactNode } from "react";

export interface ContactEmailProps {
  name: string;
  email: string;
  topic: string;
  message: string;
  /** The page language the visitor wrote from. */
  locale: string;
  /** Already formatted. */
  sentAt: string;
}

const C = {
  paper: "#f7f0e8", // --paper
  sheet: "#fffbf6", // --sheet
  sand2: "#e4d2bf", // --sand-2 (a solid stand-in for --line, which is translucent)
  ink: "#2b1d1a", // --ink
  inkSoft: "#6b564d", // --ink-soft
  glow: "#ffb48a", // --glow
  majorelle: "#3d52d5", // --majorelle
} as const;

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const s = {
  body: { margin: 0, padding: "24px 12px", background: C.paper, fontFamily: FONT, color: C.ink },
  card: {
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
    background: C.sheet,
    borderRadius: "22px", // --r-card
    borderCollapse: "separate",
  },
  cell: { padding: "28px 28px 32px" },
  brand: { margin: 0, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: C.ink },
  sun: { color: C.glow },
  heading: { margin: "18px 0 22px", fontSize: "22px", lineHeight: 1.25, fontWeight: 600 },
  label: { margin: 0, fontSize: "12px", fontWeight: 600, color: C.inkSoft },
  value: { margin: "2px 0 14px", fontSize: "16px", lineHeight: 1.5 },
  link: { color: C.majorelle },
  message: {
    margin: "6px 0 24px",
    padding: "16px 18px",
    border: `1.5px solid ${C.sand2}`,
    borderRadius: "16px",
    background: C.paper,
    fontSize: "15px",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },
  button: {
    display: "inline-block",
    padding: "14px 24px",
    borderRadius: "999px", // --r-pill
    background: C.ink,
    color: C.paper,
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
  },
  meta: { margin: "24px 0 0", fontSize: "12px", color: C.inkSoft },
} satisfies Record<string, CSSProperties>;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <p style={s.label}>{label}</p>
      <p style={s.value}>{children}</p>
    </>
  );
}

export function ContactFormEmail({
  name,
  email,
  topic,
  message,
  locale,
  sentAt,
}: ContactEmailProps) {
  const mailto = `mailto:${email}`;
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Nouveau message depuis abdelhadev.me</title>
      </head>
      <body style={s.body}>
        <table role="presentation" cellPadding={0} cellSpacing={0} style={s.card}>
          <tbody>
            <tr>
              <td style={s.cell}>
                <p style={s.brand}>
                  <span style={s.sun}>●</span> Abdelhadev
                </p>
                <h1 style={s.heading}>Nouveau message depuis abdelhadev.me</h1>
                <Field label="Nom">{name}</Field>
                <Field label="E-mail">
                  <a href={mailto} style={s.link}>
                    {email}
                  </a>
                </Field>
                <Field label="Projet">{topic}</Field>
                <p style={s.label}>Message</p>
                <div style={s.message}>{message}</div>
                <a href={mailto} style={s.button}>
                  Répondre
                </a>
                <p style={s.meta}>
                  Langue de la page&nbsp;: {locale} · Envoyé le {sentAt}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
