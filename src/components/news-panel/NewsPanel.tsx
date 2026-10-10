import Link from "next/link";
import { ChevronDownIcon, NewsIcon } from "@/components/icons";
import { NewsEntry } from "@/components/news/NewsEntry";
import { useI18n } from "@/lib/i18n/provider";
import type { PanelNews } from "@/lib/news/types";
import styles from "./NewsPanel.module.css";

export type NewsChoice = "auto" | "open" | "collapsed";

interface NewsPanelProps {
  news: PanelNews;
  choice: NewsChoice;
  expanded: boolean;
  onToggle: () => void;
}

export function NewsPanel({
  news,
  choice,
  expanded,
  onToggle,
}: NewsPanelProps) {
  const i18n = useI18n();
  const { t, formatRelative } = i18n;
  const now = Date.parse(news.now);
  const unavailable = news.allFailed || news.items.length === 0;

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

      <div id="news-list" className={styles.body}>
        <p className={styles.note}>{t("news.sourceNote")}</p>
        {news.lastUpdated ? (
          <p className={styles.note}>
            {t("news.updated", {
              time: formatRelative(news.lastUpdated, now),
            })}
          </p>
        ) : null}

        {unavailable ? (
          <div className={styles.state} role="status">
            <p className={styles.stateTitle}>{t("news.unavailable")}</p>
            <p>
              {news.lastUpdated
                ? t("news.lastSuccess", {
                    time: formatRelative(news.lastUpdated, now),
                  })
                : t("news.neverUpdated")}
            </p>
          </div>
        ) : null}

        {news.items.length > 0 ? (
          <ul className={styles.list}>
            {news.items.map((item) => (
              <li key={item.id} className={styles.item}>
                <NewsEntry
                  item={item}
                  now={now}
                  i18n={i18n}
                  showSummary={false}
                />
              </li>
            ))}
          </ul>
        ) : null}

        <Link href="/what-changed" className={styles.seeAll}>
          {t("news.seeAll")}
        </Link>
      </div>
    </aside>
  );
}
