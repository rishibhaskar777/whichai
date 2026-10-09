import type { Metadata } from "next";
import Link from "next/link";
import { StatePage } from "@/components/state-page/StatePage";
import { getI18n } from "@/lib/i18n/server";
import controls from "@/styles/controls.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("notFound.title") };
}

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <StatePage title={t("notFound.title")} text={t("notFound.text")}>
      <Link href="/" className={`${controls.button} ${controls.primary}`}>
        {t("notFound.home")}
      </Link>
    </StatePage>
  );
}
