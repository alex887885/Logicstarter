import { betterAuth } from "better-auth";
import { cloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { dash } from "@better-auth/infra";
import { i18n } from "@better-auth/i18n";
import { sso } from "@better-auth/sso";
import { organization } from "better-auth/plugins/organization";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { getLogicstarterDatabaseProfile, getLogicstarterDb } from "~/db/index.server";
import * as schema from "~/db/schema";
import { logicstarter } from "~/lib/logicstarter/index.server";
import { readLogicstarterEnvValue, readLogicstarterProviderConfig, readLogicstarterRuntimeTarget, readLogicstarterSocialProviders } from "~/lib/logicstarter/config.server";

type LogicstarterCloudflareRuntimeContext = {
  cloudflare?: {
    env?: Record<string, unknown>;
    cf?: Record<string, unknown> | null;
  };
};

type LogicstarterD1Binding = Parameters<typeof drizzleD1>[0];

function createLogicstarterAuthDatabase() {
  return drizzleAdapter(getLogicstarterDb(), {
    provider: getLogicstarterDatabaseProfile(),
    schema: createLogicstarterAuthDatabaseSchema(),
  });
}

function createLogicstarterAuthDatabaseSchema() {
  return {
    user: schema.user,
    session: schema.session,
    account: schema.account,
    verification: schema.verification,
    organization: schema.organization,
    member: schema.member,
    invitation: schema.invitation,
    ssoProvider: schema.ssoProvider,
  };
}

function isLogicstarterD1Binding(value: unknown): value is LogicstarterD1Binding {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    prepare?: unknown;
    batch?: unknown;
    exec?: unknown;
  };

  return typeof candidate.prepare === "function"
    && typeof candidate.batch === "function"
    && typeof candidate.exec === "function";
}

function resolveLogicstarterCloudflareD1Binding(runtimeContext?: LogicstarterCloudflareRuntimeContext) {
  const envBindings = runtimeContext?.cloudflare?.env;

  if (!envBindings) {
    throw new Error("Cloudflare auth requires loader/action context.cloudflare.env so D1 bindings can be resolved at runtime.");
  }

  for (const value of Object.values(envBindings)) {
    if (isLogicstarterD1Binding(value)) {
      return value;
    }
  }

  throw new Error("Cloudflare auth could not find a D1 binding in context.cloudflare.env. Expose a D1 database binding before enabling RUNTIME_TARGET=cloudflare.");
}

function createCloudflareLogicstarterAuthDatabase(runtimeContext?: LogicstarterCloudflareRuntimeContext) {
  const d1Binding = resolveLogicstarterCloudflareD1Binding(runtimeContext);
  const db = drizzleD1(d1Binding);

  return drizzleAdapter(db, {
    provider: "sqlite",
    schema: createLogicstarterAuthDatabaseSchema(),
  });
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).origin;
    }

    return new URL(`https://${trimmed}`).origin;
  } catch {
    return null;
  }
}

function getRequestOrigin(request?: Request) {
  if (!request) {
    return null;
  }

  try {
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedHost) {
      const protocol = forwardedProto?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "") || "https";
      return `${protocol}://${forwardedHost.split(",")[0].trim()}`;
    }

    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function resolveConfiguredAuthOrigin() {
  const runtime = readLogicstarterProviderConfig().runtime;
  return normalizeOrigin(runtime.authCanonicalOrigin)
    || normalizeOrigin(runtime.betterAuthUrl)
    || normalizeOrigin(runtime.appOrigin)
    || normalizeOrigin(readLogicstarterEnvValue("BETTER_AUTH_URL"))
    || normalizeOrigin(readLogicstarterEnvValue("APP_ORIGIN"));
}

function resolveBetterAuthSecret() {
  const runtimeSecret = readLogicstarterEnvValue("BETTER_AUTH_SECRET");
  if (runtimeSecret) {
    return runtimeSecret;
  }

  throw new Error("BETTER_AUTH_SECRET is required for Logicstarter auth.");
}

function getBaseUrl(request?: Request) {
  return normalizeOrigin(getRequestOrigin(request))
    || resolveConfiguredAuthOrigin();
}

function shouldUseSecureCookies(origin: string | null | undefined) {
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).protocol === "https:";
  } catch {
    return false;
  }
}

