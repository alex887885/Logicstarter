import { readLogicstarterProviderConfig } from "~/lib/logicstarter/config.server";

export async function getResolvedLogicstarterProviderSettingValues() {
  const baseConfig = readLogicstarterProviderConfig();

  return {
    EMAIL_PROVIDER: baseConfig.email.provider,
    EMAIL_FROM: baseConfig.email.from ?? "",
    EMAIL_FROM_NAME: baseConfig.email.fromName ?? "",
    RESEND_API_KEY: baseConfig.email.resendApiKey ?? "",
    SMTP_HOST: baseConfig.email.smtpHost ?? "",
    SMTP_PORT: baseConfig.email.smtpPort ?? "",
    SMTP_USER: baseConfig.email.smtpUser ?? "",
    SMTP_PASS: baseConfig.email.smtpPass ?? "",
    SES_REGION: baseConfig.email.sesRegion ?? "",
    SES_ACCESS_KEY_ID: baseConfig.email.sesAccessKeyId ?? "",
    SES_SECRET_ACCESS_KEY: baseConfig.email.sesSecretAccessKey ?? "",
    SMS_PROVIDER: baseConfig.sms.provider,
    VONAGE_API_KEY: baseConfig.sms.vonageApiKey ?? "",
    VONAGE_API_SECRET: baseConfig.sms.vonageApiSecret ?? "",
    VONAGE_FROM: baseConfig.sms.vonageFrom ?? "",
    AMAZON_SNS_REGION: baseConfig.sms.amazonSnsRegion ?? "",
    AMAZON_SNS_ACCESS_KEY_ID: baseConfig.sms.amazonSnsAccessKeyId ?? "",
    AMAZON_SNS_SECRET_ACCESS_KEY: baseConfig.sms.amazonSnsSecretAccessKey ?? "",
    AMAZON_SNS_SENDER_ID: baseConfig.sms.amazonSnsSenderId ?? "",
    STORAGE_PROVIDER: baseConfig.storage.provider,
    STORAGE_LOCAL_BASE_PATH: baseConfig.storage.localBasePath ?? "",
    STORAGE_PUBLIC_BASE_URL: baseConfig.storage.publicBaseUrl ?? "",
    S3_REGION: baseConfig.storage.s3Region ?? "",
    S3_BUCKET: baseConfig.storage.s3Bucket ?? "",
    S3_ACCESS_KEY_ID: baseConfig.storage.s3AccessKeyId ?? "",
    S3_SECRET_ACCESS_KEY: baseConfig.storage.s3SecretAccessKey ?? "",
    S3_ENDPOINT: baseConfig.storage.s3Endpoint ?? "",
    S3_FORCE_PATH_STYLE: baseConfig.storage.s3ForcePathStyle ?? "",
    R2_ACCOUNT_ID: baseConfig.storage.r2AccountId ?? "",
    R2_BUCKET: baseConfig.storage.r2Bucket ?? "",
    R2_ACCESS_KEY_ID: baseConfig.storage.r2AccessKeyId ?? "",
    R2_SECRET_ACCESS_KEY: baseConfig.storage.r2SecretAccessKey ?? "",
    AUTH_GOOGLE_ENABLED: baseConfig.auth.googleEnabled ? "true" : "false",
    AUTH_GOOGLE_CLIENT_ID: baseConfig.auth.googleClientId ?? "",
    AUTH_GOOGLE_CLIENT_SECRET: baseConfig.auth.googleClientSecret ?? "",
    AUTH_GITHUB_ENABLED: baseConfig.auth.githubEnabled ? "true" : "false",
    AUTH_GITHUB_CLIENT_ID: baseConfig.auth.githubClientId ?? "",
    AUTH_GITHUB_CLIENT_SECRET: baseConfig.auth.githubClientSecret ?? "",
    STRIPE_SECRET_KEY: baseConfig.billing.stripeSecretKey ?? "",
    STRIPE_PUBLISHABLE_KEY: baseConfig.billing.stripePublishableKey ?? "",
    STRIPE_WEBHOOK_SECRET: baseConfig.billing.stripeWebhookSecret ?? "",
  };
}

export async function getResolvedLogicstarterProviderConfig() {
  return readLogicstarterProviderConfig();
}
