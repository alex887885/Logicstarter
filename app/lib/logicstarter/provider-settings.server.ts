import { readLogicstarterProviderConfig } from "~/lib/logicstarter/config.server";
import type { LogicstarterProviderSettingsCategory } from "~/lib/logicstarter/provider-settings-schema.server";

export type LogicstarterProviderSettingDetail = {
  key: string;
  value: string;
  source: "env" | "default";
};

export const logicstarterProviderSettingsKeys = {
  email: [
    "EMAIL_PROVIDER",
    "EMAIL_FROM",
    "EMAIL_FROM_NAME",
    "RESEND_API_KEY",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SES_REGION",
    "SES_ACCESS_KEY_ID",
    "SES_SECRET_ACCESS_KEY",
  ],
  sms: [
    "SMS_PROVIDER",
    "VONAGE_API_KEY",
    "VONAGE_API_SECRET",
    "VONAGE_FROM",
    "AMAZON_SNS_REGION",
    "AMAZON_SNS_ACCESS_KEY_ID",
    "AMAZON_SNS_SECRET_ACCESS_KEY",
    "AMAZON_SNS_SENDER_ID",
  ],
  storage: [
    "STORAGE_PROVIDER",
    "STORAGE_LOCAL_BASE_PATH",
    "STORAGE_PUBLIC_BASE_URL",
    "S3_REGION",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_ENDPOINT",
    "S3_FORCE_PATH_STYLE",
    "R2_ACCOUNT_ID",
    "R2_BUCKET",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ],
  authentication: [
    "AUTH_GOOGLE_ENABLED",
    "AUTH_GOOGLE_CLIENT_ID",
    "AUTH_GOOGLE_CLIENT_SECRET",
    "AUTH_GITHUB_ENABLED",
    "AUTH_GITHUB_CLIENT_ID",
    "AUTH_GITHUB_CLIENT_SECRET",
  ],
  billing: [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ],
} as const satisfies Record<LogicstarterProviderSettingsCategory, string[]>;

function normalizeSettingValue(value: string | boolean | undefined) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return value ?? "";
}

function readRawEnvValue(key: string) {
  return process.env[key]?.trim();
}

function hasMeaningfulEnvOverride(key: string) {
  const rawValue = readRawEnvValue(key);

  if (!rawValue) {
    return false;
  }

  if (key === "EMAIL_PROVIDER") {
    return rawValue !== "better_auth_infra" && rawValue !== "better_platform";
  }

  if (key === "SMS_PROVIDER") {
    return rawValue !== "better_auth_infra" && rawValue !== "better_platform";
  }

  if (key === "STORAGE_PROVIDER") {
    return rawValue === "local" || rawValue === "s3" || rawValue === "r2";
  }

  if (key === "AUTH_GOOGLE_ENABLED") {
    return rawValue === "true" || !!readRawEnvValue("AUTH_GOOGLE_CLIENT_ID") || !!readRawEnvValue("AUTH_GOOGLE_CLIENT_SECRET");
  }

  if (key === "AUTH_GITHUB_ENABLED") {
    return rawValue === "true" || !!readRawEnvValue("AUTH_GITHUB_CLIENT_ID") || !!readRawEnvValue("AUTH_GITHUB_CLIENT_SECRET");
  }

  return true;
}

function getLogicstarterEnvValues() {
  const config = readLogicstarterProviderConfig();

  return {
    EMAIL_PROVIDER: config.email.provider,
    EMAIL_FROM: config.email.from,
    EMAIL_FROM_NAME: config.email.fromName,
    RESEND_API_KEY: config.email.resendApiKey,
    SMTP_HOST: config.email.smtpHost,
    SMTP_PORT: config.email.smtpPort,
    SMTP_USER: config.email.smtpUser,
    SMTP_PASS: config.email.smtpPass,
    SES_REGION: config.email.sesRegion,
    SES_ACCESS_KEY_ID: config.email.sesAccessKeyId,
    SES_SECRET_ACCESS_KEY: config.email.sesSecretAccessKey,
    SMS_PROVIDER: config.sms.provider,
    VONAGE_API_KEY: config.sms.vonageApiKey,
    VONAGE_API_SECRET: config.sms.vonageApiSecret,
    VONAGE_FROM: config.sms.vonageFrom,
    AMAZON_SNS_REGION: config.sms.amazonSnsRegion,
    AMAZON_SNS_ACCESS_KEY_ID: config.sms.amazonSnsAccessKeyId,
    AMAZON_SNS_SECRET_ACCESS_KEY: config.sms.amazonSnsSecretAccessKey,
    AMAZON_SNS_SENDER_ID: config.sms.amazonSnsSenderId,
    STORAGE_PROVIDER: config.storage.provider,
    STORAGE_LOCAL_BASE_PATH: config.storage.localBasePath,
    STORAGE_PUBLIC_BASE_URL: config.storage.publicBaseUrl,
    S3_REGION: config.storage.s3Region,
    S3_BUCKET: config.storage.s3Bucket,
    S3_ACCESS_KEY_ID: config.storage.s3AccessKeyId,
    S3_SECRET_ACCESS_KEY: config.storage.s3SecretAccessKey,
    S3_ENDPOINT: config.storage.s3Endpoint,
    S3_FORCE_PATH_STYLE: config.storage.s3ForcePathStyle,
    R2_ACCOUNT_ID: config.storage.r2AccountId,
    R2_BUCKET: config.storage.r2Bucket,
    R2_ACCESS_KEY_ID: config.storage.r2AccessKeyId,
    R2_SECRET_ACCESS_KEY: config.storage.r2SecretAccessKey,
    AUTH_GOOGLE_ENABLED: config.auth.googleEnabled,
    AUTH_GOOGLE_CLIENT_ID: config.auth.googleClientId,
    AUTH_GOOGLE_CLIENT_SECRET: config.auth.googleClientSecret,
    AUTH_GITHUB_ENABLED: config.auth.githubEnabled,
    AUTH_GITHUB_CLIENT_ID: config.auth.githubClientId,
    AUTH_GITHUB_CLIENT_SECRET: config.auth.githubClientSecret,
    STRIPE_SECRET_KEY: config.billing.stripeSecretKey,
    STRIPE_PUBLISHABLE_KEY: config.billing.stripePublishableKey,
    STRIPE_WEBHOOK_SECRET: config.billing.stripeWebhookSecret,
  } as const;
}

async function getMergedLogicstarterProviderSettings(keys: string[]) {
  const envValues = getLogicstarterEnvValues();

  return Object.fromEntries(
    keys.map((key) => {
      const envValue = envValues[key as keyof typeof envValues];
      const envOverride = hasMeaningfulEnvOverride(key);
      const source = envOverride ? "env" : "default";

      return [
        key,
        {
          key,
          value: normalizeSettingValue(envValue),
          source,
        },
      ];
    }),
  ) as Record<string, LogicstarterProviderSettingDetail>;
}

export async function getLogicstarterProviderSettingsByCategory(category: LogicstarterProviderSettingsCategory) {
  return getMergedLogicstarterProviderSettings(logicstarterProviderSettingsKeys[category]);
}

export async function getManyLogicstarterProviderSettingsDetail(keys: string[]) {
  return getMergedLogicstarterProviderSettings(keys);
}
