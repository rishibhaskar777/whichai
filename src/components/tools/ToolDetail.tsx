import Link from "next/link";
import { ExternalLinkIcon } from "@/components/icons";
import { NewsEntry } from "@/components/news/NewsEntry";
import type { NewsItem } from "@/lib/news/types";
import { compareHref } from "@/lib/library/compare";
import { libraryHref, DEFAULT_QUERY } from "@/lib/library/query";
import type { ToolDetails } from "@/lib/library/tool-details";
import type { I18n } from "@/lib/i18n/translate";
import { toolProblemUrl } from "@/lib/links";
import { VERIFY } from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import { GetIt } from "./GetIt";
import { PLATFORM_META } from "./link-meta";
import styles from "./ToolDetail.module.css";

interface ToolDetailProps {
  details: ToolDetails;
  i18n: I18n;
  /** Recent official news for this tool and the time it is measured from. */
  news?: { items: readonly NewsItem[]; now: number };
}

export function ToolDetail({ details, i18n, news }: ToolDetailProps) {
  const { t, formatDate } = i18n;
  const { tool, provider, jobs, worksWith, alternatives, goals } = details;
  const freeText =
    tool.hasFreeOption === true
      ? t("tool.free.yes")
      : tool.hasFreeOption === false
        ? t("tool.free.no")
        : t("tool.free.unknown");

  return (
    <article className={styles.page}>
      <nav aria-label={t("tool.breadcrumb")} className={styles.crumbs}>
        <Link href="/tools">{t("library.title")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{tool.name}</span>
      </nav>

      <header className={styles.header}>
        <p className={styles.kind}>{t(`kind.${tool.kind}`)}</p>
        <h1 className={styles.title}>{tool.name}</h1>
        {provider ? (
          <p className={styles.provider}>
            {t("tool.by", { provider: provider.name })}
          </p>
        ) : null}
        <p className={styles.summary}>{tool.summary}</p>
        <p className={styles.status} data-verified={tool.verified}>
          {tool.verified && tool.lastVerified
            ? t("tool.verifiedOn", { date: formatDate(tool.lastVerified) })
            : t("tool.notVerified")}
        </p>
      </header>

      <section aria-labelledby="tool-jobs" className={styles.section}>
        <h2 id="tool-jobs">{t("tool.jobs")}</h2>
        <ul className={styles.chips}>
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={libraryHref({ ...DEFAULT_QUERY, job: job.id })}
                className={styles.chip}
              >
                {job.name}
                <span className={controls.srOnly}>
                  {" "}
                  {t("tool.fitFor", { score: tool.fitScores[job.id] ?? 1 })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.note}>{t("tool.fitNote")}</p>
      </section>

      <div className={styles.columns}>
        <section aria-labelledby="tool-strengths" className={styles.section}>
          <h2 id="tool-strengths">{t("tool.strengths")}</h2>
          <ul className={styles.list}>
            {tool.strengths.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="tool-watch" className={styles.section}>
          <h2 id="tool-watch">{t("tool.watchOut")}</h2>
          <ul className={styles.list}>
            {tool.watchOutFor.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="tool-facts" className={styles.section}>
        <h2 id="tool-facts">{t("tool.facts")}</h2>
        <dl className={styles.facts}>
          <div>
            <dt>{t("job.pricing")}</dt>
            <dd>
              {tool.pricing}
              {tool.pricing === VERIFY ? (
                <span className={styles.note}> {t("tool.pricingNote")}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>{t("tool.freeOption")}</dt>
            <dd>{freeText}</dd>
          </div>
          <div>
            <dt>{t("tool.skill")}</dt>
            <dd>{t(`skill.${tool.skillLevel}`)}</dd>
          </div>
          <div>
            <dt>{t("tool.platforms")}</dt>
            <dd>
              <ul className={styles.platforms}>
                {tool.platforms.map((platform) => {
                  const { Icon, label } = PLATFORM_META[platform];
                  return (
                    <li key={platform}>
                      <Icon />
                      {t(label)}
                    </li>
                  );
                })}
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      {tool.planTiers && tool.planTiers.length > 0 ? (
        <section aria-labelledby="tool-tiers" className={styles.section}>
          <h2 id="tool-tiers">{t("tool.tiers")}</h2>
          <ul className={styles.list}>
            {tool.planTiers.map((tier) => (
              <li key={tier.name}>
                <strong>{tier.name}</strong>: {tier.features}
              </li>
            ))}
          </ul>
          <p className={styles.note}>{t("tool.tiersNote")}</p>
        </section>
      ) : null}

      <section
        id="get-it"
        aria-labelledby="tool-get-it"
        className={styles.section}
      >
        <h2 id="tool-get-it">{t("getIt.title")}</h2>
        <GetIt
          toolName={tool.name}
          getIt={tool.getIt}
          officialUrl={tool.officialUrl}
        />
      </section>

      {worksWith.length > 0 ? (
        <section aria-labelledby="tool-works" className={styles.section}>
          <h2 id="tool-works">{t("tool.worksWith")}</h2>
          <ul className={styles.chips}>
            {worksWith.map((other) => (
              <li key={other.id}>
                <Link href={`/tools/${other.id}`} className={styles.chip}>
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="tool-alternatives" className={styles.section}>
        <h2 id="tool-alternatives">{t("tool.alternatives")}</h2>
        <div className={styles.alternatives}>
          {alternatives
            .filter((group) => group.tools.length > 0)
            .map(({ job, tools }) => (
              <div key={job.id}>
                <h3>{t("tool.alternativesFor", { job: job.name })}</h3>
                <ul className={styles.list}>
                  {tools.map((other) => (
                    <li key={other.id}>
                      <Link href={`/tools/${other.id}`}>{other.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </section>

      {goals.length > 0 ? (
        <section aria-labelledby="tool-goals" className={styles.section}>
          <h2 id="tool-goals">{t("tool.goals")}</h2>
          <ul className={styles.list}>
            {goals.map((goal) => (
              <li key={goal.id}>{goal.title}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {news && news.items.length > 0 ? (
        <section aria-labelledby="tool-news" className={styles.section}>
          <h2 id="tool-news">{t("tool.recentNews")}</h2>
          <ul className={styles.newsList}>
            {news.items.map((item) => (
              <li key={item.id}>
                <NewsEntry item={item} now={news.now} i18n={i18n} />
              </li>
            ))}
          </ul>
          <p>
            <Link href="/what-changed">{t("tool.recentNewsAll")}</Link>
          </p>
        </section>
      ) : null}

      <section aria-labelledby="tool-links" className={styles.section}>
        <h2 id="tool-links">{t("tool.links")}</h2>
        <div className={styles.actions}>
          <a
            href={tool.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={controls.button}
          >
            {t("job.officialPage")}
            <ExternalLinkIcon />
            <span className={controls.srOnly}>{t("job.opensInNewTab")}</span>
          </a>
          <Link href={compareHref([tool.id])} className={controls.button}>
            {t("tool.compare")}
          </Link>
          <a
            href={toolProblemUrl(tool.id)}
            target="_blank"
            rel="noopener noreferrer"
            className={controls.button}
          >
            {t("tool.report")}
            <ExternalLinkIcon />
            <span className={controls.srOnly}>{t("job.opensInNewTab")}</span>
          </a>
        </div>
      </section>
    </article>
  );
}
