import type { ReactNode } from "react";
import styles from "./StatePage.module.css";

interface StatePageProps {
  title: string;
  text: string;
  children?: ReactNode;
}

/** A plain full-page message: not found, a bad link, an empty plan route. */
export function StatePage({ title, text, children }: StatePageProps) {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>{text}</p>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </section>
  );
}
