import Link from "next/link";
import { compareHref } from "@/lib/library/compare";
import { MAX_COMPARE } from "@/lib/library/query";
import type { I18n } from "@/lib/i18n/translate";
import type { Catalogue, Tool } from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import { GetIt } from "./GetIt";
import { PLATFORM_META } from "./link-meta";
import styles from "./Compare.module.css";

interface CompareViewProps {
  catalogue: Catalogue;
  selected: readonly string[];
  /** Text the person typed that matched no tool, to say so. */
  unmatched: string | null;
  i18n: I18n;
}

export function CompareView({
  catalogue,
  selected,
  unmatched,
  i18n,
}: CompareViewProps) {
  const { t, tn, formatDate } = i18n;
  const tools = selected.flatMap((id) => {
    const tool = catalogue.tools.find((candidate) => candidate.id === id);
    return tool ? [tool] : [];
  });
  const jobNames = new Map(catalogue.jobs.map((job) => [job.id, job.name]));
  const toolNames = new Map(
    catalogue.tools.map((tool) => [tool.id, tool.name]),
  );
  const canAdd = tools.length < MAX_COMPARE;

  const freeText = (tool: Tool) =>
    tool.hasFreeOption === true
      ? t("tool.free.yes")
      : tool.hasFreeOption === false
        ? t("tool.free.no")
        : t("tool.free.unknown");

  const rows: { label: string; cell: (tool: Tool) => React.ReactNode }[] = [
    { label: t("compare.row.kind"), cell: (tool) => t(`kind.${tool.kind}`) },
    {
      label: t("compare.row.jobs"),
      cell: (tool) => (
        <ul className={styles.plain}>
          {tool.jobs.map((id) => (
            <li key={id}>{jobNames.get(id) ?? id}</li>
          ))}
        </ul>
      ),
    },
    { label: t("compare.row.free"), cell: freeText },
    { label: t("compare.row.pricing"), cell: (tool) => tool.pricing },
    {
      label: t("compare.row.platforms"),
      cell: (tool) => (
        <ul className={styles.plain}>
          {tool.platforms.map((platform) => {
            const { Icon, label } = PLATFORM_META[platform];
            return (
              <li key={platform} className={styles.iconRow}>
                <Icon />
                {t(label)}
              </li>
            );
          })}
        </ul>
      ),
    },
    {
      label: t("compare.row.strengths"),
      cell: (tool) => (
        <ul className={styles.bullets}>
          {tool.strengths.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      ),
    },
    {
      label: t("compare.row.watchOut"),
      cell: (tool) => (
        <ul className={styles.bullets}>
          {tool.watchOutFor.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      ),
    },
    {
      label: t("compare.row.worksWith"),
      cell: (tool) =>
        tool.worksWith.length === 0 ? (
          <span className={styles.muted}>{t("compare.none")}</span>
        ) : (
          <ul className={styles.plain}>
            {tool.worksWith.map((id) => (
              <li key={id}>{toolNames.get(id) ?? id}</li>
            ))}
          </ul>
        ),
    },
    {
      label: t("compare.row.status"),
      cell: (tool) =>
        tool.verified && tool.lastVerified
          ? t("tool.verifiedOn", { date: formatDate(tool.lastVerified) })
          : t("tool.notVerified"),
    },
    {
      label: t("compare.row.getIt"),
      cell: (tool) => (
        <GetIt
          toolName={tool.name}
          getIt={tool.getIt}
          officialUrl={tool.officialUrl}
          variant="compact"
          detailHref={`/tools/${tool.id}`}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("compare.title")}</h1>
        <p className={styles.lede}>{t("compare.lede")}</p>
      </header>

      <section className={styles.picker} aria-label={t("compare.picker")}>
        {tools.length > 0 ? (
          <ul className={styles.selected}>
            {tools.map((tool) => (
              <li key={tool.id} className={styles.pill}>
                <Link href={`/tools/${tool.id}`}>{tool.name}</Link>
                <Link
                  href={compareHref(selected.filter((id) => id !== tool.id))}
                  className={styles.remove}
                >
                  {t("compare.remove")}
                  <span className={controls.srOnly}> {tool.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {canAdd ? (
          <form method="get" action="/compare" className={styles.add}>
            {tools.length > 0 ? (
              <input type="hidden" name="tools" value={selected.join(",")} />
            ) : null}
            <label className={styles.addField}>
              <span>{t("compare.add")}</span>
              <input
                type="search"
                name="add"
                list="compare-suggestions"
                autoComplete="off"
                maxLength={80}
                placeholder={t("compare.addPlaceholder")}
                className={styles.input}
              />
            </label>
            <datalist id="compare-suggestions">
              {catalogue.tools
                .filter((tool) => !selected.includes(tool.id))
                .map((tool) => (
                  <option key={tool.id} value={tool.name} />
                ))}
            </datalist>
            <button
              type="submit"
              className={`${controls.button} ${controls.primary}`}
            >
              {t("compare.addButton")}
            </button>
          </form>
        ) : (
          <p className={styles.muted}>{t("compare.full")}</p>
        )}

        {unmatched ? (
          <p role="status" className={styles.warning}>
            {t("compare.noMatch", { text: unmatched })}
          </p>
        ) : null}
      </section>

      {tools.length === 0 ? (
        <section className={styles.empty}>
          <h2>{t("compare.empty.title")}</h2>
          <p>{t("compare.empty.text")}</p>
          <Link href="/tools" className={controls.button}>
            {t("compare.empty.browse")}
          </Link>
        </section>
      ) : (
        <>
          {tools.length === 1 ? (
            <p className={styles.muted}>{t("compare.addOne")}</p>
          ) : null}
          <p className={styles.swipe}>{t("compare.swipe")}</p>
          <div
            className={styles.scroller}
            role="region"
            aria-label={tn("compare.region", tools.length)}
            tabIndex={0}
          >
            <table className={styles.table}>
              <caption className={controls.srOnly}>
                {t("compare.caption")}
              </caption>
              <thead>
                <tr>
                  <td className={styles.corner} />
                  {tools.map((tool) => (
                    <th key={tool.id} scope="col" className={styles.colHead}>
                      <Link href={`/tools/${tool.id}`}>{tool.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className={styles.rowHead}>
                      {row.label}
                    </th>
                    {tools.map((tool) => (
                      <td key={tool.id} className={styles.cell}>
                        {row.cell(tool)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
