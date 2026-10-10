import type { Locale } from "@/lib/i18n/locales";

const INTL_TAGS: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

/** Whole rupees in the reader's number style, such as ₹1,490. */
export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_TAGS[locale], {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
