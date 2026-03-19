const configModule = await import("../app/lib/logicstarter/config.server.ts");

const {
  clearLogicstarterRuntimeEnvValues,
  readLogicstarterEnvValue,
  readLogicstarterProviderConfig,
  setLogicstarterRuntimeEnvValues,
} = configModule;

const originalRuntimeTarget = process.env.RUNTIME_TARGET;
const originalDatabaseProfile = process.env.DATABASE_PROFILE;
const originalStorageProvider = process.env.STORAGE_PROVIDER;
const originalEmailProvider = process.env.EMAIL_PROVIDER;

try {
  delete process.env.RUNTIME_TARGET;
  delete process.env.DATABASE_PROFILE;
  delete process.env.STORAGE_PROVIDER;
  delete process.env.EMAIL_PROVIDER;

  clearLogicstarterRuntimeEnvValues();
  setLogicstarterRuntimeEnvValues({
    RUNTIME_TARGET: "cloudflare",
    DATABASE_PROFILE: "d1",
    STORAGE_PROVIDER: "r2",
    EMAIL_PROVIDER: "resend",
    EMAIL_FROM: "starter@example.com",
    RESEND_API_KEY: "re_contract_key",
  });

  if (readLogicstarterEnvValue("RUNTIME_TARGET") !== "cloudflare") {
    throw new Error("Expected injected runtime target to be readable from readLogicstarterEnvValue.");
  }

  const providerConfig = readLogicstarterProviderConfig();

  if (providerConfig.runtime.target !== "cloudflare") {
    throw new Error(`Expected provider runtime target to resolve to cloudflare, received ${providerConfig.runtime.target}.`);
  }

  if (providerConfig.runtime.databaseProfile !== "d1") {
    throw new Error(`Expected provider database profile to resolve to d1, received ${providerConfig.runtime.databaseProfile}.`);
  }

  if (providerConfig.storage.provider !== "r2") {
    throw new Error(`Expected provider storage to resolve to r2, received ${providerConfig.storage.provider}.`);
  }

  if (providerConfig.email.provider !== "resend" || providerConfig.email.from !== "starter@example.com") {
    throw new Error("Expected provider email config to resolve from injected runtime values.");
  }

  clearLogicstarterRuntimeEnvValues();

  if (readLogicstarterEnvValue("RUNTIME_TARGET") === "cloudflare") {
    throw new Error("Expected runtime env injection cleanup to clear the injected runtime target.");
  }

  console.log("PASS runtime env injection contract resolves Worker-safe config snapshots");
} finally {
  clearLogicstarterRuntimeEnvValues();

  if (originalRuntimeTarget === undefined) {
    delete process.env.RUNTIME_TARGET;
  } else {
    process.env.RUNTIME_TARGET = originalRuntimeTarget;
  }

  if (originalDatabaseProfile === undefined) {
    delete process.env.DATABASE_PROFILE;
  } else {
    process.env.DATABASE_PROFILE = originalDatabaseProfile;
  }

  if (originalStorageProvider === undefined) {
    delete process.env.STORAGE_PROVIDER;
  } else {
    process.env.STORAGE_PROVIDER = originalStorageProvider;
  }

  if (originalEmailProvider === undefined) {
    delete process.env.EMAIL_PROVIDER;
  } else {
    process.env.EMAIL_PROVIDER = originalEmailProvider;
  }
}
