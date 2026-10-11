"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/en";
import { TERMS_SECTIONS, type TermsBlock } from "./terms-text";
import {
  FEEDBACK_URL,
  SECURITY_REPORT_URL,
  getContactEmail,
  institutionUrl,
} from "@/lib/links";
import controls from "@/styles/controls.module.css";
import styles from "./Content.module.css";

/** Shown on the pages whose wording is not final. */
const LAST_UPDATED = "2026-10-11";

function LegalPage({
  title,
  lede,
  draft = "legal.draft",
  dateLabel = "legal.updated",
  children,
}: {
  title: MessageKey;
  lede: MessageKey;
  draft?: MessageKey;
  dateLabel?: MessageKey;
  children: ReactNode;
}) {
  const { t, formatDate } = useI18n();
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{t(title)}</h1>
      <p className={styles.draft} role="note">
        {t(draft)}
      </p>
      <p className={styles.lede}>{t(lede)}</p>
      <p className={styles.meta}>
        {t(dateLabel, { date: formatDate(LAST_UPDATED, "long") })}
      </p>
      {children}
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

function TermsBlockView({ block }: { block: TermsBlock }) {
  if (typeof block === "string") return <p>{block}</p>;
  if ("list" in block) {
    return (
      <ul className={styles.list}>
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  const { link } = block;
  return (
    <p>
      {block.text}{" "}
      {link.external ? (
        <NewTabLink href={link.href} label={link.label} />
      ) : (
        <Link href={link.href}>{link.label}</Link>
      )}
      {block.after}
    </p>
  );
}

export function TermsContent() {
  const { t, locale } = useI18n();
  return (
    <LegalPage
      title="terms.title"
      lede="terms.lede"
      draft="legal.draftReview"
      dateLabel="terms.effective"
    >
      {locale === "en" ? null : (
        <p className={styles.meta}>{t("terms.englishOnly")}</p>
      )}
      <div className={styles.legalBody} lang="en">
        {TERMS_SECTIONS.map((section) => (
          <section
            key={section.id}
            className={styles.section}
            aria-labelledby={`terms-${section.id}`}
          >
            <h2 id={`terms-${section.id}`}>{section.title}</h2>
            {section.blocks.map((block, index) => (
              <TermsBlockView key={index} block={block} />
            ))}
          </section>
        ))}
      </div>
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

function NewTabLink({ href, label }: { href: string; label: string }) {
  const { t } = useI18n();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
      <span className={controls.srOnly}>{t("link.newTab")}</span>
    </a>
  );
}

export function ContactContent() {
  const { t } = useI18n();
  const email = getContactEmail();
  return (
    <LegalPage title="contact.title" lede="contact.lede">
      <Section id="contact-feedback" title="contact.feedback.title">
        <p>{t("contact.feedback.text")}</p>
        <p>
          <NewTabLink href={FEEDBACK_URL} label={t("contact.feedback.link")} />
        </p>
      </Section>
      <Section id="contact-security" title="contact.security.title">
        <p>{t("contact.security.text")}</p>
        <p>
          <NewTabLink
            href={SECURITY_REPORT_URL}
            label={t("contact.security.link")}
          />
        </p>
      </Section>
      <Section id="contact-institution" title="contact.institution.title">
        <p>{t("contact.institution.text")}</p>
        <p>
          <NewTabLink
            href={institutionUrl(t("pricing.institution.subject"))}
            label={t("contact.institution.link")}
          />
        </p>
      </Section>
      {email !== "" ? (
        <Section id="contact-email" title="contact.email.title">
          <p>{t("contact.email.text")}</p>
          <p>
            <a href={`mailto:${email}`}>{email}</a>
          </p>
        </Section>
      ) : null}
    </LegalPage>
  );
}
