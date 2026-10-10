"use client";

import { useState } from "react";
import controls from "@/styles/controls.module.css";
import { SubscriptionDialog } from "./SubscriptionDialog";
import styles from "./Pricing.module.css";

interface PayButtonProps {
  label: string;
}

/**
 * Opens the "payments are not open" dialog. There is no form and no request:
 * nothing is sent anywhere and no payment details are asked for.
 */
export function PayButton({ label }: PayButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`${controls.button} ${controls.primary} ${styles.payButton}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <SubscriptionDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
