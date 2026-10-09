import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>Privacy</h1>
      <p className={styles.lede}>
        What WhichAI does with your information, in plain language. Last updated
        9 October 2026.
      </p>

      <section className={styles.section} aria-labelledby="receive">
        <h2 id="receive">What we receive</h2>
        <p>
          When you sign in with Google or GitHub, they tell us your name and an
          identifier that is unique to your account with them. We use the name
          to greet you and the identifier to recognise the same account next
          time.
        </p>
        <p>
          The permissions we ask for also cover your email address. We do not
          read it, keep it or use it. We never see your password; you type it on
          Google&apos;s or GitHub&apos;s own page.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="store">
        <h2 id="store">What we store</h2>
        <p>
          One cookie on your device. It holds the sign-in provider, your account
          identifier and your name, encrypted so only this site can read it. It
          lasts seven days. During sign-in a second cookie lives for ten minutes
          to check that the response really came from the provider, then it is
          deleted.
        </p>
        <p>
          We have no database. Nothing about you is stored on our servers, and
          the plans you make stay in your browser.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="never">
        <h2 id="never">What we don&apos;t do</h2>
        <ul className={styles.list}>
          <li>We don&apos;t sell or share your information.</li>
          <li>We don&apos;t track you or show ads.</li>
          <li>We don&apos;t collect passwords.</li>
          <li>We don&apos;t send you email.</li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="signout">
        <h2 id="signout">Signing out and leaving</h2>
        <p>
          Choose your name at the bottom of the sidebar, then Sign out. That
          deletes the cookie. To also remove WhichAI&apos;s access, revoke it in
          your Google account&apos;s security settings or in GitHub under
          Settings, Applications.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="contact">
        <h2 id="contact">Contact</h2>
        <p>
          Questions or concerns:{" "}
          <a href="mailto:rishibhaskar254@gmail.com">
            rishibhaskar254@gmail.com
          </a>
          . Security problems can also be reported privately through the
          Security tab of the project&apos;s GitHub repository.
        </p>
      </section>

      <Link href="/" className={styles.back}>
        Back to home
      </Link>
    </article>
  );
}
