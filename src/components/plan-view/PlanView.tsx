"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CopyButton } from "@/components/copy-button/CopyButton";
import {
  BookmarkIcon,
  CheckIcon,
  DownloadIcon,
  ShareIcon,
} from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { useToast } from "@/components/toast/ToastProvider";
import { buildPlan } from "@/lib/engine/build-plan";
import { useI18n } from "@/lib/i18n/provider";
import type {
  Budget,
  JobRecommendation,
  Level,
  UnderstoodGoal,
} from "@/lib/schemas/plan";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import { buildShareUrl } from "@/lib/share/share-link";
import controls from "@/styles/controls.module.css";
import { AccuracyCard, type ToolOption } from "./AccuracyCard";
import { JobCard, jobCardId } from "./JobCard";
import { LevelSwitch } from "./LevelSwitch";
import {
  BulletSection,
  CheckTheFacts,
  Overview,
  StarterBrief,
  TierBlock,
  Workflow,
} from "./PlanSections";
import styles from "./PlanView.module.css";
import { Toolkit } from "./Toolkit";

const NO_TOOLS: ReadonlySet<string> = new Set();

export interface PlanViewProps {
  goal: UnderstoodGoal;
  initialLevel: Level;
  initialBudget?: Budget | null;
  initialToolsUsed?: readonly string[];
  /** Set when the plan was opened from Projects. */
  savedPlanId?: string;
  /** Shown above the headline, for example "opened from a shared link". */
  notice?: ReactNode;
}

/** Every tool the plan names for this level, with its alternatives. */
function toolOptions(jobs: readonly JobRecommendation[]): ToolOption[] {
  const options = new Map<string, ToolOption>();
  for (const job of jobs) {
    options.set(job.toolId, { id: job.toolId, name: job.toolName });
    for (const alternative of job.alternatives) {
      options.set(alternative.toolId, {
        id: alternative.toolId,
        name: alternative.toolName,
      });
    }
  }
  return [...options.values()];
}

