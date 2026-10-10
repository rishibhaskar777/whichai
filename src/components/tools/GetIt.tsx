"use client";

import Link from "next/link";
import { ExternalLinkIcon } from "@/components/icons";
import { CopyButton } from "@/components/copy-button/CopyButton";
import { useI18n } from "@/lib/i18n/provider";
import type { GetIt as GetItData, GetItLinkKey } from "@/lib/schemas/catalogue";
import { useVisitor } from "@/lib/use-visitor";
import controls from "@/styles/controls.module.css";
import { LINK_META, LINK_ORDER, currentLinkKeys } from "./link-meta";
import styles from "./GetIt.module.css";

interface GetItProps {
  toolName: string;
  getIt: GetItData | undefined;
  officialUrl: string;
  /** "compact" is for cards: one best button and a link to the full block. */
  variant?: "full" | "compact";
  /** Where the full block lives, for the compact variant's "more" link. */
  detailHref?: string;
}

interface Entry {
  key: GetItLinkKey;
  url: string;
  linkCheckedOn: string | null;
}

function entriesOf(getIt: GetItData | undefined): Entry[] {
  if (!getIt) return [];
  return LINK_ORDER.flatMap((key) => {
    const entry = getIt[key];
    return entry
      ? [{ key, url: entry.url, linkCheckedOn: entry.linkCheckedOn }]
      : [];
  });
}

export function GetIt({
  toolName,
  getIt,
  officialUrl,
  variant = "full",
  detailHref,
}: GetItProps) {
  const { t, formatDate } = useI18n();
  const visitor = useVisitor();
  const current = currentLinkKeys(visitor.system, visitor.browser);

  const all = entriesOf(getIt);
  // The visitor's own platform comes first, in the order of how specific it is.
  const ordered = [
    ...current.flatMap((key) => all.filter((entry) => entry.key === key)),
    ...all.filter((entry) => !current.includes(entry.key)),
  ];
  const shown = variant === "compact" ? ordered.slice(0, 1) : ordered;
  const command = getIt?.cliInstall;
  const hasAnything = ordered.length > 0 || command !== undefined;

  return (
    <div className={styles.block} data-variant={variant}>
      {hasAnything ? (
        <ul className={styles.buttons}>
          {shown.map((entry) => {
            const { Icon, label } = LINK_META[entry.key];
            const isCurrent = current.includes(entry.key);
            return (
              <li key={entry.key}>
                <a
                  className={`${controls.button} ${styles.button}`}
                  data-current={isCurrent ? "true" : undefined}
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon />
                  <span>{t(label)}</span>
                  <ExternalLinkIcon className={styles.external} />
                  <span className={controls.srOnly}>
                    {t("job.opensInNewTab")}
                  </span>
                </a>
                <span className={styles.status}>
                  {entry.linkCheckedOn
                    ? t("getIt.checked", {
                        date: formatDate(entry.linkCheckedOn),
                      })
                    : t("getIt.notChecked")}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <a
          className={`${controls.button} ${styles.button}`}
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLinkIcon />
          <span>{t("getIt.findOnSite")}</span>
          <span className={controls.srOnly}>{t("job.opensInNewTab")}</span>
        </a>
      )}

      {variant === "full" && command !== undefined ? (
        <div className={styles.command}>
          <p className={styles.commandLabel}>{t("getIt.installCommand")}</p>
          <div className={styles.commandRow}>
            <code className={styles.code}>{command}</code>
            <CopyButton
              text={command}
              label={t("getIt.copyCommand", { tool: toolName })}
            />
          </div>
          <p className={styles.hint}>{t("getIt.commandNote")}</p>
        </div>
      ) : null}

      {variant === "compact" &&
      detailHref &&
      (ordered.length > 1 || command) ? (
        <Link href={`${detailHref}#get-it`} className={styles.more}>
          {t("getIt.moreOptions")}
        </Link>
      ) : null}

      <p className={styles.safety}>{t("getIt.safety")}</p>
    </div>
  );
}
