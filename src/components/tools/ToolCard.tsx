import Link from "next/link";
import type { I18n } from "@/lib/i18n/translate";
import {
  DEFAULT_QUERY,
  MAX_COMPARE,
  libraryHref,
  type LibraryQuery,
} from "@/lib/library/query";
import { toggleSelection } from "@/lib/library/compare";
import type { Job, Tool } from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import { GetIt } from "./GetIt";
import { PLATFORM_META } from "./link-meta";
import styles from "./ToolCard.module.css";

interface ToolCardProps {
  tool: Tool;
  providerName: string;
  jobs: readonly Job[];
  query: LibraryQuery;
  i18n: I18n;
}

export function ToolCard({
  tool,
  providerName,
  jobs,
  query,
  i18n,
}: ToolCardProps) {
  const { t, formatDate } = i18n;
  const href = `/tools/${tool.id}`;
  const picked = query.compare.includes(tool.id);
  const full = !picked && query.compare.length >= MAX_COMPARE;
  const compareHref = libraryHref(query, {
    compare: toggleSelection(query.compare, tool.id),
  });
  const titleId = `tool-${tool.id}-title`;

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.name}>
          <Link href={href} className={styles.nameLink}>
            {tool.name}
          </Link>
        </h2>
        <p className={styles.meta}>
          <span>{providerName}</span>
          <span className={styles.kind}>{t(`kind.${tool.kind}`)}</span>
        </p>
      </header>

      <p className={styles.summary}>{tool.summary}</p>

      <ul className={styles.chips} aria-label={t("library.card.jobs")}>
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              href={libraryHref({
                ...DEFAULT_QUERY,
                job: job.id,
                compare: query.compare,
              })}
              className={styles.chip}
            >
              {job.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.facts}>
        {tool.hasFreeOption === true ? (
          <span className={styles.badge} data-tone="free">
            {t("library.card.free")}
          </span>
        ) : null}
        <span className={styles.badge}>
          {tool.verified && tool.lastVerified
            ? t("library.card.verifiedOn", {
                date: formatDate(tool.lastVerified),
              })
            : t("library.card.notVerified")}
        </span>
        <ul
          className={styles.platforms}
          aria-label={t("library.card.platforms")}
        >
          {tool.platforms.map((platform) => {
            const { Icon, label } = PLATFORM_META[platform];
            return (
              <li key={platform} title={t(label)}>
                <Icon />
                <span className={controls.srOnly}>{t(label)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <GetIt
        toolName={tool.name}
        getIt={tool.getIt}
        officialUrl={tool.officialUrl}
        variant="compact"
        detailHref={href}
      />

      <footer className={styles.footer}>
        <Link href={href} className={styles.details}>
          {t("library.card.details")}
          <span className={controls.srOnly}> {tool.name}</span>
        </Link>
        {full ? (
          <span className={styles.compareFull}>
            {t("library.card.compareFull")}
          </span>
        ) : (
          <Link
            href={compareHref}
            className={styles.compare}
            data-picked={picked ? "true" : undefined}
            prefetch={false}
          >
            {picked
              ? t("library.card.removeCompare")
              : t("library.card.addCompare")}
            <span className={controls.srOnly}> {tool.name}</span>
          </Link>
        )}
      </footer>
    </article>
  );
}
