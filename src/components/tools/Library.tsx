import Link from "next/link";
import { compareHref } from "@/lib/library/compare";
import { queryLibrary } from "@/lib/library/filter";
import {
  DEFAULT_QUERY,
  hasActiveFilters,
  libraryHref,
  type LibraryQuery,
} from "@/lib/library/query";
import type { I18n } from "@/lib/i18n/translate";
import type { Catalogue } from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import { LibraryFilters } from "./LibraryFilters";
import { ToolCard } from "./ToolCard";
import styles from "./Library.module.css";

interface LibraryProps {
  catalogue: Catalogue;
  query: LibraryQuery;
  i18n: I18n;
}

export function Library({ catalogue, query, i18n }: LibraryProps) {
  const { t, tn } = i18n;
  const { matches, pageTools, page, pageCount } = queryLibrary(
    catalogue.tools,
    catalogue.jobs,
    query,
  );
  const providers = new Map(catalogue.providers.map((p) => [p.id, p.name]));
  const jobsById = new Map(catalogue.jobs.map((job) => [job.id, job]));
  const picked = query.compare.flatMap((id) => {
    const tool = catalogue.tools.find((candidate) => candidate.id === id);
    return tool ? [tool] : [];
  });
  const pageQuery = { ...query, page };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("library.title")}</h1>
        <p className={styles.lede}>{t("library.lede")}</p>
        <p className={styles.sample}>{t("library.sample")}</p>
      </header>

      <LibraryFilters query={pageQuery} jobs={catalogue.jobs} i18n={i18n} />

      {picked.length > 0 ? (
        <section
          className={styles.tray}
          aria-label={t("library.compare.label")}
        >
          <p>
            {tn("library.compare.count", picked.length)}{" "}
            {picked.map((tool, index) => (
              <span key={tool.id}>
                {index > 0 ? ", " : ""}
                <strong>{tool.name}</strong>
              </span>
            ))}
          </p>
          <div className={styles.trayActions}>
            {picked.length >= 2 ? (
              <Link
                href={compareHref(picked.map((tool) => tool.id))}
                className={`${controls.button} ${controls.primary}`}
              >
                {t("library.compare.open")}
              </Link>
            ) : (
              <span className={styles.note}>{t("library.compare.addOne")}</span>
            )}
            <Link
              href={libraryHref(pageQuery, { compare: [] })}
              className={controls.button}
            >
              {t("library.compare.clear")}
            </Link>
          </div>
        </section>
      ) : null}

      <p role="status" className={styles.count}>
        {hasActiveFilters(query)
          ? tn("library.countFiltered", matches.length, {
              total: catalogue.tools.length,
            })
          : tn("library.count", matches.length)}
      </p>

      {matches.length === 0 ? (
        <section className={styles.empty}>
          <h2>{t("library.empty.title")}</h2>
          <p>{t("library.empty.text")}</p>
          {hasActiveFilters(query) ? (
            <Link
              href={libraryHref({ ...DEFAULT_QUERY, compare: query.compare })}
              className={controls.button}
            >
              {t("library.filters.clear")}
            </Link>
          ) : null}
        </section>
      ) : (
        <ul className={styles.grid}>
          {pageTools.map((tool) => (
            <li key={tool.id}>
              <ToolCard
                tool={tool}
                providerName={providers.get(tool.providerId) ?? tool.providerId}
                jobs={tool.jobs.flatMap((id) => {
                  const job = jobsById.get(id);
                  return job ? [job] : [];
                })}
                query={pageQuery}
                i18n={i18n}
              />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav className={styles.pagination} aria-label={t("library.pagination")}>
          {page > 1 ? (
            <Link
              href={libraryHref(pageQuery, { page: page - 1 })}
              className={controls.button}
              rel="prev"
            >
              {t("library.previous")}
            </Link>
          ) : (
            <span />
          )}
          <span>{t("library.page", { page, pages: pageCount })}</span>
          {page < pageCount ? (
            <Link
              href={libraryHref(pageQuery, { page: page + 1 })}
              className={controls.button}
              rel="next"
            >
              {t("library.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
