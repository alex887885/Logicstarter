import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { readLogicstarterRuntimeTarget, supportsLogicstarterRuntimeEnvFileExport } from "~/lib/logicstarter/config.server";
import { exportLogicstarterProviderEnv } from "~/lib/logicstarter/env-export.server";
import { logicstarterProviderSettingsKeys } from "~/lib/logicstarter/provider-settings.server";

const defaultRuntimeEnvPath = path.resolve(process.cwd(), ".env.runtime");

const orderedKeys = [
  ...logicstarterProviderSettingsKeys.email,
  ...logicstarterProviderSettingsKeys.sms,
  ...logicstarterProviderSettingsKeys.storage,
  ...logicstarterProviderSettingsKeys.authentication,
  ...logicstarterProviderSettingsKeys.billing,
];

function toEnvLine(key: string, value: string) {
  return `${key}=${value}`;
}

function serializeEnvOverrides(values: Record<string, string>) {
  return Object.entries(values)
    .map(([key, value]) => toEnvLine(key, value))
    .join("\n");
}

function mergeEnvContent(existingContent: string, exportContent: string) {
  const lines = existingContent.split(/\r?\n/);
  const values = new Map(
    exportContent
      .trimEnd()
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = separatorIndex === -1 ? line.trim() : line.slice(0, separatorIndex).trim();
        const value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
        return [key, value] as const;
      }),
  );

  const mergedLines = lines.map((line) => {
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return line;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!values.has(key)) {
      return line;
    }

    const nextLine = toEnvLine(key, values.get(key) ?? "");
    values.delete(key);
    return nextLine;
  });

  for (const key of orderedKeys) {
    if (values.has(key)) {
      mergedLines.push(toEnvLine(key, values.get(key) ?? ""));
      values.delete(key);
    }
  }

  for (const [key, value] of values.entries()) {
    mergedLines.push(toEnvLine(key, value));
  }

  return `${mergedLines.join("\n").replace(/\n*$/, "")}\n`;
}

export async function syncLogicstarterProviderEnvFile(
  envPath = defaultRuntimeEnvPath,
  envOverrides: Record<string, string> = {},
) {
  const runtimeTarget = readLogicstarterRuntimeTarget();
  if (!supportsLogicstarterRuntimeEnvFileExport(runtimeTarget)) {
    throw new Error(`Runtime env file export is only supported when RUNTIME_TARGET=node. Current target: ${runtimeTarget}.`);
  }

  const exportContent = mergeEnvContent(
    await exportLogicstarterProviderEnv(),
    serializeEnvOverrides(envOverrides),
  );
  const existingContent = await readFile(envPath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });
  const nextContent = mergeEnvContent(existingContent, exportContent);

  await writeFile(envPath, nextContent, "utf8");

  return {
    ok: true as const,
    envPath,
    exportedKeyCount: orderedKeys.length,
  };
}
