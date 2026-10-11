"use client";

import { useId, useState } from "react";
import { CopyButton } from "@/components/copy-button/CopyButton";
import { ChevronDownIcon, ExternalLinkIcon } from "@/components/icons";
import { GetIt } from "@/components/tools/GetIt";
import { useI18n } from "@/lib/i18n/provider";
import type { GetMore as GetMoreData } from "@/lib/schemas/plan";
import controls from "@/styles/controls.module.css";
import styles from "./GetMore.module.css";

interface GetMoreProps {
  toolName: string;
  data: GetMoreData;
  starterPrompt: string;
}

function SourceLink({ href, label }: { href: string; label: string }) {
  const { t } = useI18n();
  return (
    <a
      className={styles.source}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      <ExternalLinkIcon />
      <span className={controls.srOnly}>{t("job.opensInNewTab")}</span>
    </a>
  );
}

/**
 * A quiet disclosure under an AI tool's card. Each part appears only when its
 * data was recorded; the section itself is left out when the tool has none.
 */
export function GetMore({ toolName, data, starterPrompt }: GetMoreProps) {
  const { t, formatDate } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const { models } = data;

  return (
    <div className={styles.more}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {t("getMore.toggle", { tool: toolName })}
        <ChevronDownIcon />
      </button>
      <div id={panelId} className={styles.panel} data-open={open}>
        <div className={styles.panelInner} inert={!open}>
          <div className={styles.body}>
            {models || data.classAdvice.length > 0 ? (
              <section className={styles.part}>
                <h4>{t("getMore.model")}</h4>
                {models ? (
                  <>
                    <p>
                      {t("getMore.modelsAsOf", {
                        date: formatDate(models.checkedOn),
                      })}
                    </p>
                    <ul>
                      {models.classes.map((entry) => (
                        <li key={entry.modelClass}>
                          <strong>{entry.modelClass}</strong>:{" "}
                          {entry.names.join(", ")}
                        </li>
                      ))}
                    </ul>
                    <SourceLink
                      href={models.url}
                      label={t("getMore.modelsSource")}
                    />
                  </>
                ) : (
                  <>
                    <p>{t("getMore.classesOnly")}</p>
                    <ul>
                      {data.classAdvice.map((entry) => (
                        <li key={entry.modelClass}>
                          <strong>{entry.modelClass}</strong>: {entry.useFor}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            ) : null}

            {data.tips.length > 0 ? (
              <section className={styles.part}>
                <h4>{t("getMore.tips")}</h4>
                <ul>
                  {data.tips.map((tip) => (
                    <li key={tip.text}>
                      {tip.text}{" "}
                      {tip.sourceUrl ? (
                        <SourceLink
                          href={tip.sourceUrl}
                          label={t("getMore.tipSource")}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
                {data.tipsCheckedOn ? (
                  <p className={styles.note}>
                    {t("getMore.tipsChecked", {
                      date: formatDate(data.tipsCheckedOn),
                    })}
                  </p>
                ) : null}
              </section>
            ) : null}

            {data.addOns.length > 0 ? (
              <section className={styles.part}>
                <h4>{t("getMore.addOns")}</h4>
                <ul className={styles.addOns}>
                  {data.addOns.map((addOn) => (
                    <li key={addOn.toolId}>
                      <p>
                        <strong>{addOn.toolName}</strong>
                        <span className={styles.kind}>
                          {t(`kind.${addOn.kind}`)}
                        </span>
                      </p>
                      <GetIt
                        toolName={addOn.toolName}
                        getIt={addOn.getIt ?? undefined}
                        officialUrl={addOn.officialUrl}
                        variant="compact"
                        detailHref={`/tools/${addOn.toolId}`}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {data.freePlanTips.length > 0 ? (
              <section className={styles.part}>
                <h4>{t("getMore.freePlan")}</h4>
                <ul>
                  {data.freePlanTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className={styles.part}>
              <h4>{t("getMore.prompt")}</h4>
              <p className={styles.prompt}>{starterPrompt}</p>
              <CopyButton
                text={starterPrompt}
                label={t("getMore.copyPrompt", { tool: toolName })}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
