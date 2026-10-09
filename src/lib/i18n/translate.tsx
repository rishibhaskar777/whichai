import { Fragment, type ReactNode } from "react";
import { hi } from "./hi";
import type { Locale } from "./locales";
import { en, type MessageKey } from "./en";

export type { MessageKey };

type Values = Readonly<Record<string, string | number>>;

/** `some.key` is a plural group when `some.key.one` and `some.key.other` exist. */
export type PluralKey = MessageKey extends infer Key
  ? Key extends `${infer Base}.one`
    ? Base
    : never
  : never;

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = { en, hi };

const INTL_TAGS: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

const PLACEHOLDER = /\{(\w+)\}/g;

function fill(template: string, values?: Values): string {
  if (!values) return template;
  return template.replace(PLACEHOLDER, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

export type DateStyle = "short" | "long" | "time";

export interface I18n {
  locale: Locale;
  t: (key: MessageKey, values?: Values) => string;
  /** Picks the `.one` or `.other` message for the count. */
  tn: (key: PluralKey, count: number, values?: Values) => string;
  /** Like `t`, but placeholders can be elements, such as a link or <strong>. */
  rich: (
    key: MessageKey,
    parts: Readonly<Record<string, ReactNode>>,
  ) => ReactNode;
  formatDate: (
    value: Date | string | number,
    style?: DateStyle,
    timeZone?: string,
  ) => string;
  formatNumber: (value: number) => string;
}

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: "numeric", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  time: { hour: "numeric", minute: "2-digit" },
};

export function createI18n(locale: Locale): I18n {
  const messages = DICTIONARIES[locale];
  const tag = INTL_TAGS[locale];
  const plurals = new Intl.PluralRules(tag);
  const numbers = new Intl.NumberFormat(tag);

  const t: I18n["t"] = (key, values) => fill(messages[key], values);

  return {
    locale,
    t,
    tn: (key, count, values) => {
      const category = plurals.select(count) === "one" ? "one" : "other";
      return t(`${key}.${category}` as MessageKey, {
        count: numbers.format(count),
        ...values,
      });
    },
    rich: (key, parts) =>
      messages[key].split(/(\{\w+\})/).map((piece, index) => {
        const name = /^\{(\w+)\}$/.exec(piece)?.[1];
        const node = name !== undefined && name in parts ? parts[name] : piece;
        return <Fragment key={index}>{node}</Fragment>;
      }),
    formatDate: (value, style = "short", timeZone) =>
      new Intl.DateTimeFormat(tag, { ...DATE_OPTIONS[style], timeZone }).format(
        value instanceof Date ? value : new Date(value),
      ),
    formatNumber: (value) => numbers.format(value),
  };
}
