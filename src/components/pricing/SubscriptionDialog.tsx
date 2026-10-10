"use client";

import Link from "next/link";
import { useId } from "react";
import { Dialog } from "@/components/dialog/Dialog";
import dialog from "@/components/dialog/Dialog.module.css";
import { useI18n } from "@/lib/i18n/provider";
import controls from "@/styles/controls.module.css";

interface SubscriptionDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Shown wherever a person tries to pay or manage a subscription. */
export function SubscriptionDialog({ open, onClose }: SubscriptionDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const textId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={textId}
    >
      <div className={dialog.body}>
        <h2 id={titleId} className={dialog.title}>
          {t("subscription.dialog.title")}
        </h2>
        <p id={textId} className={dialog.text}>
          {t("subscription.dialog.text")}
        </p>
        <div className={dialog.actions}>
          <Link href="/pricing" className={controls.button} onClick={onClose}>
            {t("subscription.dialog.back")}
          </Link>
          <button
            type="button"
            className={`${controls.button} ${controls.primary}`}
            onClick={onClose}
          >
            {t("subscription.dialog.close")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
