"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { FEEDBACK_URL } from "@/lib/links";
import controls from "@/styles/controls.module.css";
import styles from "./Content.module.css";

const QUESTIONS = [
  { question: "help.q1", answer: "help.a1" },
  { question: "help.q2", answer: "help.a2" },
  { question: "help.q3", answer: "help.a3" },
  { question: "help.q4", answer: "help.a4" },
  { question: "help.q5", answer: "help.a5" },
  { question: "help.q6", answer: "help.a6" },
] as const;

export function HelpContent() {
  const { t } = useI18n();
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{t("help.title")}</h1>
      <p className={styles.lede}>{t("help.lede")}</p>

      <div className={styles.faq}>
        {QUESTIONS.map(({ question, answer }) => (
          <details key={question}>
            <summary>{t(question)}</summary>
            <p>{t(answer)}</p>
          </details>
        ))}
      </div>

      <section className={styles.section} aria-labelledby="help-more">
        <h2 id="help-more">{t("help.moreTitle")}</h2>
        <p>{t("help.shortcuts")}</p>
        <div className={styles.links}>
          <Link href="/about">{t("help.more.about")}</Link>
          <Link href="/privacy">{t("help.more.privacy")}</Link>
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
            {t("help.more.feedback")}
            <span className={controls.srOnly}>{t("link.newTab")}</span>
          </a>
        </div>
      </section>

      <Link href="/" className={styles.back}>
        {t("content.back")}
      </Link>
    </article>
  );
}
