"use client";

import Link from "next/link";
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
  PlusIcon,
  ShareIcon,
} from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { PartPicker } from "@/components/part-picker/PartPicker";
import { useToast } from "@/components/toast/ToastProvider";
import { buildPlan } from "@/lib/engine/build-plan";
import { useI18n } from "@/lib/i18n/provider";
import type {
  Budget,
  JobRecommendation,
  Level,
  UnderstoodGoal,
} from "@/lib/schemas/plan";
import { listParts, type PartOption } from "@/lib/plan/interpret-goal";
import { requestKeyOf } from "@/lib/plan/request-key";
import { MAX_PART_EDITS, type PlanRequest } from "@/lib/schemas/plan-request";
import { takeReturnCard } from "@/lib/plan-return";
import { buildShareUrl } from "@/lib/share/share-link";
import { prefersReducedMotion } from "@/lib/use-reduced-motion";
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
  /** Tools picked by hand instead of the engine's choice, by job id. */
  initialChosenTools?: Readonly<Record<string, string>> | undefined;
  /** Parts added from the full list, and parts taken out, by job id. */
  initialAddedJobs?: readonly string[] | undefined;
  initialRemovedJobs?: readonly string[] | undefined;
  /**
   * The request as it was saved, when the plan was opened with changes on top
   * of it (an address fragment). Without it the opened plan counts as saved.
   */
  savedRequest?: PlanRequest | undefined;
  /** Set when the plan was opened from Projects. */
  savedPlanId?: string;
  /** Shown above the headline, for example "opened from a shared link". */
  notice?: ReactNode;
  /** Called after the person changes the level, budget, tools or a pick. */
  onRequestChange?: ((request: PlanRequest) => void) | undefined;
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