function getTrustedOrigins(request?: Request) {
  const trustedOrigins = new Set<string>();
  const runtime = readLogicstarterProviderConfig().runtime;
  const candidates = [
    getRequestOrigin(request),
    runtime.authCanonicalOrigin,
    runtime.betterAuthUrl,
    runtime.appOrigin,
    readLogicstarterEnvValue("BETTER_AUTH_URL"),
    readLogicstarterEnvValue("APP_ORIGIN"),
  ];

  for (const value of candidates) {
    const origin = normalizeOrigin(value);
    if (origin) {
      trustedOrigins.add(origin);
    }
  }

  return [...trustedOrigins];
}

const configuredAuthOrigin = resolveConfiguredAuthOrigin();
const betterAuthSecret = resolveBetterAuthSecret();

const logicstarterAdapter = logicstarter();
const socialProviders = readLogicstarterSocialProviders();

let cachedStripePluginPromise: Promise<unknown | null> | null = null;

async function resolveLogicstarterStripePlugin() {
  if (readLogicstarterRuntimeTarget() !== "node") {
    return null;
  }

  const billingConfig = readLogicstarterProviderConfig().billing;
  const stripeSecretKey = billingConfig.stripeSecretKey?.trim();
  const stripeWebhookSecret = billingConfig.stripeWebhookSecret?.trim();

  if (!stripeSecretKey || !stripeWebhookSecret) {
    return null;
  }

  const [{ stripe }, { default: Stripe }] = await Promise.all([
    import("@better-auth/stripe"),
    import("stripe"),
  ]);

  const stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2025-11-17.clover",
  });

  return stripe({
    stripeClient,
    stripeWebhookSecret,
    createCustomerOnSignUp: true,
    organization: {
      enabled: true,
    },
  });
}

async function getLogicstarterStripePlugin() {
  cachedStripePluginPromise ??= resolveLogicstarterStripePlugin();
  return cachedStripePluginPromise;
}

async function createNodeLogicstarterAuth(request?: Request) {
  const baseURL = getBaseUrl(request) || configuredAuthOrigin;
  const trustedOrigins = getTrustedOrigins(request);
  const useSecureCookies = shouldUseSecureCookies(baseURL);
  const stripePlugin = await getLogicstarterStripePlugin();

  return betterAuth({
    secret: betterAuthSecret,
    baseURL: baseURL ?? undefined,
    trustHost: true,
    trustedOrigins,
    advanced: {
      useSecureCookies,
      crossSubDomainCookies: { enabled: false },
      cookies: {
        state: {
          name: "better-auth.state",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: useSecureCookies,
            maxAge: 600,
          },
        },
        pkce_code_verifier: {
          name: "better-auth.pkce_code_verifier",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: useSecureCookies,
            maxAge: 600,
          },
        },
      },
    },
    database: createLogicstarterAuthDatabase(),
    socialProviders,
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    account: {
      storeStateStrategy: "cookie",
      accountLinking: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url }) {
        await logicstarterAdapter.sendEmail({
          template: "reset-password",
          to: user.email,
          variables: {
            resetLink: url,
            userEmail: user.email,
            userName: user.name,
            appName: "Logicstarter",
          },
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      async sendVerificationEmail({ user, url }) {
        await logicstarterAdapter.sendEmail({
          template: "verify-email",
          to: user.email,
          variables: {
            verificationUrl: url,
            userEmail: user.email,
            userName: user.name,
            appName: "Logicstarter",
          },
        });
      },
    },
    plugins: [
      organization({
        async sendInvitationEmail(data) {
          await logicstarterAdapter.sendEmail({
            template: "invitation",
            to: data.email,
            variables: {
              inviteLink: `${baseURL ?? configuredAuthOrigin ?? ""}/accept-invitation/${data.id}`,
              inviterName: data.inviter.user.name,
              inviterEmail: data.inviter.user.email,
              organizationName: data.organization.name,
              role: data.role,
              appName: "Logicstarter",
            },
          });
        },
      }),
      phoneNumber({
        async sendOTP({ phoneNumber, code }) {
          await logicstarterAdapter.sendSms({
            to: phoneNumber,
            code,
            template: "phone-verification",
          });
        },
      }),
      i18n({
        defaultLocale: "en",
        detection: ["header", "cookie"],
        translations: {
          en: {
            USER_NOT_FOUND: "User not found",
            INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
            INVALID_PASSWORD: "Invalid password",
          },
        },
      }),
      sso(),
      ...(stripePlugin ? [stripePlugin] : []),
      dash({
        apiKey: process.env.BETTER_AUTH_API_KEY,
        activityTracking: {
          enabled: true,
          updateInterval: 300000,
        },
      }),
    ],
  });
}

