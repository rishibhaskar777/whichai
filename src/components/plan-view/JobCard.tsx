"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
} from "@/components/icons";
import { GetIt } from "@/components/tools/GetIt";
import { freeOptionText, PricingValue } from "@/components/tools/Pricing";
import { useI18n } from "@/lib/i18n/provider";
import { rememberReturnCard } from "@/lib/plan-return";
import type { JobRecommendation } from "@/lib/schemas/plan";
import { useMediaQuery } from "@/lib/use-media-query";
import controls from "@/styles/controls.module.css";
import styles from "./JobCard.module.css";
import { ModelGuidance } from "./ModelGuidance";

export function jobCardId(jobId: string): string {
  return `job-card-${jobId}`;
}

interface JobCardProps {
  job: JobRecommendation;
  /** Swaps a tool into this card. The previous pick joins the alternatives. */
  onSwap: (jobId: string, toolId: string) => void;
}

export function JobCard({ job, onSwap }: JobCardProps) {
  const i18n = useI18n();
  const { t, rich, formatDate } = i18n;
  const titleId = useId();
  const panelId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusTitle = useRef(false);
  const wideScreen = useMediaQuery("(min-width: 768px)", false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [swapped, setSwapped] = useState(false);
  const open = chosen ?? wideScreen;

  // The button that was pressed leaves the page with the swap, so focus
  // moves to the new tool's name, which the screen reader then reads.
  useEffect(() => {
    if (!focusTitle.current) return;
    focusTitle.current = false;
    titleRef.current?.focus();
  }, [job.toolId]);

  function swap(toolId: string) {
    focusTitle.current = true;
    setSwapped(true);
    onSwap(job.jobId, toolId);
  }

  return (
    <article
      id={jobCardId(job.jobId)}
      tabIndex={-1}
      className={styles.card}
      aria-labelledby={titleId}
    >
      <div key={job.toolId} className={styles.content} data-swapped={swapped}>
        <header className={styles.header}>
          <div>
            <p className={styles.jobName}>
              {job.jobName}
              <span className={styles.kind}>{t(`kind.${job.kind}`)}</span>
            </p>
            <h3
              id={titleId}
              ref={titleRef}
              tabIndex={-1}
              className={styles.toolName}
            >
              {job.toolName}
            </h3>
            {job.autoPick ? (
              <button
                type="button"
                className={styles.switchBack}
                onClick={() => swap(job.autoPick?.toolId ?? job.toolId)}
              >
                {t("job.switchBack", { tool: job.autoPick.toolName })}
              </button>
            ) : null}
          </div>
          <span className={styles.tag} data-tag={job.tag}>
            {t(`tag.${job.tag}`)}
          </span>
        </header>

        <p className={styles.why}>{job.why}</p>

        {job.modelGuidance ? (
          <ModelGuidance guidance={job.modelGuidance} />
        ) : null}

        <dl className={styles.facts}>
          <div>
            <dt>{t("tool.freeOption")}</dt>
            <dd>{freeOptionText(i18n, job.freeOption)}</dd>
          </div>
          <div>
            <dt>{t("job.pricing")}</dt>
            <dd>
              <PricingValue i18n={i18n} pricing={job.pricing} />
            </dd>
          </div>
          <div>
            <dt>{t("job.watchOut")}</dt>
            <dd>{job.watchOutFor}</dd>
          </div>
          {job.compatibilityNote ? (
            <div>
              <dt>{t("job.worksWith")}</dt>
              <dd>{job.compatibilityNote}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t("job.fit")}</dt>
            <dd>{t("job.fitValue", { score: job.fitScore })}</dd>
          </div>
        </dl>

        <p className={styles.source}>
          {job.verified && job.lastVerified ? (
            <span className={styles.verified}>
              <CheckIcon />
              {t("job.verifiedOn", { date: formatDate(job.lastVerified) })}
            </span>
          ) : null}
          {job.officialUrl ? (
            <a href={job.officialUrl} target="_blank" rel="noopener noreferrer">
              {t("job.officialPage")}
              <ExternalLinkIcon />
              <span className={controls.srOnly}>{t("job.opensInNewTab")}</span>
            </a>
          ) : null}
          <Link
            href={`/tools/${job.toolId}`}
            onClick={() => rememberReturnCard(job.jobId)}
          >
            {t("job.viewDetails")}
            <span className={controls.srOnly}> — {job.toolName}</span>
          </Link>
        </p>

        {job.officialUrl ? (
          <GetIt
            toolName={job.toolName}
            getIt={job.getIt ?? undefined}
            officialUrl={job.officialUrl}
            variant="compact"
            detailHref={`/tools/${job.toolId}`}
          />
        ) : null}

        {job.alternatives.length > 0 ? (
          <div className={styles.more}>
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setChosen(!open)}
            >
              {t("job.otherOptions")}
              <ChevronDownIcon />
            </button>
            <div id={panelId} className={styles.panel} data-open={open}>
              <div className={styles.panelInner} inert={!open}>
                <ul className={styles.alternatives}>
                  {job.alternatives.map((alternative) => (
                    <li key={alternative.toolId}>
                      <button
                        type="button"
                        className={styles.alternative}
                        onClick={() => swap(alternative.toolId)}
                      >
                        {rich("job.chooseIf", {
                          tool: <strong>{alternative.toolName}</strong>,
                          reason: alternative.chooseIf,
                        })}
                      </button>
                      {alternative.paidOnly ? (
                        <span className={styles.paid}>{t("job.paidOnly")}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
