"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { getCurrentPlan } from "@/lib/pricing/current-plan";
import { getPlan, localize } from "@/lib/pricing/plans";
import styles from "./SidebarContent.module.css";

interface PlanLinkProps {
  onNavigate?: (() => void) | undefined;
}

/** "· Free plan": a quiet link to the pricing page, read after a name. */
export function PlanLink({ onNavigate }: PlanLinkProps) {
  const { t, locale } = useI18n();
  const plan = getPlan(getCurrentPlan());
  return (
    <span className={styles.planInline}>
      <span aria-hidden="true">·</span>
      <Link
        href="/pricing"
        className={styles.planLink}
        onClick={() => onNavigate?.()}
      >
        {t("plan.label", { plan: localize(plan.name, locale) })}
      </Link>
    </span>
  );
}

/** For guests: "Guest · Free plan", above the sign-in button. */
export function GuestPlanRow({ onNavigate }: PlanLinkProps) {
  const { t } = useI18n();
  return (
    <p className={styles.planRow}>
      <span>{t("plan.guest")}</span>
      <PlanLink onNavigate={onNavigate} />
    </p>
  );
}
