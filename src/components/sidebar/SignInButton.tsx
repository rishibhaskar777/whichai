"use client";

import { UserIcon } from "@/components/icons";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import styles from "./SidebarContent.module.css";

export function SignInButton({ collapsed }: { collapsed: boolean }) {
  const { open } = useSignIn();
  return (
    <button
      type="button"
      className={styles.action}
      aria-haspopup="dialog"
      onClick={(event) => open(event.currentTarget)}
    >
      <UserIcon />
      <span className={collapsed ? styles.srOnly : styles.label}>Sign in</span>
    </button>
  );
}
