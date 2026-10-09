import { LOCALES } from "@/lib/i18n/locales";
import { budgetSchema, goalTypeSchema, levelSchema } from "@/lib/schemas/plan";
import { planRequestSchema } from "@/lib/schemas/plan-request";
import { z } from "@/lib/schemas/zod";
import {
  MAX_HISTORY_ENTRIES,
  MAX_SAVED_PLANS,
  MAX_TITLE_LENGTH,
  SCHEMA_VERSION,
} from "./limits";

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
const timestampSchema = z.iso.datetime();

export const savedPlanSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  planRequest: planRequestSchema,
  catalogueVersion: z.string().min(1).max(32),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type SavedPlan = z.infer<typeof savedPlanSchema>;

export const historyEntrySchema = z.object({
  id: idSchema,
  goal: z.string().trim().min(1).max(500),
  goalType: goalTypeSchema.nullable(),
  createdAt: timestampSchema,
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const themeChoiceSchema = z.enum(["system", "light", "dark"]);
export const motionChoiceSchema = z.enum(["system", "on", "off"]);
export const currencySchema = z.enum(["₹", "$"]);

export const DEFAULT_SETTINGS = {
  language: "en",
  theme: "system",
  reduceMotion: "system",
  defaultLevel: "auto",
  defaultBudget: null,
  currencyDisplay: "₹",
  saveHistory: true,
} as const;

/** Each field falls back to its default, so one bad value keeps the rest. */
export const settingsSchema = z.object({
  language: z.enum(LOCALES).catch(DEFAULT_SETTINGS.language),
  theme: themeChoiceSchema.catch(DEFAULT_SETTINGS.theme),
  reduceMotion: motionChoiceSchema.catch(DEFAULT_SETTINGS.reduceMotion),
  defaultLevel: z
    .enum(["auto", ...levelSchema.options])
    .catch(DEFAULT_SETTINGS.defaultLevel),
  defaultBudget: budgetSchema.nullable().catch(DEFAULT_SETTINGS.defaultBudget),
  currencyDisplay: currencySchema.catch(DEFAULT_SETTINGS.currencyDisplay),
  saveHistory: z.boolean().catch(DEFAULT_SETTINGS.saveHistory),
});
export type Settings = z.infer<typeof settingsSchema>;

export const BACKUP_APP = "whichai";

/** The file written by "Export my data". Arrays hold unchecked values. */
export const backupFileSchema = z.object({
  app: z.literal(BACKUP_APP),
  schemaVersion: z.number().int().min(1).max(SCHEMA_VERSION),
  exportedAt: timestampSchema,
  plans: z.array(z.unknown()).max(MAX_SAVED_PLANS),
  history: z.array(z.unknown()).max(MAX_HISTORY_ENTRIES),
  settings: z.unknown().optional(),
});

export interface LocalData {
  plans: SavedPlan[];
  history: HistoryEntry[];
  settings: Settings;
}

/** Items that fail validation are dropped, never repaired. */
export function parseItems<T>(
  schema: z.ZodType<T>,
  items: unknown,
  max: number,
): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const valid: T[] = [];
  for (const item of items) {
    const parsed = schema.safeParse(item);
    if (!parsed.success) continue;
    const id = (parsed.data as { id: string }).id;
    if (seen.has(id)) continue;
    seen.add(id);
    valid.push(parsed.data);
    if (valid.length >= max) break;
  }
  return valid;
}
