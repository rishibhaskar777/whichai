import { Noto_Sans_Devanagari, Onest } from "next/font/google";

export const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-onest",
  display: "swap",
});

// Onest has no Devanagari glyphs. The browser only downloads this file when a
// page contains Hindi text, so English pages do not pay for it.
export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});
