"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { getContactEmail } from "@/lib/links";
import styles from "./Content.module.css";

const LAST_UPDATED = "2026-10-11";

export function PrivacyContent() {
  const { t, rich, formatDate } = useI18n();
  const email = getContactEmail();
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{t("privacy.title")}</h1>
      <p className={styles.draft} role="note">
        {t("legal.draftReview")}
      </p>
      <p className={styles.lede}>
        {t("privacy.lede", { date: formatDate(LAST_UPDATED, "long", "UTC") })}
      </p>

      <section className={styles.section} aria-labelledby="receive">
        <h2 id="receive">{t("privacy.receive.title")}</h2>
        <p>{t("privacy.receive.text1")}</p>
        <p>{t("privacy.receive.text2")}</p>
      </section>

      <section className={styles.section} aria-labelledby="preview">
        <h2 id="preview">{t("privacy.preview.title")}</h2>
        <p>{t("privacy.preview.text1")}</p>
        <p>{t("privacy.preview.text2")}</p>
        <p>{t("privacy.preview.text3")}</p>
      </section>

      <section className={styles.section} aria-labelledby="guest">
        <h2 id="guest">{t("privacy.guest.title")}</h2>
        <p>{t("privacy.guest.text")}</p>
      </section>

      <section className={styles.section} aria-labelledby="store">
        <h2 id="store">{t("privacy.store.title")}</h2>
        <p>{t("privacy.store.text1")}</p>
      </section>

      <section className={styles.section} aria-labelledby="cookies">
        <h2 id="cookies">{t("privacy.cookies.title")}</h2>
        <p>{t("privacy.cookies.text1")}</p>
        <ul className={styles.list}>
          <li>{t("privacy.cookies.item1")}</li>
          <li>{t("privacy.cookies.item2")}</li>
        </ul>
        <p>{t("privacy.cookies.text2")}</p>
      </section>

      <section className={styles.section} aria-labelledby="device">
        <h2 id="device">{t("privacy.device.title")}</h2>
        <p>{t("privacy.device.text1")}</p>
        <ul className={styles.list}>
          <li>{t("privacy.device.item1")}</li>
          <li>{t("privacy.device.item2")}</li>
          <li>{t("privacy.device.item3")}</li>
          <li>{t("privacy.device.item4")}</li>
        </ul>
        <p>{t("privacy.device.text3")}</p>
      </section>

      <section className={styles.section} aria-labelledby="news">
        <h2 id="news">{t("privacy.news.title")}</h2>
        <p>{t("privacy.device.news")}</p>
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

      <section className={styles.section} aria-labelledby="rights">
        <h2 id="rights">{t("privacy.rights.title")}</h2>
        <p>{t("privacy.rights.text1")}</p>
        <p>{t("privacy.rights.text2")}</p>
      </section>

      <section className={styles.section} aria-labelledby="delete">
        <h2 id="delete">{t("privacy.delete.title")}</h2>
        <p>{t("privacy.delete.text1")}</p>
        <p>{t("privacy.delete.text2")}</p>
      </section>

      <section className={styles.section} aria-labelledby="signout">
        <h2 id="signout">{t("privacy.signout.title")}</h2>
        <p>{t("privacy.signout.text")}</p>
      </section>

      <section className={styles.section} aria-labelledby="contact">
        <h2 id="contact">{t("privacy.contact.title")}</h2>
        <p>{t("privacy.contact.text")}</p>
        {email !== "" ? (
          <p>
            {rich("privacy.contact.email", {
              email: <a href={`mailto:${email}`}>{email}</a>,
            })}
          </p>
        ) : null}
      </section>

      <Link href="/" className={styles.back}>
        {t("content.back")}
      </Link>
    </article>
  );
}
