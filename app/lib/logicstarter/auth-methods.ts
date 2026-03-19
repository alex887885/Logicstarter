export type LogicstarterAuthMethod = "password" | "google" | "github";
export type LogicstarterAuthMethodKind = "native" | "social";

export type LogicstarterAuthMethodDefinition = {
  key: LogicstarterAuthMethod;
  kind: LogicstarterAuthMethodKind;
  label: string;
};

const logicstarterAuthMethods: Record<LogicstarterAuthMethod, LogicstarterAuthMethodDefinition> = {
  password: {
    key: "password",
    kind: "native",
    label: "Email and Password",
  },
  google: {
    key: "google",
    kind: "social",
    label: "Google",
  },
  github: {
    key: "github",
    kind: "social",
    label: "GitHub",
  },
};

export function listLogicstarterAuthMethodsByKeys(keys: LogicstarterAuthMethod[]) {
  return keys.map((key) => logicstarterAuthMethods[key]);
}
