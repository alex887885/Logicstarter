import { exportLogicstarterProviderEnv } from "~/lib/logicstarter/env-export.server";
import { syncLogicstarterProviderEnvFile } from "~/lib/logicstarter/env-sync.server";
import { getLogicstarterRuntimeConfigSourceMode, readLogicstarterRuntimeTarget, supportsLogicstarterRuntimeEnvFileExport } from "~/lib/logicstarter/config.server";
import {
  parseLogicstarterProviderSettingsCategory,
  parseLogicstarterProviderSettingsForm,
  type LogicstarterProviderSettingsCategory,
} from "~/lib/logicstarter/provider-settings-schema.server";
import { getLogicstarterProviderSettingsByCategory } from "~/lib/logicstarter/provider-settings.server";

export function resolveLogicstarterProviderSettingsCategory(rawCategory: string | null | undefined) {
  if (!rawCategory) {
    return null;
  }

  return parseLogicstarterProviderSettingsCategory(rawCategory);
}

export async function getLogicstarterProviderSettingsResponse(category: LogicstarterProviderSettingsCategory) {
  return {
    category,
    settings: await getLogicstarterProviderSettingsByCategory(category),
    envExport: await exportLogicstarterProviderEnv(),
  };
}

export async function parseLogicstarterProviderSettingsRequest(request: Request) {
  const formData = await request.formData();
  const rawCategory = formData.get("category");
  const rawIntent = formData.get("intent");
  const category = resolveLogicstarterProviderSettingsCategory(typeof rawCategory === "string" ? rawCategory : null);
  const intent = typeof rawIntent === "string" && (rawIntent === "apply" || rawIntent === "export-env")
    ? rawIntent
    : "validate";

  if (!category) {
    return {
      ok: false as const,
      error: "Invalid provider settings category.",
    };
  }

  const values = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key !== "category")
      .map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );

  const parsed = parseLogicstarterProviderSettingsForm(category, values);
  if (!parsed.success) {
    return {
      ok: false as const,
      category,
      error: parsed.error.flatten(),
    };
  }

  if (intent === "apply") {
    return applyLogicstarterProviderSettingsRequest(category, parsed.data);
  }

  if (intent === "export-env") {
    return exportLogicstarterProviderSettingsRequest(category, parsed.data);
  }

  return {
    ok: true as const,
    category,
    intent,
    values: parsed.data,
  };
}

export async function applyLogicstarterProviderSettingsRequest(
  category: LogicstarterProviderSettingsCategory,
  values: Record<string, string>,
) {
  const valuesToSave = Object.fromEntries(
    Object.entries(values).filter(([key]) => key !== "category"),
  );
  const runtimeTarget = readLogicstarterRuntimeTarget();
  const configSourceMode = getLogicstarterRuntimeConfigSourceMode(runtimeTarget);

  if (!supportsLogicstarterRuntimeEnvFileExport(runtimeTarget)) {
    return {
      ok: true as const,
      category,
      applied: true as const,
      exported: false as const,
      runtimeTarget,
      configSourceMode,
      message: `Validation passed for the env-only workflow. Export the generated runtime env content and upload it to the ${runtimeTarget} deployment bindings or secrets manually.`,
      values,
      envContent: await exportLogicstarterProviderEnv(),
    };
  }

  const applyResult = await syncLogicstarterProviderEnvFile(undefined, valuesToSave);

  return {
    ok: true as const,
    category,
    applied: true as const,
    exported: true as const,
    runtimeTarget,
    configSourceMode,
    envPath: applyResult.envPath,
    values,
  };
}

export async function exportLogicstarterProviderSettingsRequest(
  category: LogicstarterProviderSettingsCategory,
  values: Record<string, string>,
) {
  const valuesToSave = Object.fromEntries(
    Object.entries(values).filter(([key]) => key !== "category"),
  );

  const runtimeTarget = readLogicstarterRuntimeTarget();
  const configSourceMode = getLogicstarterRuntimeConfigSourceMode(runtimeTarget);
  const envContent = await exportLogicstarterProviderEnv();

  if (!supportsLogicstarterRuntimeEnvFileExport(runtimeTarget)) {
    return {
      ok: true as const,
      category,
      exported: false as const,
      applied: true as const,
      runtimeTarget,
      configSourceMode,
      message: `Export the generated runtime env content and upload it to the ${runtimeTarget} deployment bindings or secrets manually.`,
      envContent,
      values,
    };
  }

  let exportResult;
  try {
    exportResult = await syncLogicstarterProviderEnvFile(undefined, valuesToSave);
  } catch (error) {
    return {
      ok: false as const,
      category,
      error: error instanceof Error ? error.message : "Unable to export Logicstarter runtime env file.",
      values,
    };
  }

  return {
    ok: true as const,
    category,
    exported: true as const,
    applied: true as const,
    runtimeTarget,
    configSourceMode,
    envPath: exportResult.envPath,
    envContent,
    values,
  };
}
