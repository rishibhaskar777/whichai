"use client";

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
import { useI18n } from "@/lib/i18n/provider";
import styles from "./Toast.module.css";

const VISIBLE_MS = 5000;
const EXIT_MS = 150;
const MAX_TOASTS = 3;

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "default" | "error";
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

interface ToastCardProps {
  item: ToastItem;
  onDone: (id: number) => void;
}

function ToastCard({ item, onDone }: ToastCardProps) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(VISIBLE_MS);
  const paused = hovered || focused;

  const close = useCallback(() => setLeaving(true), []);

  // The countdown stops while the pointer or keyboard focus is on the toast
  // and resumes with the time that was left.
  useEffect(() => {
    if (paused || leaving) return;
    const started = Date.now();
    const timer = window.setTimeout(close, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, leaving, close]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => onDone(item.id), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, onDone, item.id]);

  return (
    <div
      className={styles.toast}
      data-state={leaving ? "leaving" : "open"}
      data-tone={item.tone ?? "default"}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
        }
      }}
    >
      <p className={styles.message}>{item.message}</p>
      {item.actionLabel ? (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            item.onAction?.();
            close();
          }}
        >
          {item.actionLabel}
        </button>
      ) : null}
      <button
        type="button"
        className={styles.dismiss}
        aria-label={t("toast.dismiss")}
        onClick={close}
      >
        <CloseIcon width="16" height="16" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    const item = { ...options, id: nextId.current };
    setItems((current) => [...current.slice(1 - MAX_TOASTS), item]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={value}>
      {children}
      <div className={styles.region} aria-live="polite" data-print-hide="">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDone={remove} />
        ))}
      </div>
    </ToastContext>
  );
}
