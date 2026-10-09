import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import styles from "./ComingSoon.module.css";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const { t } = useI18n();
  return (
    <section className={styles.page}>
      <p className={styles.status}>{t("comingSoon.status")}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <Link href="/" className={styles.back}>
        {t("comingSoon.back")}
      </Link>
    </section>
  );
}
