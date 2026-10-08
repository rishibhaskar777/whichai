"use client";

import { useEffect, useState, type KeyboardEvent, type RefObject } from "react";
import { ArrowUpIcon } from "@/components/icons";
import { placeholderExamples, suggestions } from "@/data/suggestions";
import { GOAL_MAX_LENGTH, goalSchema } from "@/lib/schemas/goal";
import { useMediaQuery } from "@/lib/use-media-query";
import styles from "./GoalForm.module.css";

const COUNTER_THRESHOLD = 400;
const PLACEHOLDER_INTERVAL_MS = 4000;
const COMPACT_PLACEHOLDER = "Describe another goal";

interface GoalFormProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (goal: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  compact?: boolean;
}

export function GoalForm({
  value,
  onValueChange,
  onSubmit,
  inputRef: textareaRef,
  compact = false,
}: GoalFormProps) {
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const reducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
    false,
  );

  const showExample = !focused && value.length === 0;
  const staticExample = reducedMotion || compact;
  const cycling = showExample && !staticExample;

  useEffect(() => {
    if (!cycling) return;
    const timer = window.setInterval(
      () =>
        setExampleIndex((index) => (index + 1) % placeholderExamples.length),
      PLACEHOLDER_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [cycling]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [textareaRef, value]);

  function submit() {
    const result = goalSchema.safeParse({ goal: value });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check what you typed.");
      return;
    }
    setError(null);
    onSubmit(result.data.goal);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function fillSuggestion(goal: string) {
    onValueChange(goal);
    setError(null);
    textareaRef.current?.focus();
  }

  const nearLimit = value.length >= COUNTER_THRESHOLD;
  const hasError = error !== null;

  return (
    <div className={styles.wrapper} data-compact={compact}>
      <form
        className={styles.search}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className={styles.glass}>
          <label htmlFor="goal" className={styles.srOnly}>
            What do you want to do with AI?
          </label>
          <textarea
            id="goal"
            ref={textareaRef}
            className={styles.textarea}
            rows={compact ? 1 : 2}
            maxLength={GOAL_MAX_LENGTH}
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-invalid={hasError}
            aria-describedby="goal-message goal-count"
          />
          {showExample ? (
            <span
              key={staticExample ? "static" : exampleIndex}
              className={staticExample ? styles.exampleStatic : styles.example}
              aria-hidden="true"
            >
              {compact
                ? COMPACT_PLACEHOLDER
                : placeholderExamples[staticExample ? 0 : exampleIndex]}
            </span>
          ) : null}
          <div className={styles.toolbar}>
            <span
              id="goal-count"
              className={styles.counter}
              data-visible={nearLimit}
              data-full={value.length >= GOAL_MAX_LENGTH}
            >
              {nearLimit ? `${value.length} / ${GOAL_MAX_LENGTH}` : ""}
            </span>
            <button
              type="submit"
              className={styles.submit}
              disabled={value.trim().length === 0}
            >
              <ArrowUpIcon />
              <span className={styles.srOnly}>Get a plan</span>
            </button>
          </div>
        </div>
        <p
          id="goal-message"
          role={hasError ? "alert" : "status"}
          className={styles.message}
          data-kind={hasError ? "error" : undefined}
        >
          {error}
        </p>
      </form>

      {compact ? null : (
        <ul className={styles.chips} aria-label="Suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.label}>
              <button
                type="button"
                className={styles.chip}
                onClick={() => fillSuggestion(suggestion.goal)}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
