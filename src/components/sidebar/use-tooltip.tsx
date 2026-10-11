"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import styles from "./SidebarContent.module.css";

const GAP = 8;

interface Tooltip {
  targetRef: RefObject<HTMLElement | null>;
  handlers: {
    onPointerEnter: (event: PointerEvent) => void;
    onPointerLeave: () => void;
    onPointerDown: () => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: () => void;
  };
  tip: ReactNode;
}

/**
 * A label shown on hover and keyboard focus. The sidebar clips its contents,
 * so the tip is placed against the viewport through the CSSOM: beside the
 * target on the rail, above it otherwise. It repeats the button's name and is
 * hidden from assistive technology.
 */
export function useTooltip(label: string, side: boolean): Tooltip {
  const [open, setOpen] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    const target = targetRef.current;
    if (!open || !tip || !target) return;
    const rect = target.getBoundingClientRect();
    if (side) {
      tip.style.setProperty("left", `${rect.right + GAP}px`);
      tip.style.setProperty("top", `${rect.top + rect.height / 2}px`);
    } else {
      tip.style.setProperty("right", `${window.innerWidth - rect.right}px`);
      tip.style.setProperty(
        "bottom",
        `${window.innerHeight - rect.top + GAP}px`,
      );
    }
  }, [open, side]);

  return {
    targetRef,
    handlers: {
      onPointerEnter: (event) => {
        if (event.pointerType !== "touch") setOpen(true);
      },
      onPointerLeave: () => setOpen(false),
      onPointerDown: () => setOpen(false),
      onFocus: (event) => {
        const target = event.currentTarget as HTMLElement;
        let visible = true;
        try {
          visible = target.matches(":focus-visible");
        } catch {
          // Older engines without :focus-visible show the tip on any focus.
        }
        if (visible) setOpen(true);
      },
      onBlur: () => setOpen(false),
    },
    tip: open ? (
      <span
        ref={tipRef}
        aria-hidden="true"
        className={side ? styles.tooltipSide : styles.tooltip}
      >
        {label}
      </span>
    ) : null,
  };
}
