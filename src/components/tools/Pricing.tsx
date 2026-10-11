import { ExternalLinkIcon } from "@/components/icons";
import type { I18n } from "@/lib/i18n/translate";
import type { Tool } from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import styles from "./Pricing.module.css";

type Translator = Pick<I18n, "t" | "formatDate">;

export interface PricingFacts {
  text: string | null;
  checkedOn: string | null;
  url: string;
}

export function freeOptionText(
  { t }: Translator,
  hasFreeOption: Tool["hasFreeOption"],
): string {
  if (hasFreeOption === true) return t("tool.free.yes");
  if (hasFreeOption === false) return t("tool.free.no");
  return t("tool.free.unknown");
}

/**
 * A recorded summary with the day it was read from the official page, or a
 * link to that page. Never a placeholder.
 */
export function PricingValue({
  i18n: { t, formatDate },
  pricing,
}: {
  i18n: Translator;
  pricing: PricingFacts;
}) {
  const link = (label: string) => (
    <a
      href={pricing.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      {label}
      <ExternalLinkIcon />
      <span className={controls.srOnly}>{t("job.opensInNewTab")}</span>
    </a>
  );

  if (pricing.text === null || pricing.checkedOn === null) {
    return link(t("job.seePricing"));
  }
  return (
    <>
      <span>{pricing.text}</span>
      <span className={styles.source}>
        {link(t("job.pricingChecked", { date: formatDate(pricing.checkedOn) }))}
      </span>
    </>
  );
}