function showCard(jobId: string, instant = false) {
  const card = document.getElementById(jobCardId(jobId));
  if (!card) return;
  card.scrollIntoView?.({
    behavior: instant || prefersReducedMotion() ? "auto" : "smooth",
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
  initialChosenTools,
  initialAddedJobs,
  initialRemovedJobs,
  savedRequest,
  savedPlanId,
  notice,
  onRequestChange,
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
  const [chosenTools, setChosenTools] = useState<
    Readonly<Record<string, string>>
  >(() => initialChosenTools ?? {});
  const [swapNotice, setSwapNotice] = useState("");
  const [addedJobs, setAddedJobs] = useState<readonly string[]>(
    () => initialAddedJobs ?? [],
  );
  const [removedJobs, setRemovedJobs] = useState<readonly string[]>(
    () => initialRemovedJobs ?? [],
  );
  const [pickingPart, setPickingPart] = useState(false);
  const [partNotice, setPartNotice] = useState("");
  const [focusJob, setFocusJob] = useState<{
    part: PartOption;
    level: Level;
  } | null>(null);
  const [savedId, setSavedId] = useState(savedPlanId ?? null);

  const request = useMemo<PlanRequest>(
    () => ({
      goal,
      level,
      budget,
      toolsUsed: [...usedTools].sort(),
      chosenTools,
      addedJobs: [...addedJobs].sort(),
      removedJobs: [...removedJobs].sort(),
    }),
    [goal, level, budget, usedTools, chosenTools, addedJobs, removedJobs],
  );
  const requestKey = requestKeyOf(request);
  const [savedKey, setSavedKey] = useState<string | null>(() =>
    savedPlanId ? requestKeyOf(savedRequest ?? request) : null,
  );

  // Coming back from a tool page, return to the card the reader left.
  useEffect(() => {
    const card = takeReturnCard();
    if (card && document.getElementById(jobCardId(card))) {
      showCard(card, true);
    } else {
      headlineRef.current?.focus();
    }
  }, []);

  const reportedKey = useRef(requestKey);
  useEffect(() => {
    if (reportedKey.current === requestKey) return;
    reportedKey.current = requestKey;
    onRequestChange?.(request);
  }, [request, requestKey, onRequestChange]);

  const plan = useMemo(
    () =>
      buildPlan(goal, {
        level: initialLevel,
        budget,
        toolsUsed: usedTools,
        chosenTools,
        addedJobs,
        removedJobs,
      }),
    [
      goal,
      initialLevel,
      budget,
      usedTools,
      chosenTools,
      addedJobs,
      removedJobs,
    ],
  );
  const choices = useMemo(
    () =>
      toolOptions(
        buildPlan(goal, {
          level: initialLevel,
          budget: null,
          toolsUsed: NO_TOOLS,
          addedJobs,
          removedJobs,
        }).levels[level].jobs,
      ),
    [goal, initialLevel, level, addedJobs, removedJobs],
  );
  const content = plan.levels[level];
  const parts = useMemo(() => listParts(), []);
  const jobIdsInPlan = useMemo(
    () => new Set(content.jobs.map((job) => job.jobId)),
    [content],
  );

  // After a part is added, bring its card into view.
  useEffect(() => {
    if (focusJob) showCard(focusJob.part.id);
  }, [focusJob]);
  // A part another tool already covers gets no card of its own.
  const coveredPart =
    focusJob !== null &&
    focusJob.level === level &&
    !jobIdsInPlan.has(focusJob.part.id)
      ? focusJob.part
      : null;

  function changeLevel(next: Level) {
    setLevel(next);
    setLevelNotice(t("plan.showingLevel", { level: t(`level.${next}`) }));
  }

  function swapTool(jobId: string, toolId: string) {
    const job = content.jobs.find((candidate) => candidate.jobId === jobId);
    if (!job) return;
    const name =
      job.alternatives.find((alternative) => alternative.toolId === toolId)
        ?.toolName ?? job.autoPick?.toolName;
    setChosenTools((current) => {
      const next = { ...current };
      // Picking the engine's own choice again clears the hand-made pick.
      if (toolId === job.autoPick?.toolId) delete next[jobId];
      else next[jobId] = toolId;
      return next;
    });
    if (name) {
      setSwapNotice(t("job.swapped", { tool: name, job: job.jobName }));
    }
  }

  function addPart(part: PartOption) {
    setPickingPart(false);
    setRemovedJobs((current) => current.filter((id) => id !== part.id));
    setAddedJobs((current) =>
      current.includes(part.id)
        ? current
        : [...current, part.id].slice(-MAX_PART_EDITS),
    );
    setPartNotice(t("plan.partAdded", { job: part.name }));
    setFocusJob({ part, level });
  }

  function removePart(jobId: string, jobName: string) {
    const before = { added: addedJobs, removed: removedJobs };
    setAddedJobs((current) => current.filter((id) => id !== jobId));
    setRemovedJobs((current) =>
      current.includes(jobId)
        ? current
        : [...current, jobId].slice(-MAX_PART_EDITS),
    );
    setPartNotice(t("plan.partRemoved", { job: jobName }));
    show({
      message: t("plan.partRemoved", { job: jobName }),
      actionLabel: t("common.undo"),
      onAction: () => {
        setAddedJobs(before.added);
        setRemovedJobs(before.removed);
      },
    });
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
      <p role="status" className={controls.srOnly}>
        {swapNotice}
      </p>
      <p role="status" className={controls.srOnly}>
        {coveredPart
          ? t("plan.partCovered", { job: coveredPart.name })
          : partNotice}
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
                <JobCard
                  job={job}
                  onSwap={swapTool}
                  onRemove={content.jobs.length > 1 ? removePart : undefined}
                />
              </li>
            ))}
          </ul>
          <div className={styles.addPart} data-print-hide="">
            <button
              type="button"
              className={controls.button}
              aria-haspopup="dialog"
              onClick={() => setPickingPart(true)}
            >
              <PlusIcon />
              {t("plan.addPart")}
            </button>
            <p className={styles.addPartHelp}>{t("plan.addPartHelp")}</p>
          </div>
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

      <PartPicker
        open={pickingPart}
        parts={parts}
        chosen={jobIdsInPlan}
        onPick={addPart}
        onClose={() => setPickingPart(false)}
      />

      <p className={styles.dataNote}>
        {t("plan.dataNote")}{" "}
        <Link href="/about#data">{t("plan.dataNote.link")}</Link>
      </p>
    </article>
  );
}
