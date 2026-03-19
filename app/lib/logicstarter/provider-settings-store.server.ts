import { eq, inArray } from "drizzle-orm";
import { db } from "~/db/index.server";
import { logicstarterProviderSetting } from "../../../auth-schema";
import type { LogicstarterProviderSettingsCategory } from "~/lib/logicstarter/provider-settings-schema.server";

export async function getLogicstarterStoredProviderSettings(keys: string[]) {
  if (!keys.length) {
    return {} as Record<string, string>;
  }

  const rows = await db
    .select({
      key: logicstarterProviderSetting.key,
      value: logicstarterProviderSetting.value,
    })
    .from(logicstarterProviderSetting)
    .where(inArray(logicstarterProviderSetting.key, keys));

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function saveLogicstarterProviderSettings(
  category: LogicstarterProviderSettingsCategory,
  values: Record<string, string>,
) {
  const entries = Object.entries(values);

  if (!entries.length) {
    return;
  }

  for (const [key, value] of entries) {
    await db
      .insert(logicstarterProviderSetting)
      .values({
        key,
        category,
        value,
      })
      .onConflictDoUpdate({
        target: logicstarterProviderSetting.key,
        set: {
          category,
          value,
        },
      });
  }
}

export async function getLogicstarterStoredProviderSettingsByCategory(
  category: LogicstarterProviderSettingsCategory,
) {
  const rows = await db
    .select({
      key: logicstarterProviderSetting.key,
      value: logicstarterProviderSetting.value,
    })
    .from(logicstarterProviderSetting)
    .where(eq(logicstarterProviderSetting.category, category));

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
