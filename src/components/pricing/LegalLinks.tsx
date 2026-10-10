"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import styles from "./Pricing.module.css";

const LINKS = [
  { href: "/terms", label: "legal.terms" },
  { href: "/refund-policy", label: "legal.refund" },
  { href: "/privacy", label: "legal.privacy" },
  { href: "/contact", label: "legal.contact" },
] as const;

/** Terms, refund policy, privacy and contact, kept together so none is missed. */
export function LegalLinks() {
  const { t } = useI18n();
  return (
    <nav aria-label={t("legal.nav.label")} className={styles.legal}>
      <ul className={styles.legalList}>
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link href={href}>{t(label)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