function showCard(jobId: string) {
  const card = document.getElementById(jobCardId(jobId));
  if (!card) return;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  card.scrollIntoView?.({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  card.focus({ preventScroll: true });
}

/** Names the printed file after the plan, then puts the title back. */
function printWithTitle(title: string) {
  const original = document.title;
  const restore = () => {
    document.title = original;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  document.title = title;
  window.print();
}

export function PlanView({
  goal,
  initialLevel,
  initialBudget = null,
  initialToolsUsed,
  savedPlanId,
  notice,
}: PlanViewProps) {
  const { t, locale } = useI18n();
  const { settings, savePlan, updatePlan, deletePlan } = useLocalData();
  const { show } = useToast();
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const jobsTitleId = useId();
  const [level, setLevel] = useState<Level>(initialLevel);
  const [levelNotice, setLevelNotice] = useState("");
  const [usedTools, setUsedTools] = useState<ReadonlySet<string>>(
    () => new Set(initialToolsUsed ?? NO_TOOLS),
  );
  const [budget, setBudget] = useState<Budget | null>(initialBudget);
  const [savedId, setSavedId] = useState(savedPlanId ?? null);

  const request = useMemo<PlanRequest>(
    () => ({
      goal,
      level,
      budget,
      toolsUsed: [...usedTools].sort(),
    }),
    [goal, level, budget, usedTools],
  );
  const requestKey = JSON.stringify(request);
  const [savedKey, setSavedKey] = useState<string | null>(
    savedPlanId ? requestKey : null,
  );

  useEffect(() => {
    headlineRef.current?.focus();
  }, []);

  const plan = useMemo(
    () =>
      buildPlan(goal, { level: initialLevel, budget, toolsUsed: usedTools }),
    [goal, initialLevel, budget, usedTools],
  );
  const choices = useMemo(
    () =>
      toolOptions(
        buildPlan(goal, {
          level: initialLevel,
          budget: null,
          toolsUsed: NO_TOOLS,
        }).levels[level].jobs,
      ),
    [goal, initialLevel, level],
  );
  const content = plan.levels[level];

  function changeLevel(next: Level) {
    setLevel(next);
    setLevelNotice(t("plan.showingLevel", { level: t(`level.${next}`) }));
  }

  function toggleTool(toolId: string) {
    setUsedTools((current) => {
      const next = new Set(current);
      if (!next.delete(toolId)) next.add(toolId);
      return next;
    });
  }

  async function save() {
    if (savedId) {
      const result = await updatePlan(savedId, request);
      if (result.ok) {
        setSavedKey(requestKey);
        show({ message: t("projects.updated") });
      }
      return;
    }
    const result = await savePlan(request, plan.headline);
    if (!result.ok) return;
    const { id } = result.value;
    setSavedId(id);
    setSavedKey(requestKey);
    show({
      message: t("projects.saved"),
      actionLabel: t("common.undo"),
      onAction: () => {
        void deletePlan(id);
        setSavedId(null);
        setSavedKey(null);
      },
    });
  }

  async function copyShareLink() {
    const url = buildShareUrl(window.location.origin, request);
    if (url === null) {
      show({ message: t("share.tooLong"), tone: "error" });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      show({ message: t("share.copied") });
    } catch {
      show({ message: t("share.copyFailed"), tone: "error" });
    }
  }

  const isSaved = savedId !== null && savedKey === requestKey;
  const saveLabel = isSaved
    ? t("plan.saved")
    : savedId
      ? t("plan.updateSaved")
      : t("plan.save");

  return (
    <article className={styles.plan} aria-labelledby="plan-headline">
      {notice ? <div className={styles.banner}>{notice}</div> : null}

      {plan.isSample ? (
        <p className={styles.notice}>
          <strong>{t("plan.sampleNotice.strong")}</strong>{" "}
          {t("plan.sampleNotice.rest")}
        </p>
      ) : null}

      {locale === "hi" ? (
        <p className={styles.langNote}>{t("plan.englishDetails")}</p>
      ) : null}

      <h1
        id="plan-headline"
        ref={headlineRef}
        tabIndex={-1}
        className={styles.headline}
      >
        {plan.headline}
      </h1>

      <div data-print-hide="">
        <LevelSwitch level={level} onChange={changeLevel} />
      </div>
      <p className={styles.printLevel}>
        {t("plan.levelGroup")}: {t(`level.${level}`)}
      </p>
      <p role="status" className={controls.srOnly}>
        {levelNotice}
      </p>

      <div key={level} className={styles.body}>
        <Overview level={content} />
        <Toolkit groups={content.toolkit} onSelect={showCard} />

        <section className={styles.section} aria-labelledby={jobsTitleId}>
          <h2 id={jobsTitleId} className={styles.sectionTitle}>
            {t("plan.whatToUse")}
          </h2>
          <ul className={styles.jobs}>
            {content.jobs.map((job) => (
              <li key={job.jobId}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        </section>

        {content.tiers ? <TierBlock tiers={content.tiers} /> : null}
        <Workflow steps={content.workflow} />
        <StarterBrief brief={content.starterBrief} />
        {content.checkTheFacts ? (
          <CheckTheFacts text={content.checkTheFacts} />
        ) : null}
        <BulletSection
          title={t("plan.whenToUpgrade")}
          items={content.whenToUpgrade}
        />
        <BulletSection
          title={t("plan.commonMistakes")}
          items={content.commonMistakes}
        />
      </div>

      <p className={styles.footer}>{t("plan.footer")}</p>

      <div className={styles.actions} data-print-hide="">
        <CopyButton
          text={content.starterBrief}
          label={t("plan.copyBrief")}
          variant="primary"
        />
        <button
          type="button"
          className={controls.button}
          disabled={isSaved}
          onClick={() => void save()}
        >
          {isSaved ? <CheckIcon /> : <BookmarkIcon />}
          {saveLabel}
        </button>
        <button
          type="button"
          className={controls.button}
          onClick={() => printWithTitle(plan.headline)}
        >
          <DownloadIcon />
          {t("plan.downloadPdf")}
        </button>
        <button
          type="button"
          className={controls.button}
          onClick={() => void copyShareLink()}
        >
          <ShareIcon />
          {t("plan.copyShareLink")}
        </button>
      </div>

      <AccuracyCard
        tools={choices}
        usedTools={usedTools}
        onToggleTool={toggleTool}
        budget={budget}
        onBudgetChange={setBudget}
        currency={settings.currencyDisplay}
      />
    </article>
  );
}
