import {
  ChevronDownIcon,
  ExternalLinkIcon,
  NewsIcon,
} from "@/components/icons";
import type { NewsItem } from "@/data/sample/news";
import styles from "./NewsPanel.module.css";

export type NewsChoice = "auto" | "open" | "collapsed";

interface NewsPanelProps {
  items: readonly NewsItem[];
  choice: NewsChoice;
  expanded: boolean;
  onToggle: () => void;
}

const dateFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function NewsPanel({
  items,
  choice,
  expanded,
  onToggle,
}: NewsPanelProps) {
  return (
    <aside
      className={styles.panel}
      data-choice={choice}
      aria-labelledby="news-heading"
    >
      <div className={styles.header}>
        <NewsIcon className={styles.headerIcon} />
        <div className={styles.titles}>
          <h2 id="news-heading" className={styles.title}>
            AI news
          </h2>
          <p className={styles.sample}>Sample content</p>
        </div>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls="news-list"
          aria-label={expanded ? "Collapse AI news" : "Expand AI news"}
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
                <time dateTime={item.date}>
                  {dateFormat.format(new Date(item.date))}
                </time>
              </div>
              <p className={styles.summary}>{item.summary}</p>
              <div className={styles.footer}>
                <span className={styles.tag}>{item.tag}</span>
                <a
                  href={item.url}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit {item.source}
                  <span className={styles.srOnly}> (opens in a new tab)</span>
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
