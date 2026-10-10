"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import styles from "./SidebarContent.module.css";

const LINKS = [
  { href: "/terms", label: "legal.terms" },
  { href: "/refund-policy", label: "legal.refund" },
  { href: "/privacy", label: "legal.privacy" },
  { href: "/contact", label: "legal.contact" },
] as const;

export function SidebarLegal({
  onNavigate,
}: {
  onNavigate?: (() => void) | undefined;
}) {
  const { t } = useI18n();
  return (
    <nav aria-label={t("legal.nav.label")}>
      <ul className={styles.legal}>
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={styles.legalLink}
              onClick={() => onNavigate?.()}
            >
              {t(label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
