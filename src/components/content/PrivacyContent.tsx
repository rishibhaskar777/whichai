"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { CONTACT_EMAIL } from "@/lib/links";
import styles from "./Content.module.css";

const LAST_UPDATED = "2026-10-10";

export function PrivacyContent() {
  const { t, rich, formatDate } = useI18n();
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{t("privacy.title")}</h1>
      <p className={styles.lede}>
        {t("privacy.lede", { date: formatDate(LAST_UPDATED, "long", "UTC") })}
      </p>

      <section className={styles.section} aria-labelledby="receive">
        <h2 id="receive">{t("privacy.receive.title")}</h2>
        <p>{t("privacy.receive.text1")}</p>
        <p>{t("privacy.receive.text2")}</p>
      </section>

      <section className={styles.section} aria-labelledby="store">
        <h2 id="store">{t("privacy.store.title")}</h2>
        <p>{t("privacy.store.text1")}</p>
        <p>{t("privacy.store.text2")}</p>
      </section>

      <section className={styles.section} aria-labelledby="device">
        <h2 id="device">{t("privacy.device.title")}</h2>
        <p>{t("privacy.device.text1")}</p>
        <ul className={styles.list}>
          <li>{t("privacy.device.item1")}</li>
          <li>{t("privacy.device.item2")}</li>
          <li>{t("privacy.device.item3")}</li>
        </ul>
        <p>{t("privacy.device.text2")}</p>
        <p>{t("privacy.device.text3")}</p>
        <p>{t("privacy.device.news")}</p>
        <p>{t("privacy.device.text4")}</p>
      </section>

      <section className={styles.section} aria-labelledby="never">
        <h2 id="never">{t("privacy.never.title")}</h2>
        <ul className={styles.list}>
          <li>{t("privacy.never.item1")}</li>
          <li>{t("privacy.never.item2")}</li>
          <li>{t("privacy.never.item3")}</li>
          <li>{t("privacy.never.item4")}</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="signout">
        <h2 id="signout">{t("privacy.signout.title")}</h2>
        <p>{t("privacy.signout.text")}</p>
      </section>

      <section className={styles.section} aria-labelledby="contact">
        <h2 id="contact">{t("privacy.contact.title")}</h2>
        <p>
          {rich("privacy.contact.text", {
            email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>,
          })}
        </p>
      </section>

      <Link href="/" className={styles.back}>
        {t("content.back")}
      </Link>
    </article>
  );
}
