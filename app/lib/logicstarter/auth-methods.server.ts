import { readLogicstarterProviderConfig } from "~/lib/logicstarter/config.server";
import { listLogicstarterAuthMethodsByKeys, type LogicstarterAuthMethod } from "~/lib/logicstarter/auth-methods";

export function listEnabledLogicstarterAuthMethods() {
  const auth = readLogicstarterProviderConfig().auth;
  const enabled: LogicstarterAuthMethod[] = ["password"];

  if (auth.googleEnabled && auth.googleClientId && auth.googleClientSecret) {
    enabled.push("google");
  }

  if (auth.githubEnabled && auth.githubClientId && auth.githubClientSecret) {
    enabled.push("github");
  }

  return listLogicstarterAuthMethodsByKeys(enabled);
}
