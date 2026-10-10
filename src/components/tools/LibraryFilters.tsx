import Link from "next/link";
import type { I18n } from "@/lib/i18n/translate";
import {
  SORTS,
  hasActiveFilters,
  type LibraryQuery,
} from "@/lib/library/query";
import {
  JOB_CATEGORIES,
  platformSchema,
  toolKindSchema,
  type Job,
} from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import styles from "./Library.module.css";

interface LibraryFiltersProps {
  query: LibraryQuery;
  jobs: readonly Job[];
  i18n: I18n;
}

/**
 * A plain GET form: it works without JavaScript, every state lives in the
 * URL, and the browser gives keyboard and screen reader support for free.
 */
export function LibraryFilters({ query, jobs, i18n }: LibraryFiltersProps) {
  const { t } = i18n;

  return (
    <form
      method="get"
      action="/tools"
      role="search"
      aria-label={t("library.filters.label")}
      className={styles.filters}
    >
      <label className={`${styles.field} ${styles.wide}`}>
        <span>{t("library.filters.search")}</span>
        <input
          type="search"
          name="q"
          defaultValue={query.q}
          maxLength={80}
          placeholder={t("library.filters.searchPlaceholder")}
          className={styles.input}
        />
      </label>

      <label className={styles.field}>
        <span>{t("library.filters.category")}</span>
        <select
          name="category"
          defaultValue={query.category ?? ""}
          className={styles.input}
        >
          <option value="">{t("library.filters.any")}</option>
          {JOB_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`category.${category}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>{t("library.filters.job")}</span>
        <select
          name="job"
          defaultValue={query.job ?? ""}
          className={styles.input}
        >
          <option value="">{t("library.filters.any")}</option>
          {JOB_CATEGORIES.map((category) => (
            <optgroup key={category} label={t(`category.${category}`)}>
              {jobs
                .filter((job) => job.category === category)
                .map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>{t("library.filters.kind")}</span>
        <select
          name="kind"
          defaultValue={query.kind ?? ""}
          className={styles.input}
        >
          <option value="">{t("library.filters.any")}</option>
          {toolKindSchema.options.map((kind) => (
            <option key={kind} value={kind}>
              {t(`kind.${kind}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>{t("library.filters.platform")}</span>
        <select
          name="platform"
          defaultValue={query.platform ?? ""}
          className={styles.input}
        >
          <option value="">{t("library.filters.any")}</option>
          {platformSchema.options.map((platform) => (
            <option key={platform} value={platform}>
              {t(`platform.${platform}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>{t("library.filters.sort")}</span>
        <select name="sort" defaultValue={query.sort} className={styles.input}>
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t(`library.sort.${sort}`)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={`${styles.checks} ${styles.wide}`}>
        <legend className={controls.srOnly}>{t("library.filters.only")}</legend>
        <label className={styles.check}>
          <input
            type="checkbox"
            name="free"
            value="1"
            defaultChecked={query.free}
          />
          <span>{t("library.filters.free")}</span>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            name="verified"
            value="1"
            defaultChecked={query.verifiedOnly}
          />
          <span>{t("library.filters.verified")}</span>
        </label>
      </fieldset>

      {query.compare.length > 0 ? (
        <input type="hidden" name="compare" value={query.compare.join(",")} />
      ) : null}

      <div className={`${styles.actions} ${styles.wide}`}>
        <button
          type="submit"
          className={`${controls.button} ${controls.primary}`}
        >
          {t("library.filters.apply")}
        </button>
        {hasActiveFilters(query) ? (
          <Link
            href={
              query.compare.length > 0
                ? `/tools?compare=${query.compare.join(",")}`
                : "/tools"
            }
            className={controls.button}
          >
            {t("library.filters.clear")}
          </Link>
        ) : null}
      </div>
      <p className={`${styles.note} ${styles.wide}`}>
        {t("library.filters.freeNote")}
      </p>
    </form>
  );
}
