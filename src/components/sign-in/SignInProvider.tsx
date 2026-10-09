"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CloseIcon } from "@/components/icons";
import type { ProviderAvailability } from "@/lib/auth/config";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { SignInPanel } from "./SignInPanel";
import styles from "./SignIn.module.css";

interface SignInContextValue {
  /* Pass the button that was pressed so focus can return to it on close. */
  open: (opener: HTMLElement) => void;
}

const SignInContext = createContext<SignInContextValue | null>(null);

export function useSignIn(): SignInContextValue {
  const context = useContext(SignInContext);
  if (!context) throw new Error("useSignIn must be used inside SignInProvider");
  return context;
}

interface SignInProviderProps {
  providers: ProviderAvailability;
  children: ReactNode;
}

export function SignInProvider({ providers, children }: SignInProviderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  // A new key remounts the panel, which clears a stuck loading state.
  const [openCount, setOpenCount] = useState(0);

  const open = useCallback((opener: HTMLElement) => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    openerRef.current = opener;
    setOpenCount((count) => count + 1);
    dialog.showModal();
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <SignInContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="sign-in-dialog-title"
        onClose={() => {
          openerRef.current?.focus();
          openerRef.current = null;
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <SignInPanel
          key={openCount}
          providers={providers}
          next={safeRedirectPath(pathname)}
          headingLevel="h2"
          titleId="sign-in-dialog-title"
          onNavigate={close}
        />
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close sign-in"
        >
          <CloseIcon />
        </button>
      </dialog>
    </SignInContext.Provider>
  );
}
