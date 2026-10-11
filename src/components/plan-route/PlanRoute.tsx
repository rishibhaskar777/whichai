"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { PlanView } from "@/components/plan-view/PlanView";
import { StatePage } from "@/components/state-page/StatePage";
import { useI18n } from "@/lib/i18n/provider";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import { decodePlanRequest, encodePlanRequest } from "@/lib/share/share-link";
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

/**
 * The fragment this page was opened with. The page replaces its own fragment
 * as the plan changes, and writes the first one into the history entry, so
 * the plan view keeps its identity instead of starting over on every change.
 */
const OPENED_KEY = "whichaiPlanOpened";

function openedFragment(): string | null {
  const state: unknown = window.history.state;
  if (state && typeof state === "object") {
    const value = (state as Record<string, unknown>)[OPENED_KEY];
    if (typeof value === "string") return value;
  }
  return null;
}
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
 *
 * Changes made on the plan (a swapped tool, a level, a part) replace the
 * address fragment, so Back from a tool page returns to the plan as it was
 * left. A fragment on a saved plan's address wins over the saved copy.
 */
export function PlanRoute() {
  const { t } = useI18n();
  const { plans, status } = useLocalData();
  const savedId = useSearchParams().get("id");
  const hash = useSyncExternalStore(subscribeToHash, readHash, serverHash);
  const opened = useSyncExternalStore(
    subscribeToHash,
    openedFragment,
    serverHash,
  );
  const identity = opened ?? hash;

  const keepInAddress = useCallback((request: PlanRequest) => {
    const encoded = encodePlanRequest(request);
    // Too long for a link: leave the last fragment that fit.
    if (encoded === null) return;
    const { pathname, search, hash: current } = window.location;
    const state: unknown = window.history.state;
    const base = state && typeof state === "object" ? state : {};
    window.history.replaceState(
      { ...base, [OPENED_KEY]: openedFragment() ?? current },
      "",
      `${pathname}${search}#${encoded}`,
    );
  }, []);

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
    const edited = hash.length > 1 ? decodePlanRequest(hash) : null;
    const planRequest = edited?.ok ? edited.request : saved.planRequest;
    return (
      <PlanView
        key={`${saved.id}${identity}`}
        goal={planRequest.goal}
        initialLevel={planRequest.level}
        initialBudget={planRequest.budget}
        initialToolsUsed={planRequest.toolsUsed}
        initialChosenTools={planRequest.chosenTools}
        initialAddedJobs={planRequest.addedJobs}
        initialRemovedJobs={planRequest.removedJobs}
        savedRequest={saved.planRequest}
        savedPlanId={saved.id}
        notice={isStale(saved) ? t("projects.rebuilt") : undefined}
        onRequestChange={keepInAddress}
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
        key={identity}
        goal={request.goal}
        initialLevel={request.level}
        initialBudget={request.budget}
        initialToolsUsed={request.toolsUsed}
        initialChosenTools={request.chosenTools}
        initialAddedJobs={request.addedJobs}
        initialRemovedJobs={request.removedJobs}
        notice={t("share.openedNotice")}
        onRequestChange={keepInAddress}
      />
    );
  }

  return (
    <StatePage title={t("plan.empty.title")} text={t("plan.empty.text")}>
      {homeLink}
    </StatePage>
  );
}