async function createCloudflareLogicstarterAuth(request?: Request, runtimeContext?: LogicstarterCloudflareRuntimeContext) {
  const databaseProfile = readLogicstarterProviderConfig().runtime.databaseProfile;

  if (databaseProfile !== "d1") {
    throw new Error("Cloudflare auth currently requires DATABASE_PROFILE=d1 before enabling RUNTIME_TARGET=cloudflare.");
  }

  const cloudflareRequestContext = runtimeContext?.cloudflare;

  const baseURL = getBaseUrl(request) || configuredAuthOrigin;
  const trustedOrigins = getTrustedOrigins(request);
  const useSecureCookies = shouldUseSecureCookies(baseURL);

  return betterAuth({
    secret: betterAuthSecret,
    baseURL: baseURL ?? undefined,
    trustHost: true,
    trustedOrigins,
    advanced: {
      useSecureCookies,
      crossSubDomainCookies: { enabled: false },
      cookies: {
        state: {
          name: "better-auth.state",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: useSecureCookies,
            maxAge: 600,
          },
        },
        pkce_code_verifier: {
          name: "better-auth.pkce_code_verifier",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: useSecureCookies,
            maxAge: 600,
          },
        },
      },
    },
    database: createLogicstarterAuthDatabase(),
    socialProviders,
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    account: {
      storeStateStrategy: "cookie",
      accountLinking: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, url }) {
        await logicstarterAdapter.sendEmail({
          template: "reset-password",
          to: user.email,
          variables: {
            resetLink: url,
            userEmail: user.email,
            userName: user.name,
            appName: "Logicstarter",
          },
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      async sendVerificationEmail({ user, url }) {
        await logicstarterAdapter.sendEmail({
          template: "verify-email",
          to: user.email,
          variables: {
            verificationUrl: url,
            userEmail: user.email,
            userName: user.name,
            appName: "Logicstarter",
          },
        });
      },
    },
    plugins: [
      cloudflare({
        cf: cloudflareRequestContext?.cf ?? null,
      }),
      organization({
        async sendInvitationEmail(data) {
          await logicstarterAdapter.sendEmail({
            template: "invitation",
            to: data.email,
            variables: {
              inviteLink: `${baseURL ?? configuredAuthOrigin ?? ""}/accept-invitation/${data.id}`,
              inviterName: data.inviter.user.name,
              inviterEmail: data.inviter.user.email,
              organizationName: data.organization.name,
              role: data.role,
              appName: "Logicstarter",
            },
          });
        },
      }),
      phoneNumber({
        async sendOTP({ phoneNumber, code }) {
          await logicstarterAdapter.sendSms({
            to: phoneNumber,
            code,
            template: "phone-verification",
          });
        },
      }),
      i18n({
        defaultLocale: "en",
        detection: ["header", "cookie"],
        translations: {
          en: {
            USER_NOT_FOUND: "User not found",
            INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
            INVALID_PASSWORD: "Invalid password",
          },
        },
      }),
      sso(),
      dash({
        apiKey: process.env.BETTER_AUTH_API_KEY,
        activityTracking: {
          enabled: true,
          updateInterval: 300000,
        },
      }),
    ],
  });
}

function createVercelLogicstarterAuth(): never {
  throw new Error("Vercel auth factory is not wired yet. Add a Vercel runtime database adapter before enabling RUNTIME_TARGET=vercel.");
}

export async function getLogicstarterAuth(request?: Request, runtimeContext?: LogicstarterCloudflareRuntimeContext) {
  const runtimeTarget = readLogicstarterRuntimeTarget();

  if (runtimeTarget === "cloudflare") {
    return createCloudflareLogicstarterAuth(request, runtimeContext);
  }

  if (runtimeTarget === "vercel") {
    return createVercelLogicstarterAuth();
  }

  return createNodeLogicstarterAuth(request);
}
