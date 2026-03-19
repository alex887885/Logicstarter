import { readFileSync } from "node:fs";

export type LogicstarterEmailProvider = "better_platform" | "resend" | "smtp" | "ses";
export type LogicstarterSmsProvider = "better_platform" | "console" | "vonage" | "amazon_sns";
export type LogicstarterRuntimeTarget = "node" | "cloudflare" | "vercel";
export type LogicstarterDatabaseProfile = "pg" | "d1";
export type LogicstarterStorageProvider = "local" | "s3" | "r2";

const logicstarterEnvFilePaths = ["/app/.env.runtime", ".env.runtime", "/app/.env", ".env"];
let cachedRuntimeEnvValues: Map<string, string> | null = null;
let injectedRuntimeEnvValues: Map<string, string> | null = null;

function canUseNodeProcessEnv() {
  return typeof process !== "undefined" && !!process.env;
}

function readNodeFileSync(filePath: string) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function normalizeRuntimeEnvValues(values: Record<string, string | undefined>) {
  return new Map(
    Object.entries(values)
      .map(([key, value]) => [key.trim(), value?.trim()] as const)
      .filter((entry): entry is [string, string] => !!entry[0] && !!entry[1]),
  );
}

export function setLogicstarterRuntimeEnvValues(values: Record<string, string | undefined>) {
  injectedRuntimeEnvValues = normalizeRuntimeEnvValues(values);
  cachedRuntimeEnvValues = null;
}

export function clearLogicstarterRuntimeEnvValues() {
  injectedRuntimeEnvValues = null;
  cachedRuntimeEnvValues = null;
}

function readRuntimeEnvValues() {
  if (cachedRuntimeEnvValues) {
    return cachedRuntimeEnvValues;
  }

  if (injectedRuntimeEnvValues) {
    cachedRuntimeEnvValues = injectedRuntimeEnvValues;
    return cachedRuntimeEnvValues;
  }

  const values = new Map<string, string>();

  for (const filePath of logicstarterEnvFilePaths) {
    const content = readNodeFileSync(filePath);
    if (!content) {
      continue;
    }

    for (const line of content.split(/\r?\n/)) {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (key && value && !values.has(key)) {
        values.set(key, value);
      }
    }
  }

  cachedRuntimeEnvValues = values;
  return values;
}

export function readLogicstarterEnvValue(key: string): string | undefined {
  const processValue = canUseNodeProcessEnv() ? process.env[key]?.trim() : undefined;
  const value = processValue || readRuntimeEnvValues().get(key);
  return value ? value : undefined;
}

