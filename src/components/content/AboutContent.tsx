"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { REPOSITORY_URL } from "@/lib/links";
import controls from "@/styles/controls.module.css";
import styles from "./Content.module.css";

export function AboutContent() {
  const { t } = useI18n();
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{t("about.title")}</h1>
      <p className={styles.lede}>{t("about.lede")}</p>

      <section className={styles.section} aria-labelledby="about-what">
        <h2 id="about-what">{t("about.what.title")}</h2>
        <p>{t("about.what.text")}</p>
      </section>

      <section className={styles.section} aria-labelledby="about-how">
        <h2 id="about-how">{t("about.how.title")}</h2>
        <p>{t("about.how.text1")}</p>
        <p>{t("about.how.text2")}</p>
      </section>

      <section className={styles.section} aria-labelledby="about-honest">
        <h2 id="about-honest">{t("about.honest.title")}</h2>
        <ul className={styles.list}>
          <li>{t("about.honest.item1")}</li>
          <li>{t("about.honest.item2")}</li>
          <li>{t("about.honest.item3")}</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="about-free">
        <h2 id="about-free">{t("about.free.title")}</h2>
        <p>{t("about.free.text")}</p>
        <p>
          <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
            {t("about.source")}
            <span className={controls.srOnly}>{t("link.newTab")}</span>
          </a>
        </p>
      </section>

      <Link href="/" className={styles.back}>
        {t("content.back")}
      </Link>
    </article>
  );
}
