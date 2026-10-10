import { isNewItem } from "@/lib/news/select";
import type { NewsItem } from "@/lib/news/types";
import type { I18n } from "@/lib/i18n/translate";
import controls from "@/styles/controls.module.css";
import { AffectsPlansBadge } from "./AffectsPlansBadge";
import styles from "./News.module.css";
import { TagLabel } from "./TagLabel";

interface NewsEntryProps {
  item: NewsItem;
  /** Milliseconds; relative times and the New badge are measured from it. */
  now: number;
  i18n: I18n;
  showSummary?: boolean;
  /** The page decides the level so headings stay in order. */
  headingLevel?: 2 | 3;
}

/** One headline: source, age, linked title, tag and badges. All text. */
export function NewsEntry({
  item,
  now,
  i18n,
  showSummary = true,
  headingLevel = 3,
}: NewsEntryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const { t, formatRelative } = i18n;
  return (
    <article className={styles.entry}>
      <div className={styles.meta}>
        <span className={styles.source}>{item.sourceName}</span>
        <time dateTime={item.publishedAt}>
          {formatRelative(item.publishedAt, now)}
        </time>
        {isNewItem(item, now) ? (
          <span className={styles.badge}>{t("news.new")}</span>
        ) : null}
      </div>
      <Heading className={styles.title}>
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
          <span className={controls.srOnly}> {t("news.opensInNewTab")}</span>
        </a>
      </Heading>
      {showSummary && item.summary ? (
        <p className={styles.summary}>{item.summary}</p>
      ) : null}
      <div className={styles.footer}>
        <TagLabel tag={item.tag} label={t(`news.tag.${item.tag}`)} />
        <AffectsPlansBadge toolIds={item.toolIds} />
      </div>
    </article>
  );
}
