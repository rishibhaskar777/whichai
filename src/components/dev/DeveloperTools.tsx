"use client";

import { useId } from "react";
import { useEntitlements } from "@/components/entitlements/EntitlementsProvider";
import { allTiers, type Tier } from "@/lib/plans/entitlements";
import controls from "@/styles/controls.module.css";

/*
 * Development only: pretend to be another plan and reset today's count.
 * It is imported behind a NODE_ENV check, so it is not in production builds.
 */
export function DeveloperTools() {
  const titleId = useId();
  const { tier, tierOverride, setTierOverride, resetUsage, usedToday } =
    useEntitlements();

  const options: { value: Tier | "real"; label: string }[] = [
    { value: "real", label: "My real plan" },
    ...allTiers().map((value) => ({
      value,
      label: value === "guest" ? "Guest" : value,
    })),
  ];

  return (
    <section
      aria-labelledby={titleId}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        padding: "var(--space-4) var(--space-5)",
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <h2 id={titleId} style={{ fontSize: "var(--text-lg)" }}>
        Developer tools
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
        Shown in development only. Acting as {tier}; {usedToday} plans used
        today.
      </p>
      <div
        role="radiogroup"
        aria-label="Plan switcher"
        style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}
      >
        {options.map((option) => {
          const selected =
            option.value === "real"
              ? tierOverride === null
              : tierOverride === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`${controls.button} ${selected ? controls.primary : ""}`}
              onClick={() =>
                void setTierOverride(
                  option.value === "real" ? null : option.value,
                )
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div>
        <button
          type="button"
          className={controls.button}
          onClick={() => void resetUsage()}
        >
          Reset today&apos;s usage
        </button>
      </div>
    </section>
  );
}
