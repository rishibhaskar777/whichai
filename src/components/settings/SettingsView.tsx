"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { DownloadIcon } from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { StorageNotice } from "@/components/local-data/StorageNotice";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import { useToast } from "@/components/toast/ToastProvider";
import type { Viewer } from "@/lib/auth/get-session";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/locales";
import { BUDGET_VALUES, budgetLabel } from "@/lib/plan/budget-labels";
import { FEEDBACK_URL, REPOSITORY_URL, SECURITY_POLICY_URL } from "@/lib/links";
import { LEVELS } from "@/lib/schemas/plan";
import { downloadTextFile } from "@/lib/storage/download";
import { backupFileName } from "@/lib/storage/operations";
import controls from "@/styles/controls.module.css";
import Link from "next/link";
import { ImportData } from "./ImportData";
import {
  RadioSetting,
  SelectSetting,
  SettingRow,
  SwitchSetting,
} from "./SettingsControls";
import styles from "./Settings.module.css";

const PROVIDER_NAMES = { google: "Google", github: "GitHub" } as const;

interface SettingsViewProps {
  viewer: Viewer | null;
  version: string;
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.panelTitle}>
        {title}
      </h2>
      <div className={styles.rows}>{children}</div>
    </section>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  const { t } = useI18n();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
      <span className={controls.srOnly}>{t("link.newTab")}</span>
    </a>
  );
}

