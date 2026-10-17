/* Bricolage Grotesque (display) and Instrument Sans (text), self-hosted by next/font with
   metric-matched fallbacks so swapping in the web font does not shift layout.

   next/font only accepts extra axes when the weight is variable (no weight list), so both
   families load their full variable weight range: Bricolage 200 to 800 instead of 500 to 800,
   Instrument Sans 400 to 700. The CSS uses only the documented weights. */
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
  variable: "--display",
  fallback: ["Arial Narrow", "Helvetica Neue", "system-ui", "sans-serif"],
});

export const text = Instrument_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--text",
  fallback: ["Helvetica Neue", "Arial", "system-ui", "sans-serif"],
});

export const fontVariables = `${display.variable} ${text.variable}`;
