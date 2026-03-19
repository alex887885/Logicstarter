import { z } from "zod";

const optionalTrimmedString = z.string().trim().optional();
const optionalEmail = z.union([z.literal(""), z.string().email()]).optional();
const optionalPort = z.union([z.literal(""), z.string().regex(/^\d{2,5}$/)]).optional();
const optionalUrl = z.union([z.literal(""), z.string().url(), z.string().regex(/^\/uploads\/[A-Za-z0-9/_\-.]+$/)]).optional();
const emailProviderSchema = z.union([
  z.literal("better_platform"),
  z.literal("better_auth_infra"),
  z.literal("resend"),
  z.literal("smtp"),
  z.literal("ses"),
]).transform((value) => value === "better_auth_infra" ? "better_platform" : value);
const smsProviderSchema = z.union([
  z.literal("better_platform"),
  z.literal("better_auth_infra"),
  z.literal("console"),
  z.literal("vonage"),
  z.literal("amazon_sns"),
]).transform((value) => value === "better_auth_infra" ? "better_platform" : value);

export const logicstarterProviderSettingsSchemas = {
  email: z.object({
    category: z.literal("email"),
    EMAIL_PROVIDER: emailProviderSchema,
    EMAIL_FROM: optionalEmail,
    EMAIL_FROM_NAME: optionalTrimmedString,
    RESEND_API_KEY: optionalTrimmedString,
    SMTP_HOST: optionalTrimmedString,
    SMTP_PORT: optionalPort,
    SMTP_USER: optionalTrimmedString,
    SMTP_PASS: optionalTrimmedString,
    SES_REGION: optionalTrimmedString,
    SES_ACCESS_KEY_ID: optionalTrimmedString,
    SES_SECRET_ACCESS_KEY: optionalTrimmedString,
  }).superRefine((value, ctx) => {
    if (value.EMAIL_PROVIDER === "resend" && (!value.RESEND_API_KEY || !value.EMAIL_FROM)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["RESEND_API_KEY"], message: "Resend API key and email from are required." });
    }

    if (value.EMAIL_PROVIDER === "smtp" && (!value.SMTP_HOST || !value.SMTP_PORT || !value.SMTP_USER || !value.SMTP_PASS || !value.EMAIL_FROM)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SMTP_HOST"], message: "SMTP host, port, user, password, and email from are required." });
    }

    if (value.EMAIL_PROVIDER === "ses" && (!value.SES_REGION || !value.SES_ACCESS_KEY_ID || !value.SES_SECRET_ACCESS_KEY || !value.EMAIL_FROM)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SES_REGION"], message: "SES region, credentials, and email from are required." });
    }
  }),
  sms: z.object({
    category: z.literal("sms"),
    SMS_PROVIDER: smsProviderSchema,
    VONAGE_API_KEY: optionalTrimmedString,
    VONAGE_API_SECRET: optionalTrimmedString,
    VONAGE_FROM: optionalTrimmedString,
    AMAZON_SNS_REGION: optionalTrimmedString,
    AMAZON_SNS_ACCESS_KEY_ID: optionalTrimmedString,
    AMAZON_SNS_SECRET_ACCESS_KEY: optionalTrimmedString,
    AMAZON_SNS_SENDER_ID: optionalTrimmedString,
  }).superRefine((value, ctx) => {
    if (value.SMS_PROVIDER === "vonage" && (!value.VONAGE_API_KEY || !value.VONAGE_API_SECRET || !value.VONAGE_FROM)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["VONAGE_API_KEY"], message: "Vonage API key, secret, and from are required." });
    }

    if (value.SMS_PROVIDER === "amazon_sns" && (!value.AMAZON_SNS_REGION || !value.AMAZON_SNS_ACCESS_KEY_ID || !value.AMAZON_SNS_SECRET_ACCESS_KEY || !value.AMAZON_SNS_SENDER_ID)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["AMAZON_SNS_REGION"], message: "Amazon SNS region, credentials, and sender ID are required." });
    }
  }),
  storage: z.object({
    category: z.literal("storage"),
    STORAGE_PROVIDER: z.enum(["local", "s3", "r2"]),
    STORAGE_LOCAL_BASE_PATH: optionalTrimmedString,
    STORAGE_PUBLIC_BASE_URL: optionalUrl,
    S3_REGION: optionalTrimmedString,
    S3_BUCKET: optionalTrimmedString,
    S3_ACCESS_KEY_ID: optionalTrimmedString,
    S3_SECRET_ACCESS_KEY: optionalTrimmedString,
    S3_ENDPOINT: optionalUrl,
    S3_FORCE_PATH_STYLE: z.union([z.literal(""), z.literal("true"), z.literal("false")]).optional(),
    R2_ACCOUNT_ID: optionalTrimmedString,
    R2_BUCKET: optionalTrimmedString,
    R2_ACCESS_KEY_ID: optionalTrimmedString,
    R2_SECRET_ACCESS_KEY: optionalTrimmedString,
  }).superRefine((value, ctx) => {
    if (value.STORAGE_PROVIDER === "local" && !value.STORAGE_LOCAL_BASE_PATH) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["STORAGE_LOCAL_BASE_PATH"], message: "Local base path is required for local storage." });
    }

    if (value.STORAGE_PROVIDER === "s3" && (!value.S3_REGION || !value.S3_BUCKET || !value.S3_ACCESS_KEY_ID || !value.S3_SECRET_ACCESS_KEY)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["S3_REGION"], message: "S3 region, bucket, and credentials are required." });
    }

    if (value.STORAGE_PROVIDER === "r2" && (!value.R2_ACCOUNT_ID || !value.R2_BUCKET || !value.R2_ACCESS_KEY_ID || !value.R2_SECRET_ACCESS_KEY)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["R2_ACCOUNT_ID"], message: "R2 account, bucket, and credentials are required." });
    }
  }),
  authentication: z.object({
    category: z.literal("authentication"),
    AUTH_GOOGLE_ENABLED: z.union([z.literal(""), z.literal("true"), z.literal("false")]).optional(),
    AUTH_GOOGLE_CLIENT_ID: optionalTrimmedString,
    AUTH_GOOGLE_CLIENT_SECRET: optionalTrimmedString,
    AUTH_GITHUB_ENABLED: z.union([z.literal(""), z.literal("true"), z.literal("false")]).optional(),
    AUTH_GITHUB_CLIENT_ID: optionalTrimmedString,
    AUTH_GITHUB_CLIENT_SECRET: optionalTrimmedString,
  }).superRefine((value, ctx) => {
    if (value.AUTH_GOOGLE_ENABLED === "true" && (!value.AUTH_GOOGLE_CLIENT_ID || !value.AUTH_GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["AUTH_GOOGLE_CLIENT_ID"], message: "Google client ID and secret are required when Google sign-in is enabled." });
    }

    if (value.AUTH_GITHUB_ENABLED === "true" && (!value.AUTH_GITHUB_CLIENT_ID || !value.AUTH_GITHUB_CLIENT_SECRET)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["AUTH_GITHUB_CLIENT_ID"], message: "GitHub client ID and secret are required when GitHub sign-in is enabled." });
    }
  }),
  billing: z.object({
    category: z.literal("billing"),
    STRIPE_SECRET_KEY: optionalTrimmedString,
    STRIPE_PUBLISHABLE_KEY: optionalTrimmedString,
    STRIPE_WEBHOOK_SECRET: optionalTrimmedString,
  }).superRefine((value, ctx) => {
    const hasAnyStripeValue = !!value.STRIPE_SECRET_KEY || !!value.STRIPE_PUBLISHABLE_KEY || !!value.STRIPE_WEBHOOK_SECRET;
    if (hasAnyStripeValue && (!value.STRIPE_SECRET_KEY || !value.STRIPE_WEBHOOK_SECRET)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["STRIPE_SECRET_KEY"], message: "Stripe secret key and webhook secret are required together when Stripe billing is configured." });
    }
  }),
} as const;

export type LogicstarterProviderSettingsCategory = keyof typeof logicstarterProviderSettingsSchemas;

export function parseLogicstarterProviderSettingsCategory(rawCategory: string): LogicstarterProviderSettingsCategory | null {
  if (rawCategory === "email" || rawCategory === "sms" || rawCategory === "storage" || rawCategory === "authentication" || rawCategory === "billing") {
    return rawCategory;
  }

  return null;
}

export function parseLogicstarterProviderSettingsForm(
  category: LogicstarterProviderSettingsCategory,
  values: Record<string, string>,
) {
  return logicstarterProviderSettingsSchemas[category].safeParse({
    category,
    ...values,
  });
}