export function SettingsView({ viewer, version }: SettingsViewProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const router = useRouter();
  const { show } = useToast();
  const { open: openSignIn } = useSignIn();
  const { settings, updateSettings, exportBackup, clearAll } = useLocalData();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const titleId = useId();

  async function clearEverything() {
    setConfirmingClear(false);
    const result = await clearAll();
    if (!result.ok) return;
    show({ message: t("settings.cleared") });
    router.refresh();
  }

  const budgetOptions = [
    { value: "none", label: t("settings.budget.none") },
    ...BUDGET_VALUES.map((value) => ({
      value,
      label: budgetLabel(value, settings.currencyDisplay, i18n),
    })),
  ] as const;

  return (
    <div className={styles.page}>
      <header>
        <h1 id={titleId} className={styles.title}>
          {t("settings.title")}
        </h1>
        <p className={styles.lede}>{t("settings.lede")}</p>
      </header>

      <StorageNotice />

      <Panel title={t("settings.general")}>
        <RadioSetting<Locale>
          label={t("settings.language")}
          help={t("settings.language.help")}
          value={settings.language}
          options={[
            { value: "en", label: "English", lang: "en" },
            { value: "hi", label: "हिन्दी", lang: "hi" },
          ]}
          onChange={(language) => void updateSettings({ language })}
        />
        <RadioSetting
          label={t("settings.theme")}
          help={t("settings.theme.help")}
          value={settings.theme}
          options={[
            { value: "system", label: t("theme.system") },
            { value: "light", label: t("theme.light") },
            { value: "dark", label: t("theme.dark") },
          ]}
          onChange={(theme) => void updateSettings({ theme })}
        />
        <RadioSetting
          label={t("settings.motion")}
          help={t("settings.motion.help")}
          value={settings.reduceMotion}
          options={[
            { value: "system", label: t("theme.system") },
            { value: "on", label: t("common.on") },
            { value: "off", label: t("common.off") },
          ]}
          onChange={(reduceMotion) => void updateSettings({ reduceMotion })}
        />
        <SelectSetting
          label={t("settings.level")}
          help={t("settings.level.help")}
          value={settings.defaultLevel}
          options={[
            { value: "auto", label: t("settings.level.auto") },
            ...LEVELS.map((level) => ({
              value: level,
              label: t(`level.${level}`),
            })),
          ]}
          onChange={(defaultLevel) => void updateSettings({ defaultLevel })}
        />
        <SelectSetting
          label={t("settings.budget")}
          help={t("settings.budget.help")}
          value={settings.defaultBudget ?? "none"}
          options={budgetOptions}
          onChange={(value) =>
            void updateSettings({
              defaultBudget: value === "none" ? null : value,
            })
          }
        />
        <RadioSetting
          label={t("settings.currency")}
          help={t("settings.currency.help")}
          value={settings.currencyDisplay}
          options={[
            { value: "₹", label: "₹" },
            { value: "$", label: "$" },
          ]}
          onChange={(currencyDisplay) =>
            void updateSettings({ currencyDisplay })
          }
        />
      </Panel>

      <Panel title={t("settings.privacy")}>
        <SwitchSetting
          label={t("settings.history")}
          help={t("settings.history.help")}
          checked={settings.saveHistory}
          onChange={(saveHistory) => void updateSettings({ saveHistory })}
        />
        <SettingRow
          label={t("settings.export")}
          help={t("settings.export.help")}
        >
          {() => (
            <button
              type="button"
              className={controls.button}
              onClick={() => downloadTextFile(backupFileName(), exportBackup())}
            >
              <DownloadIcon width="16" height="16" />
              {t("settings.export")}
            </button>
          )}
        </SettingRow>
        <div className={styles.row}>
          <div className={styles.rowText}>
            <p className={styles.rowLabel}>{t("settings.import")}</p>
            <p className={styles.rowHelp}>{t("settings.import.help")}</p>
          </div>
          <div className={styles.rowControl}>
            <ImportData />
          </div>
        </div>
        <SettingRow label={t("settings.clear")} help={t("settings.clear.help")}>
          {() => (
            <button
              type="button"
              className={`${controls.button} ${styles.danger}`}
              onClick={() => setConfirmingClear(true)}
            >
              {t("settings.clear.button")}
            </button>
          )}
        </SettingRow>
      </Panel>

      <Panel title={t("settings.account")}>
        <div className={styles.row}>
          <div className={styles.rowText}>
            <p className={styles.accountLine}>
              {viewer
                ? t("settings.account.signedIn", {
                    name: viewer.name,
                    provider: PROVIDER_NAMES[viewer.provider],
                  })
                : t("settings.account.signedOut")}
            </p>
          </div>
          <div className={styles.rowControl}>
            {viewer ? (
              <form method="post" action="/api/auth/sign-out">
                <input type="hidden" name="csrf" value={viewer.signOutToken} />
                <button type="submit" className={controls.button}>
                  {t("nav.signOut")}
                </button>
              </form>
            ) : (
              <button
                type="button"
                className={controls.button}
                aria-haspopup="dialog"
                onClick={(event) => openSignIn(event.currentTarget)}
              >
                {t("settings.account.signIn")}
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title={t("settings.about")}>
        <div className={styles.row}>
          <div className={styles.rowText}>
            <p className={styles.rowLabel}>WhichAI</p>
            <p className={styles.rowHelp}>
              {t("settings.about.version", { version })}
            </p>
          </div>
          <ul className={styles.links}>
            <li>
              <Link href="/about">{t("settings.about.about")}</Link>
            </li>
            <li>
              <Link href="/help">{t("settings.about.help")}</Link>
            </li>
            <li>
              <Link href="/privacy">{t("settings.about.privacy")}</Link>
            </li>
            <li>
              <ExternalLink
                href={SECURITY_POLICY_URL}
                label={t("settings.about.security")}
              />
            </li>
            <li>
              <ExternalLink
                href={REPOSITORY_URL}
                label={t("settings.about.github")}
              />
            </li>
            <li>
              <ExternalLink
                href={FEEDBACK_URL}
                label={t("settings.about.feedback")}
              />
            </li>
          </ul>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirmingClear}
        title={t("settings.clear.title")}
        description={t("settings.clear.text")}
        confirmLabel={t("settings.clear.confirm")}
        requireText="CLEAR"
        danger
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => void clearEverything()}
      />
    </div>
  );
}
