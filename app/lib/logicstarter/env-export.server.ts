import {
  getManyLogicstarterProviderSettingsDetail,
  logicstarterProviderSettingsKeys,
} from "~/lib/logicstarter/provider-settings.server";

type EnvValue = string | undefined;

function toEnvLine(key: string, value: EnvValue) {
  return `${key}=${value ?? ""}`;
}

export async function exportLogicstarterProviderEnv() {
  const keys = [
    ...logicstarterProviderSettingsKeys.email,
    ...logicstarterProviderSettingsKeys.sms,
    ...logicstarterProviderSettingsKeys.storage,
    ...logicstarterProviderSettingsKeys.authentication,
    ...logicstarterProviderSettingsKeys.billing,
  ];
  const settings = await getManyLogicstarterProviderSettingsDetail(keys);

  const lines = keys.map((key) => toEnvLine(key, settings[key]?.value));

  return `${lines.join("\n")}\n`;
}
