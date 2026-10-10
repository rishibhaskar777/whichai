"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { plansAffectedBy } from "@/lib/news/affects-plans";
import controls from "@/styles/controls.module.css";
import styles from "./News.module.css";
import { usePlanTools } from "./PlanToolsProvider";

interface AffectsPlansBadgeProps {
  toolIds: readonly string[];
}

/** Shown only when a saved plan on this device uses one of the tools. */
export function AffectsPlansBadge({ toolIds }: AffectsPlansBadgeProps) {
  const { t } = useI18n();
  const planTools = usePlanTools();
  const affected = useMemo(
    () => plansAffectedBy(toolIds, planTools),
    [toolIds, planTools],
  );
  if (affected.length === 0) return null;

  return (
    <span className={`${styles.badge} ${styles.affects}`}>
      {t("news.affects")}
      <span className={controls.srOnly}>
        : {affected.map((plan) => plan.title).join(", ")}
      </span>
    </span>
  );
}
