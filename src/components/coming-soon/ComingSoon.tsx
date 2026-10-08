import Link from "next/link";
import styles from "./ComingSoon.module.css";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className={styles.page}>
      <p className={styles.status}>Coming soon</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <Link href="/" className={styles.back}>
        Back to home
      </Link>
    </section>
  );
}
