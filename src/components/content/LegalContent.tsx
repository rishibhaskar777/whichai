"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LegalLinks } from "@/components/pricing/LegalLinks";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/en";
import {
  CONTACT_EMAIL,
  FEEDBACK_URL,
  SECURITY_POLICY_URL,
  contactUrl,
} from "@/lib/links";
import controls from "@/styles/controls.module.css";
import styles from "./Content.module.css";

/** Shown on the pages whose wording is not final. */
const LAST_UPDATED = "2026-10-11";

function LegalPage({
  title,
  lede,
  children,
}: {
  title: MessageKey;
  lede: MessageKey;
  children: ReactNode;
}) {
  const { t, formatDate } = useI18n();
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{t(title)}</h1>
      <p className={styles.draft} role="note">
        {t("legal.draft")}
      </p>
      <p className={styles.lede}>{t(lede)}</p>
      <p className={styles.meta}>
        {t("legal.updated", { date: formatDate(LAST_UPDATED, "long") })}
      </p>
      {children}
      <LegalLinks />
      <Link href="/" className={styles.back}>
        {t("content.back")}
      </Link>
    </article>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: MessageKey;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id}>{t(title)}</h2>
      {children}
    </section>
  );
}

export function TermsContent() {
  const { t } = useI18n();
  return (
    <LegalPage title="terms.title" lede="terms.lede">
      <Section id="terms-use" title="terms.use.title">
        <p>{t("terms.use.text")}</p>
      </Section>
      <Section id="terms-free" title="terms.free.title">
        <p>{t("terms.free.text")}</p>
      </Section>
      <Section id="terms-paid" title="terms.paid.title">
        <p>{t("terms.paid.text")}</p>
      </Section>
      <Section id="terms-accuracy" title="terms.accuracy.title">
        <p>{t("terms.accuracy.text")}</p>
      </Section>
      <Section id="terms-data" title="terms.data.title">
        <p>{t("terms.data.text")}</p>
      </Section>
      <Section id="terms-conduct" title="terms.conduct.title">
        <ul className={styles.list}>
          <li>{t("terms.conduct.item1")}</li>
          <li>{t("terms.conduct.item2")}</li>
          <li>{t("terms.conduct.item3")}</li>
        </ul>
      </Section>
      <Section id="terms-changes" title="terms.changes.title">
        <p>{t("terms.changes.text")}</p>
      </Section>
      <Section id="terms-contact" title="terms.contact.title">
        <p>
          {t("terms.contact.text")}{" "}
          <Link href="/contact">{t("legal.contact")}</Link>
        </p>
      </Section>
    </LegalPage>
  );
}

export function RefundContent() {
  const { t } = useI18n();
  return (
    <LegalPage title="refund.title" lede="refund.lede">
      <Section id="refund-today" title="refund.today.title">
        <p>{t("refund.today.text")}</p>
      </Section>
      <Section id="refund-cancel" title="refund.cancel.title">
        <p>{t("refund.cancel.text")}</p>
      </Section>
      <Section id="refund-refunds" title="refund.refunds.title">
        <p>{t("refund.refunds.text")}</p>
      </Section>
      <Section id="refund-how" title="refund.how.title">
        <p>
          {t("refund.how.text")}{" "}
          <Link href="/contact">{t("legal.contact")}</Link>
        </p>
      </Section>
    </LegalPage>
  );
}

export function ContactContent() {
  const { t } = useI18n();
  const hasEmail = CONTACT_EMAIL !== "";
  return (
    <LegalPage title="contact.title" lede="contact.lede">
      <Section id="contact-email" title="contact.email.title">
        <p>{t("contact.email.text")}</p>
        <p>
          {hasEmail ? (
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          ) : (
            <span>{t("contact.email.missing")}</span>
          )}
        </p>
      </Section>
      <Section id="contact-feedback" title="contact.feedback.title">
        <p>{t("contact.feedback.text")}</p>
        <p>
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
            {t("contact.feedback.link")}
            <span className={controls.srOnly}>{t("link.newTab")}</span>
          </a>
        </p>
      </Section>
      <Section id="contact-security" title="contact.security.title">
        <p>{t("contact.security.text")}</p>
        <p>
          <a
            href={SECURITY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("contact.security.link")}
            <span className={controls.srOnly}>{t("link.newTab")}</span>
          </a>
        </p>
      </Section>
      <Section id="contact-institution" title="contact.institution.title">
        <p>{t("contact.institution.text")}</p>
        <p>
          <a
            href={contactUrl(
              t("pricing.institution.subject"),
              t("pricing.institution.body"),
            )}
          >
            {t("contact.institution.link")}
          </a>
        </p>
      </Section>
    </LegalPage>
  );
}
