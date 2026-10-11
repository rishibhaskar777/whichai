"use client";

import Link from "next/link";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import { useI18n } from "@/lib/i18n/provider";
import {
  entitlementsFor,
  FREE_TIER,
  GUEST_TIER,
  type Tier,
} from "@/lib/plans/entitlements";
import controls from "@/styles/controls.module.css";
import styles from "./LimitCard.module.css";

interface LimitCardProps {
  tier: Tier;
}

/*
 * Shown in place of a plan once today's plans are used up. Both versions lead
 * somewhere: a guest can register or log in, a free account can upgrade.
 */
export function LimitCard({ tier }: LimitCardProps) {
  const { t, formatNumber } = useI18n();
  const { open } = useSignIn();

  if (tier === GUEST_TIER) {
    const used = entitlementsFor(GUEST_TIER).dailyPlans ?? 0;
    const free = entitlementsFor(FREE_TIER).dailyPlans ?? 0;
    return (
      <section className={styles.card} aria-label={t("limits.card.label")}>
        <p className={styles.text}>
          {t("limits.guest.text", {
            used: formatNumber(used),
            free: formatNumber(free),
          })}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${controls.button} ${controls.primary}`}
            aria-haspopup="dialog"
            onClick={(event) => open(event.currentTarget, "register")}
          >
            {t("limits.register")}
          </button>
          <button
            type="button"
            className={controls.button}
            aria-haspopup="dialog"
            onClick={(event) => open(event.currentTarget, "login")}
          >
            {t("limits.login")}
          </button>
        </div>
      </section>
    );
  }

  const limit = entitlementsFor(tier).dailyPlans ?? 0;
  return (
    <section className={styles.card} aria-label={t("limits.card.label")}>
      <p className={styles.text}>
        {t("limits.free.text", { limit: formatNumber(limit) })}
      </p>
      <div className={styles.actions}>
        <Link
          href="/pricing"
          className={`${controls.button} ${controls.primary}`}
        >
          {t("limits.upgrade")}
        </Link>
      </div>
    </section>
  );
}
