"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { PlanView } from "@/components/plan-view/PlanView";
import { StatePage } from "@/components/state-page/StatePage";
import { useI18n } from "@/lib/i18n/provider";
import { decodePlanRequest } from "@/lib/share/share-link";
import { isStale } from "@/lib/storage/operations";
import controls from "@/styles/controls.module.css";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const readHash = () => window.location.hash;
/* The fragment never reaches the server, so there is nothing to render there. */
const serverHash = () => null;

const ERROR_KEYS = {
  "too-large": "share.error.tooLarge",
  malformed: "share.error.malformed",
  invalid: "share.error.invalid",
} as const;

/**
 * Shows a plan that is not made on the home page: one saved in Projects
 * (/plan?id=...) or one in a share link (/plan#...). Both are rebuilt from the
 * stored request, so they always use the current catalogue.
 */
export function PlanRoute() {
  const { t } = useI18n();
  const { plans, status } = useLocalData();
  const savedId = useSearchParams().get("id");
  const hash = useSyncExternalStore(subscribeToHash, readHash, serverHash);

  const homeLink = (
    <Link href="/" className={`${controls.button} ${controls.primary}`}>
      {t("plan.makeOne")}
    </Link>
  );

  if (hash === null) return null;

  if (savedId) {
    if (status === "loading") return null;
    const saved = plans.find((plan) => plan.id === savedId);
    if (!saved) {
      return (
        <StatePage
          title={t("plan.missing.title")}
          text={t("plan.missing.text")}
        >
          <Link href="/projects" className={controls.button}>
            {t("projects.viewAll")}
          </Link>
          {homeLink}
        </StatePage>
      );
    }
    const { planRequest } = saved;
    return (
      <PlanView
        key={saved.id}
        goal={planRequest.goal}
        initialLevel={planRequest.level}
        initialBudget={planRequest.budget}
        initialToolsUsed={planRequest.toolsUsed}
        savedPlanId={saved.id}
        notice={isStale(saved) ? t("projects.rebuilt") : undefined}
      />
    );
  }

  if (hash.length > 1) {
    const decoded = decodePlanRequest(hash);
    if (!decoded.ok) {
      return (
        <StatePage
          title={t("share.error.title")}
          text={t(ERROR_KEYS[decoded.error])}
        >
          {homeLink}
        </StatePage>
      );
    }
    const { request } = decoded;
    return (
      <PlanView
        key={hash}
        goal={request.goal}
        initialLevel={request.level}
        initialBudget={request.budget}
        initialToolsUsed={request.toolsUsed}
        notice={t("share.openedNotice")}
      />
    );
  }

  return (
    <StatePage title={t("plan.empty.title")} text={t("plan.empty.text")}>
      {homeLink}
    </StatePage>
  );
}
