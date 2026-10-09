"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, ExternalLinkIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
import type { JobRecommendation } from "@/lib/schemas/plan";
import { useMediaQuery } from "@/lib/use-media-query";
import controls from "@/styles/controls.module.css";
import styles from "./JobCard.module.css";
import { ModelGuidance } from "./ModelGuidance";

export function jobCardId(jobId: string): string {
  return `job-card-${jobId}`;
}

export function JobCard({ job }: { job: JobRecommendation }) {
  const { t, rich } = useI18n();
  const titleId = useId();
  const panelId = useId();
  const wideScreen = useMediaQuery("(min-width: 768px)", false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? wideScreen;

  return (
    <article
      id={jobCardId(job.jobId)}
      tabIndex={-1}
      className={styles.card}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.jobName}>
            {job.jobName}
            <span className={styles.kind}>{t(`kind.${job.kind}`)}</span>
          </p>
          <h3 id={titleId} className={styles.toolName}>
            {job.toolName}
          </h3>
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
          <dt>{t("job.pricing")}</dt>
          <dd>{job.pricing}</dd>
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
        <span>
          {t("job.source", { source: t(`source.${job.sourceLabel}`) })}
        </span>
        <span>
          {t("job.lastVerified", {
            date: job.lastVerified ?? t("job.notVerified"),
          })}
        </span>
        {job.officialUrl ? (
          <a href={job.officialUrl} target="_blank" rel="noopener noreferrer">
            {t("job.officialPage")}
            <ExternalLinkIcon />
            <span className={controls.srOnly}>{t("job.opensInNewTab")}</span>
          </a>
        ) : null}
      </p>

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
                    {rich("job.chooseIf", {
                      tool: <strong>{alternative.toolName}</strong>,
                      reason: alternative.chooseIf,
                    })}
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
    </article>
  );
}
