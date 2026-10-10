import Link from "next/link";
import type { I18n } from "@/lib/i18n/translate";
import {
  DEFAULT_NEWS_QUERY,
  hasActiveNewsFilters,
  newsHref,
  queryNews,
  type NewsQuery,
} from "@/lib/news/query";
import type { NewsSnapshot } from "@/lib/news/service";
import { NEWS_TAGS } from "@/lib/news/types";
import controls from "@/styles/controls.module.css";
import { NewsEntry } from "./NewsEntry";
import styles from "./WhatChanged.module.css";

interface WhatChangedProps {
  snapshot: NewsSnapshot;
  query: NewsQuery;
  i18n: I18n;
}

/**
 * Server-rendered. The filters are a plain GET form, so every state is in
 * the URL and the page works without JavaScript.
 */
export function WhatChanged({ snapshot, query, i18n }: WhatChangedProps) {
  const { t, tn, formatRelative } = i18n;
  const now = Date.parse(snapshot.generatedAt);
  const { matches, pageItems, page, pageCount } = queryNews(
    snapshot.items,
    query,
  );
  const pageQuery = { ...query, page };
  const unavailable = snapshot.allFailed || snapshot.items.length === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("nav.whatChanged")}</h1>
        <p className={styles.lede}>{t("whatChanged.lede")}</p>
        <p className={styles.note}>
          {t("news.sourceNote")}.{" "}
          {snapshot.lastUpdated
            ? t("news.updated", {
                time: formatRelative(snapshot.lastUpdated, now),
              })
            : null}
        </p>
        <p className={styles.note}>
          {t("whatChanged.sources", { count: snapshot.sources.length })}
        </p>
      </header>

      {unavailable ? (
        <section className={styles.status} role="status">
          <p className={styles.statusTitle}>{t("news.unavailable")}</p>
          <p>
            {snapshot.lastUpdated
              ? t("news.lastSuccess", {
                  time: formatRelative(snapshot.lastUpdated, now),
                })
              : t("news.neverUpdated")}
          </p>
        </section>
      ) : null}

      <form
        method="get"
        action="/what-changed"
        role="search"
        aria-label={t("whatChanged.filters.label")}
        className={styles.filters}
      >
        <label className={`${styles.field} ${styles.wide}`}>
          <span>{t("whatChanged.filters.search")}</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q}
            maxLength={80}
            placeholder={t("whatChanged.filters.searchPlaceholder")}
            className={styles.input}
          />
        </label>

        <label className={styles.field}>
          <span>{t("whatChanged.filters.tag")}</span>
          <select
            name="tag"
            defaultValue={query.tag ?? ""}
            className={styles.input}
          >
            <option value="">{t("whatChanged.filters.any")}</option>
            {NEWS_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {t(`news.tag.${tag}`)}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>{t("whatChanged.filters.source")}</span>
          <select
            name="source"
            defaultValue={query.source ?? ""}
            className={styles.input}
          >
            <option value="">{t("whatChanged.filters.any")}</option>
            {snapshot.sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </label>

        <div className={`${styles.actions} ${styles.wide}`}>
          <button
            type="submit"
            className={`${controls.button} ${controls.primary}`}
          >
            {t("whatChanged.filters.apply")}
          </button>
          {hasActiveNewsFilters(query) ? (
            <Link href="/what-changed" className={controls.button}>
              {t("whatChanged.filters.clear")}
            </Link>
          ) : null}
        </div>
      </form>

      <p role="status" className={styles.count}>
        {hasActiveNewsFilters(query)
          ? tn("whatChanged.countFiltered", matches.length, {
              total: snapshot.items.length,
            })
          : tn("whatChanged.count", matches.length)}
      </p>

      {matches.length === 0 ? (
        <section className={styles.empty}>
          <h2>{t("whatChanged.empty.title")}</h2>
          <p>{t("whatChanged.empty.text")}</p>
          {hasActiveNewsFilters(query) ? (
            <Link
              href={newsHref(DEFAULT_NEWS_QUERY)}
              className={controls.button}
            >
              {t("whatChanged.filters.clear")}
            </Link>
          ) : null}
        </section>
      ) : (
        <ul className={styles.list}>
          {pageItems.map((item) => (
            <li key={item.id} className={styles.item}>
              <NewsEntry item={item} now={now} i18n={i18n} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav
          className={styles.pagination}
          aria-label={t("whatChanged.pagination")}
        >
          {page > 1 ? (
            <Link
              href={newsHref(pageQuery, { page: page - 1 })}
              className={controls.button}
              rel="prev"
            >
              {t("whatChanged.previous")}
            </Link>
          ) : (
            <span />
          )}
          <span>{t("whatChanged.page", { page, pages: pageCount })}</span>
          {page < pageCount ? (
            <Link
              href={newsHref(pageQuery, { page: page + 1 })}
              className={controls.button}
              rel="next"
            >
              {t("whatChanged.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
