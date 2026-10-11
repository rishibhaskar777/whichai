"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import { useI18n } from "@/lib/i18n/provider";
import {
  entitlementsFor,
  GUEST_TIER,
  type Tier,
} from "@/lib/plans/entitlements";
import { timeUntilMidnight } from "@/lib/plans/usage";
import controls from "@/styles/controls.module.css";
import styles from "./LimitBar.module.css";

const MINUTE_MS = 60_000;

interface LimitBarProps {
  tier: Tier;
}

/*
 * Sits directly above the composer once today's plans are used up. It says
 * when the count resets and where to go next, and its countdown ticks every
 * minute. The composer itself is disabled by the caller.
 */
export function LimitBar({ tier }: LimitBarProps) {
  const { t, formatNumber } = useI18n();
  const { open } = useSignIn();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const { hours, minutes } = timeUntilMidnight(now);
  const time = t("limits.bar.time", {
    hours: formatNumber(hours),
    minutes: formatNumber(minutes),
  });
  const limit = formatNumber(entitlementsFor(tier).dailyPlans ?? 0);
  const guest = tier === GUEST_TIER;

  return (
    <section className={styles.bar} aria-label={t("limits.card.label")}>
      <p className={styles.text}>
        {guest
          ? t("limits.bar.guest", { limit, time })
          : t("limits.bar.free", { limit, time })}
      </p>
      <div className={styles.actions}>
        {guest ? (
          <>
            <button
              type="button"
              className={`${controls.button} ${controls.primary}`}
              aria-haspopup="dialog"
              onClick={(event) => open(event.currentTarget, "register")}
            >
              {t("limits.registerFree")}
            </button>
            <button
              type="button"
              className={controls.button}
              aria-haspopup="dialog"
              onClick={(event) => open(event.currentTarget, "login")}
            >
              {t("limits.login")}
            </button>
          </>
        ) : (
          <Link
            href="/pricing"
            className={`${controls.button} ${controls.primary}`}
          >
            {t("limits.seePlans")}
          </Link>
        )}
      </div>
    </section>
  );
}