export function readLogicstarterFirstEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readLogicstarterEnvValue(key);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function readR2AccountIdFromEndpoint(endpoint: string | undefined) {
  if (!endpoint) {
    return undefined;
  }

  try {
    const hostname = new URL(endpoint).hostname;
    const [accountId] = hostname.split(".");
    return accountId?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function readBooleanEnv(key: string) {
  return readLogicstarterEnvValue(key) === "true";
}

export function readLogicstarterRuntimeTarget(): LogicstarterRuntimeTarget {
  const target = readLogicstarterEnvValue("RUNTIME_TARGET")?.toLowerCase();
  if (target === "cloudflare" || target === "vercel" || target === "node") {
    return target;
  }
  return "node";
}

export function isLogicstarterNodeRuntime(target = readLogicstarterRuntimeTarget()) {
  return target === "node";
}

export function supportsLogicstarterRuntimeEnvFileExport(target = readLogicstarterRuntimeTarget()) {
  return target === "node";
}

export function getLogicstarterRuntimeConfigSourceMode(target = readLogicstarterRuntimeTarget()) {
  return supportsLogicstarterRuntimeEnvFileExport(target)
    ? "env_file" as const
    : "deployment_bindings" as const;
}

export function readLogicstarterDatabaseProfile(): LogicstarterDatabaseProfile {
  const profile = readLogicstarterEnvValue("DATABASE_PROFILE")?.toLowerCase();
  if (profile === "d1" || profile === "pg") {
    return profile;
  }
  return "pg";
}

export function readLogicstarterEmailProvider(): LogicstarterEmailProvider {
  const provider = readLogicstarterEnvValue("EMAIL_PROVIDER")?.toLowerCase();
  if (provider === "better_auth_infra" || provider === "better_platform") {
    return "better_platform";
  }
  if (provider === "resend" || provider === "smtp" || provider === "ses") {
    return provider;
  }
  return "better_platform";
}

export function readLogicstarterSmsProvider(): LogicstarterSmsProvider {
  const provider = readLogicstarterEnvValue("SMS_PROVIDER")?.toLowerCase();
  if (provider === "better_auth_infra" || provider === "better_platform") {
    return "better_platform";
  }
  if (provider === "console" || provider === "vonage" || provider === "amazon_sns") {
    return provider;
  }
  return "better_platform";
}

export function readLogicstarterStorageProvider(): LogicstarterStorageProvider {
  const provider = readLogicstarterEnvValue("STORAGE_PROVIDER")?.toLowerCase();
  if (provider === "s3" || provider === "r2" || provider === "local") {
    return provider;
  }
  return "local";
}

export function readLogicstarterProviderConfig() {
  return {
    runtime: {
      target: readLogicstarterRuntimeTarget(),
      databaseProfile: readLogicstarterDatabaseProfile(),
      appOrigin: readLogicstarterEnvValue("APP_ORIGIN"),
      betterAuthUrl: readLogicstarterEnvValue("BETTER_AUTH_URL"),
      authCanonicalOrigin: readLogicstarterEnvValue("AUTH_CANONICAL_ORIGIN"),
    },
    email: {
      provider: readLogicstarterEmailProvider(),
      from: readLogicstarterEnvValue("EMAIL_FROM"),
      fromName: readLogicstarterEnvValue("EMAIL_FROM_NAME"),
      resendApiKey: readLogicstarterEnvValue("RESEND_API_KEY"),
      smtpHost: readLogicstarterEnvValue("SMTP_HOST"),
      smtpPort: readLogicstarterEnvValue("SMTP_PORT"),
      smtpUser: readLogicstarterEnvValue("SMTP_USER"),
      smtpPass: readLogicstarterEnvValue("SMTP_PASS"),
      sesRegion: readLogicstarterEnvValue("SES_REGION"),
      sesAccessKeyId: readLogicstarterEnvValue("SES_ACCESS_KEY_ID"),
      sesSecretAccessKey: readLogicstarterEnvValue("SES_SECRET_ACCESS_KEY"),
    },
    sms: {
      provider: readLogicstarterSmsProvider(),
      vonageApiKey: readLogicstarterEnvValue("VONAGE_API_KEY"),
      vonageApiSecret: readLogicstarterEnvValue("VONAGE_API_SECRET"),
      vonageFrom: readLogicstarterEnvValue("VONAGE_FROM"),
      amazonSnsRegion: readLogicstarterEnvValue("AMAZON_SNS_REGION"),
      amazonSnsAccessKeyId: readLogicstarterEnvValue("AMAZON_SNS_ACCESS_KEY_ID"),
      amazonSnsSecretAccessKey: readLogicstarterEnvValue("AMAZON_SNS_SECRET_ACCESS_KEY"),
      amazonSnsSenderId: readLogicstarterEnvValue("AMAZON_SNS_SENDER_ID"),
    },
    storage: {
      provider: readLogicstarterStorageProvider(),
      localBasePath: readLogicstarterFirstEnvValue("STORAGE_LOCAL_BASE_PATH", "UPLOAD_DIR"),
      publicBaseUrl: readLogicstarterFirstEnvValue("STORAGE_PUBLIC_BASE_URL", "S3_PUBLIC_URL", "R2_PUBLIC_URL"),
      s3Region: readLogicstarterFirstEnvValue("S3_REGION", "R2_REGION"),
      s3Bucket: readLogicstarterFirstEnvValue("S3_BUCKET", "R2_BUCKET"),
      s3AccessKeyId: readLogicstarterFirstEnvValue("S3_ACCESS_KEY_ID", "S3_ACCESS_KEY", "R2_ACCESS_KEY_ID"),
      s3SecretAccessKey: readLogicstarterFirstEnvValue("S3_SECRET_ACCESS_KEY", "S3_SECRET_KEY", "R2_SECRET_ACCESS_KEY"),
      s3Endpoint: readLogicstarterFirstEnvValue("S3_ENDPOINT", "R2_ENDPOINT"),
      s3ForcePathStyle: readLogicstarterEnvValue("S3_FORCE_PATH_STYLE"),
      r2AccountId: readLogicstarterFirstEnvValue("R2_ACCOUNT_ID") ?? readR2AccountIdFromEndpoint(readLogicstarterFirstEnvValue("R2_ENDPOINT", "S3_ENDPOINT")),
      r2Bucket: readLogicstarterFirstEnvValue("R2_BUCKET", "S3_BUCKET"),
      r2AccessKeyId: readLogicstarterEnvValue("R2_ACCESS_KEY_ID"),
      r2SecretAccessKey: readLogicstarterEnvValue("R2_SECRET_ACCESS_KEY"),
    },
    auth: {
      googleEnabled: readBooleanEnv("AUTH_GOOGLE_ENABLED"),
      googleClientId: readLogicstarterEnvValue("AUTH_GOOGLE_CLIENT_ID"),
      googleClientSecret: readLogicstarterEnvValue("AUTH_GOOGLE_CLIENT_SECRET"),
      githubEnabled: readBooleanEnv("AUTH_GITHUB_ENABLED"),
      githubClientId: readLogicstarterEnvValue("AUTH_GITHUB_CLIENT_ID"),
      githubClientSecret: readLogicstarterEnvValue("AUTH_GITHUB_CLIENT_SECRET"),
    },
    billing: {
      stripeSecretKey: readLogicstarterEnvValue("STRIPE_SECRET_KEY"),
      stripePublishableKey: readLogicstarterEnvValue("STRIPE_PUBLISHABLE_KEY"),
      stripeWebhookSecret: readLogicstarterEnvValue("STRIPE_WEBHOOK_SECRET"),
    },
  };
}

export function readLogicstarterSocialProviders() {
  const auth = readLogicstarterProviderConfig().auth;
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};

  if (auth.googleEnabled && auth.googleClientId && auth.googleClientSecret) {
    providers.google = {
      clientId: auth.googleClientId,
      clientSecret: auth.googleClientSecret,
    };
  }

  if (auth.githubEnabled && auth.githubClientId && auth.githubClientSecret) {
    providers.github = {
      clientId: auth.githubClientId,
      clientSecret: auth.githubClientSecret,
    };
  }

  return providers;
}
