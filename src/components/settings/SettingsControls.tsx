"use client";

import { useId, type ReactNode } from "react";
import styles from "./Settings.module.css";

interface RowProps {
  label: string;
  help: string;
  children: (ids: { helpId: string; labelId: string }) => ReactNode;
}

function useRowIds() {
  return { helpId: useId(), labelId: useId() };
}

/** A label, a line of help text, and a control, laid out as one setting. */
export function SettingRow({ label, help, children }: RowProps) {
  const ids = useRowIds();
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <p id={ids.labelId} className={styles.rowLabel}>
          {label}
        </p>
        <p id={ids.helpId} className={styles.rowHelp}>
          {help}
        </p>
      </div>
      <div className={styles.rowControl}>{children(ids)}</div>
    </div>
  );
}

interface Option<T extends string> {
  value: T;
  label: string;
  lang?: string;
}

interface RadioSettingProps<T extends string> {
  label: string;
  help: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
}

export function RadioSetting<T extends string>({
  label,
  help,
  value,
  options,
  onChange,
}: RadioSettingProps<T>) {
  const name = useId();
  return (
    <SettingRow label={label} help={help}>
      {({ helpId, labelId }) => (
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={helpId}
          className={styles.segments}
        >
          {options.map((option) => (
            <label key={option.value} className={styles.segment}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className={styles.segmentInput}
              />
              <span lang={option.lang}>{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </SettingRow>
  );
}

interface SelectSettingProps<T extends string> {
  label: string;
  help: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
}

export function SelectSetting<T extends string>({
  label,
  help,
  value,
  options,
  onChange,
}: SelectSettingProps<T>) {
  const selectId = useId();
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <label htmlFor={selectId} className={styles.rowLabel}>
          {label}
        </label>
        <p id={`${selectId}-help`} className={styles.rowHelp}>
          {help}
        </p>
      </div>
      <div className={styles.rowControl}>
        <select
          id={selectId}
          className={styles.select}
          aria-describedby={`${selectId}-help`}
          value={value}
          onChange={(event) => {
            const next = options.find(
              (option) => option.value === event.target.value,
            );
            if (next) onChange(next.value);
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface SwitchSettingProps {
  label: string;
  help: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchSetting({
  label,
  help,
  checked,
  onChange,
}: SwitchSettingProps) {
  const inputId = useId();
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <label htmlFor={inputId} className={styles.rowLabel}>
          {label}
        </label>
        <p id={`${inputId}-help`} className={styles.rowHelp}>
          {help}
        </p>
      </div>
      <div className={styles.rowControl}>
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          className={styles.switch}
          aria-describedby={`${inputId}-help`}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
      </div>
    </div>
  );
}
