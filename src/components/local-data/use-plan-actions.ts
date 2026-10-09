"use client";

import { useToast } from "@/components/toast/ToastProvider";
import { useI18n } from "@/lib/i18n/provider";
import type { SavedPlan } from "@/lib/storage/schemas";
import { useLocalData } from "./LocalDataProvider";

/** Rename, duplicate and delete with the toasts both plan lists share. */
export function usePlanActions() {
  const { t } = useI18n();
  const { show } = useToast();
  const { renamePlan, duplicatePlan, deletePlan, restorePlan } = useLocalData();

  async function rename(plan: SavedPlan, title: string) {
    const result = await renamePlan(plan.id, title);
    return result.ok;
  }

  async function duplicate(plan: SavedPlan) {
    const result = await duplicatePlan(
      plan.id,
      t("projects.copyTitle", { title: plan.title }),
    );
    if (result.ok) show({ message: t("projects.duplicated") });
  }

  async function remove(plan: SavedPlan) {
    const result = await deletePlan(plan.id);
    if (!result.ok) return;
    show({
      message: t("projects.deleted"),
      actionLabel: t("common.undo"),
      onAction: () => void restorePlan(plan),
    });
  }

  return { rename, duplicate, remove };
}
