import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";
import { getViewer } from "@/lib/auth/get-session";
import { getI18n } from "@/lib/i18n/server";
import packageJson from "../../../package.json";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("settings.title"), alternates: { canonical: "/settings" } };
}

export default async function Page() {
  return (
    <SettingsView viewer={await getViewer()} version={packageJson.version} />
  );
}
