import {
  ChevronDownIcon,
  ExternalLinkIcon,
  NewsIcon,
} from "@/components/icons";
import type { NewsItem } from "@/data/sample/news";
import { useI18n } from "@/lib/i18n/provider";
import styles from "./NewsPanel.module.css";

export type NewsChoice = "auto" | "open" | "collapsed";

interface NewsPanelProps {
  items: readonly NewsItem[];
  choice: NewsChoice;
  expanded: boolean;
  onToggle: () => void;
}

export function NewsPanel({
  items,
  choice,
  expanded,
  onToggle,
}: NewsPanelProps) {
  const { t, formatDate } = useI18n();
  return (
    <aside
      className={styles.panel}
      data-print-hide=""
      data-choice={choice}
      aria-labelledby="news-heading"
    >
      <div className={styles.header}>
        <NewsIcon className={styles.headerIcon} />
        <h2 id="news-heading" className={styles.title}>
          {t("news.title")}
        </h2>
        <span className={styles.badge}>{t("news.sample")}</span>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls="news-list"
          aria-label={expanded ? t("news.collapse") : t("news.expand")}
        >
          <ChevronDownIcon className={styles.chevron} />
        </button>
      </div>

      <ul id="news-list" className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <article className={styles.article}>
              <div className={styles.meta}>
                <span className={styles.source}>{item.source}</span>
                <time dateTime={item.date} className={styles.date}>
                  {formatDate(item.date, "short", "UTC")}
                </time>
              </div>
              <p className={styles.summary}>{item.summary}</p>
              <div className={styles.footer}>
                <span className={styles.tag}>
                  <span
                    className={styles.dot}
                    data-tag={item.tag}
                    aria-hidden="true"
                  />
                  {item.tag}
                </span>
                <a
                  href={item.url}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("news.visit", { source: item.source })}
                >
                  <ExternalLinkIcon width="16" height="16" />
                </a>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </aside>
  );
}
