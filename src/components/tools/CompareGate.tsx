"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEntitlements } from "@/components/entitlements/EntitlementsProvider";
import { useI18n } from "@/lib/i18n/provider";
import { requirementFor } from "@/lib/plans/entitlements";
import controls from "@/styles/controls.module.css";
import styles from "./CompareGate.module.css";

/** Shows the comparison to plans that include it, and a way to get it to the rest. */
export function CompareGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { entitlements, status } = useEntitlements();

  if (status === "loading") return null;
  if (requirementFor("compare", entitlements) === "none") return children;

  return (
    <section className={styles.card} aria-labelledby="compare-locked-title">
      <h1 id="compare-locked-title" className={styles.title}>
        {t("limits.compare.title")}
      </h1>
      <p className={styles.text}>{t("limits.compare.text")}</p>
      <div className={styles.actions}>
        <Link
          href="/pricing"
          className={`${controls.button} ${controls.primary}`}
        >
          {t("limits.compare.seePlans")}
        </Link>
        <Link href="/tools" className={controls.button}>
          {t("limits.compare.library")}
        </Link>
      </div>
    </section>
  );
}
