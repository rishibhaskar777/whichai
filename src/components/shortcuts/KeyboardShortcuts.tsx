"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Dialog } from "@/components/dialog/Dialog";
import dialogStyles from "@/components/dialog/Dialog.module.css";
import { useI18n } from "@/lib/i18n/provider";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import controls from "@/styles/controls.module.css";
import styles from "./Shortcuts.module.css";

export const SEARCH_INPUT_ID = "goal";

/** Shortcuts must never steal keys from a text field. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

const subscribeNever = () => () => {};
const isMacPlatform = () => /Mac|iPhone|iPad/.test(navigator.platform);

export function KeyboardShortcuts() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { request: requestNewPlan } = useNewPlanSignal();
  const [open, setOpen] = useState(false);
  const mac = useSyncExternalStore(subscribeNever, isMacPlatform, () => false);
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector("dialog[open]")) return;

      const plain = !event.ctrlKey && !event.metaKey && !event.altKey;

      if (event.key === "/" && plain) {
        event.preventDefault();
        const search = document.getElementById(SEARCH_INPUT_ID);
        if (search) {
          search.focus();
        } else {
          requestNewPlan();
          router.push("/");
        }
        return;
      }

      if (event.key === "?" && plain) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      const newPlanKey =
        event.key.toLowerCase() === "o" &&
        event.shiftKey &&
        !event.altKey &&
        (mac
          ? event.metaKey && !event.ctrlKey
          : event.ctrlKey && !event.metaKey);
      if (newPlanKey) {
        event.preventDefault();
        requestNewPlan();
        if (pathname !== "/") router.push("/");
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mac, pathname, requestNewPlan, router]);

  const modifier = mac ? "⌘" : "Ctrl";
  const shortcuts: readonly { keys: string[]; label: string }[] = [
    { keys: ["/"], label: t("shortcuts.search") },
    { keys: [modifier, "Shift", "O"], label: t("shortcuts.newPlan") },
    { keys: ["?"], label: t("shortcuts.help") },
  ];

  return (
    <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
      <div className={dialogStyles.body}>
        <h2 id={titleId} className={dialogStyles.title}>
          {t("shortcuts.title")}
        </h2>
        <dl className={styles.list}>
          {shortcuts.map((shortcut) => (
            <div key={shortcut.label} className={styles.row}>
              <dt>{shortcut.label}</dt>
              <dd className={styles.keys}>
                {shortcut.keys.map((key) => (
                  <kbd key={key} className={styles.key}>
                    {key}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className={dialogStyles.text}>{t("shortcuts.note")}</p>
        <div className={dialogStyles.actions}>
          <button
            type="button"
            className={`${controls.button} ${controls.primary}`}
            onClick={() => setOpen(false)}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
