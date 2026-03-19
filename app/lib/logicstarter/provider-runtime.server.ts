import { getLogicstarterRuntimeConfigSourceMode, readLogicstarterProviderConfig, readLogicstarterRuntimeTarget, supportsLogicstarterRuntimeEnvFileExport } from "~/lib/logicstarter/config.server";
import { getResolvedLogicstarterProviderConfig } from "~/lib/logicstarter/runtime-config.server";
import { createLogicstarterStorageProvider, getLogicstarterStorageRuntimeSnapshot } from "~/lib/logicstarter/storage.server";

type LogicstarterBillingRuntimeSnapshot = {
  runtimeTarget: "node" | "cloudflare" | "vercel";
  stripeSecretKeyConfigured: boolean;
  stripePublishableKeyConfigured: boolean;
  stripeWebhookSecretConfigured: boolean;
  serverPluginEligible: boolean;
  serverPathMode: "node_only" | "worker_safe_api" | "worker_unsupported";
  pluginActive: boolean;
  checkoutReady: boolean;
  webhookReady: boolean;
};

export async function getLogicstarterAuthRuntimeSnapshot() {
  const resolvedConfig = await getResolvedLogicstarterProviderConfig();
  const runtime = resolvedConfig.runtime;
  const googleEnabled = resolvedConfig.auth.googleEnabled;
  const githubEnabled = resolvedConfig.auth.githubEnabled;
  const googleConfigured = googleEnabled && !!resolvedConfig.auth.googleClientId && !!resolvedConfig.auth.googleClientSecret;
  const githubConfigured = githubEnabled && !!resolvedConfig.auth.githubClientId && !!resolvedConfig.auth.githubClientSecret;
  const trustedOriginReady = !!runtime.betterAuthUrl || !!runtime.appOrigin || !!runtime.authCanonicalOrigin;

  return {
    provider: "better_auth" as const,
    snapshot: {
      emailPasswordEnabled: true,
      googleEnabled,
      googleConfigured,
      githubEnabled,
      githubConfigured,
      betterAuthUrlConfigured: !!runtime.betterAuthUrl,
      appOriginConfigured: !!runtime.appOrigin,
      authCanonicalOriginConfigured: !!runtime.authCanonicalOrigin,
      trustedOriginReady,
      socialProvidersConfigured: Number(googleConfigured) + Number(githubConfigured),
    },
  };
}

export async function getLogicstarterProviderRuntimeOverview() {
  const providerConfig = readLogicstarterProviderConfig();
  const runtimeConfig = providerConfig.runtime;
  const authRuntime = await getLogicstarterAuthRuntimeSnapshot();
  const emailRuntime = await getLogicstarterEmailRuntimeSnapshot();
  const smsRuntime = await getLogicstarterSmsRuntimeSnapshot();
  const billingSnapshot = await getLogicstarterBillingRuntimeSnapshot();
  const billingStatus = getLogicstarterBillingRuntimeStatus(billingSnapshot);
  const storageProvider = createLogicstarterStorageProvider();
  const storageSnapshot = getLogicstarterStorageRuntimeSnapshot();

  let storageRuntimeReady = true;
  let storageError: string | null = null;
  try {
    await storageProvider.validateConfig();
  } catch (error) {
    storageRuntimeReady = false;
    storageError = error instanceof Error ? error.message : "Unable to validate Logicstarter storage runtime.";
  }

  const modules = {
    authentication: {
      provider: authRuntime.provider,
      runtimeReady: !!authRuntime.snapshot.trustedOriginReady,
      attention: authRuntime.snapshot.trustedOriginReady ? "healthy" : "action_required",
      remediation: authRuntime.snapshot.trustedOriginReady
        ? "Authentication origins are ready for Better Auth requests."
        : "Set BETTER_AUTH_URL, APP_ORIGIN, or AUTH_CANONICAL_ORIGIN before validating sign-in flows.",
      socialProvidersConfigured: authRuntime.snapshot.socialProvidersConfigured,
      snapshot: authRuntime.snapshot,
    },
    email: {
      provider: emailRuntime.provider,
      runtimeReady: !!emailRuntime.snapshot.providerReady,
      attention: emailRuntime.snapshot.providerReady ? "healthy" : "action_required",
      remediation: emailRuntime.snapshot.providerReady
        ? `Email provider ${emailRuntime.provider} is ready.`
        : `Complete the required credentials for the active email provider ${emailRuntime.provider}.`,
      snapshot: emailRuntime.snapshot,
    },
    sms: {
      provider: smsRuntime.provider,
      runtimeReady: !!smsRuntime.snapshot.providerReady,
      attention: smsRuntime.snapshot.providerReady ? "healthy" : "action_required",
      remediation: smsRuntime.snapshot.providerReady
        ? `SMS provider ${smsRuntime.provider} is ready.`
        : `Complete the required credentials for the active SMS provider ${smsRuntime.provider}.`,
      snapshot: smsRuntime.snapshot,
    },
    billing: {
      provider: "stripe",
      runtimeReady: !!billingSnapshot.pluginActive,
      attention: billingStatus.attention,
      remediation: billingStatus.remediation,
      runtimeHealth: billingStatus.runtimeHealth,
      checkoutReadiness: billingStatus.checkoutReadiness,
      webhookReadiness: billingStatus.webhookReadiness,
      snapshot: billingSnapshot,
    },
    storage: {
      provider: storageProvider.provider,
      runtimeReady: storageRuntimeReady,
      attention: storageRuntimeReady ? "healthy" : "action_required",
      remediation: storageRuntimeReady
        ? `Storage provider ${storageProvider.provider} is ready.`
        : storageError ?? "Fix the active storage provider configuration before validating uploads.",
      snapshot: storageSnapshot,
      error: storageError,
    },
  };

  const readyCount = Object.values(modules).filter((module) => module.runtimeReady).length;
  const incompleteCount = Object.values(modules).length - readyCount;
  const attentionModules = Object.entries(modules)
    .filter(([, module]) => !module.runtimeReady)
    .map(([name, module]) => ({
      name,
      provider: module.provider,
      remediation: module.remediation,
    }));
  const cloudflareBlockers = [
    modules.storage.provider === "local"
      ? {
          name: "storage",
          reason: "Local storage depends on a writable filesystem and should be replaced with R2 or another remote object store before targeting Cloudflare Workers.",
        }
      : null,
    billingSnapshot.serverPathMode === "worker_safe_api"
      ? null
      : {
          name: "billing",
          reason: "Stripe billing now lazy-loads only for the node runtime target, but checkout and webhook handling still depend on a Node-only server path until a Worker-safe Stripe integration is introduced.",
        },
  ].filter((item): item is { name: string; reason: string } => !!item);
  const cloudflareCompatible = cloudflareBlockers.length === 0;

  return {
    runtime: {
      target: runtimeConfig.target,
      databaseProfile: runtimeConfig.databaseProfile,
      supportsRuntimeEnvFileExport: supportsLogicstarterRuntimeEnvFileExport(runtimeConfig.target),
      configSourceMode: getLogicstarterRuntimeConfigSourceMode(runtimeConfig.target),
      cloudflareCompatible,
      cloudflareBlockers,
    },
    modules,
    summary: {
      readyCount,
      incompleteCount,
      totalCount: Object.values(modules).length,
      attentionModules,
    },
  };
}

export async function getLogicstarterBillingRuntimeSnapshot(): Promise<LogicstarterBillingRuntimeSnapshot> {
  const resolvedConfig = await getResolvedLogicstarterProviderConfig();
  const runtimeTarget = readLogicstarterRuntimeTarget();
  const serverPluginEligible = runtimeTarget === "node";
  const hasServerKeys = !!resolvedConfig.billing.stripeSecretKey && !!resolvedConfig.billing.stripeWebhookSecret;
  const hasWorkerSafeKeys = !!resolvedConfig.billing.stripeSecretKey && !!resolvedConfig.billing.stripeWebhookSecret;
  const workerPathEligible = runtimeTarget !== "node" && hasWorkerSafeKeys;

  return {
    runtimeTarget,
    stripeSecretKeyConfigured: !!resolvedConfig.billing.stripeSecretKey,
    stripePublishableKeyConfigured: !!resolvedConfig.billing.stripePublishableKey,
    stripeWebhookSecretConfigured: !!resolvedConfig.billing.stripeWebhookSecret,
    serverPluginEligible,
    serverPathMode: serverPluginEligible
      ? "node_only" as const
      : workerPathEligible
        ? "worker_safe_api" as const
        : "worker_unsupported" as const,
    pluginActive: serverPluginEligible && hasServerKeys,
    checkoutReady: !!resolvedConfig.billing.stripeSecretKey && !!resolvedConfig.billing.stripePublishableKey,
    webhookReady: serverPluginEligible ? hasServerKeys : workerPathEligible,
  };
}

export function getLogicstarterBillingRuntimeStatus(snapshot: LogicstarterBillingRuntimeSnapshot) {
  const runtimeHealth = snapshot.pluginActive
    ? "Stripe plugin active"
    : snapshot.serverPathMode === "worker_safe_api"
      ? `Worker-safe Stripe billing route active on ${snapshot.runtimeTarget}`
    : !snapshot.serverPluginEligible && (snapshot.stripeSecretKeyConfigured || snapshot.stripeWebhookSecretConfigured || snapshot.stripePublishableKeyConfigured)
      ? `Stripe server path unavailable on ${snapshot.runtimeTarget}`
    : snapshot.stripeSecretKeyConfigured || snapshot.stripeWebhookSecretConfigured || snapshot.stripePublishableKeyConfigured
      ? "Partial Stripe configuration"
      : "Stripe plugin inactive";
  const checkoutReadiness = snapshot.checkoutReady
    ? snapshot.serverPluginEligible
      ? "Server and client billing keys are present"
      : snapshot.serverPathMode === "worker_safe_api"
        ? `Worker-safe checkout route is available on ${snapshot.runtimeTarget}`
      : `Billing keys are present, but ${snapshot.runtimeTarget} still needs a Worker-safe server path`
    : "Missing server or client billing key";
  const webhookReadiness = snapshot.webhookReady
    ? "Webhook verification ready"
    : !snapshot.serverPluginEligible && snapshot.stripeWebhookSecretConfigured
      ? `Webhook secret is present, but ${snapshot.runtimeTarget} cannot use the current node-only webhook path`
      : "Webhook secret missing";
  const attention = snapshot.pluginActive ? "healthy" : "action_required";
  const remediation = snapshot.pluginActive
    ? "Stripe runtime is ready. You can validate checkout and webhook delivery from the current runtime origin."
    : snapshot.serverPathMode === "worker_safe_api"
      ? `Stripe runtime is ready through the Worker-safe billing API on ${snapshot.runtimeTarget}. Validate the dedicated checkout and webhook routes from the current runtime origin.`
    : !snapshot.serverPluginEligible && (snapshot.stripeSecretKeyConfigured || snapshot.stripeWebhookSecretConfigured || snapshot.stripePublishableKeyConfigured)
      ? `Stripe values are configured, but the current ${snapshot.runtimeTarget} runtime still needs a Worker-safe checkout and webhook implementation instead of the existing node-only server path.`
    : snapshot.stripeSecretKeyConfigured && !snapshot.stripeWebhookSecretConfigured
      ? "Add the Stripe webhook secret, export the values to .env.runtime, and restart the service before testing webhooks."
      : !snapshot.stripeSecretKeyConfigured && snapshot.stripeWebhookSecretConfigured
        ? "Add the Stripe secret key so the Better Auth Stripe plugin can initialize with webhook verification enabled."
        : snapshot.stripeSecretKeyConfigured && snapshot.stripeWebhookSecretConfigured && !snapshot.stripePublishableKeyConfigured
          ? "Add the Stripe publishable key before validating browser checkout surfaces."
          : "Add the Stripe secret key and webhook secret, export the values to .env.runtime, and restart the service before testing billing flows.";

  return {
    attention,
    remediation,
    runtimeHealth,
    checkoutReadiness,
    webhookReadiness,
  };
}

export async function getLogicstarterEmailRuntimeSnapshot() {
  const resolvedConfig = await getResolvedLogicstarterProviderConfig();
  const provider = resolvedConfig.email.provider;

  return {
    provider,
    snapshot: {
      fromConfigured: !!resolvedConfig.email.from,
      fromNameConfigured: !!resolvedConfig.email.fromName,
      resendApiKeyConfigured: !!resolvedConfig.email.resendApiKey,
      smtpHostConfigured: !!resolvedConfig.email.smtpHost,
      smtpPortConfigured: !!resolvedConfig.email.smtpPort,
      smtpUserConfigured: !!resolvedConfig.email.smtpUser,
      smtpPassConfigured: !!resolvedConfig.email.smtpPass,
      sesRegionConfigured: !!resolvedConfig.email.sesRegion,
      sesAccessKeyIdConfigured: !!resolvedConfig.email.sesAccessKeyId,
      sesSecretAccessKeyConfigured: !!resolvedConfig.email.sesSecretAccessKey,
      providerReady: provider === "better_platform"
        ? true
        : provider === "resend"
          ? !!resolvedConfig.email.from && !!resolvedConfig.email.resendApiKey
          : provider === "smtp"
            ? !!resolvedConfig.email.from && !!resolvedConfig.email.smtpHost && !!resolvedConfig.email.smtpPort && !!resolvedConfig.email.smtpUser && !!resolvedConfig.email.smtpPass
            : !!resolvedConfig.email.from && !!resolvedConfig.email.sesRegion && !!resolvedConfig.email.sesAccessKeyId && !!resolvedConfig.email.sesSecretAccessKey,
    },
  };
}

export async function getLogicstarterSmsRuntimeSnapshot() {
  const resolvedConfig = await getResolvedLogicstarterProviderConfig();
  const provider = resolvedConfig.sms.provider;

  return {
    provider,
    snapshot: {
      vonageApiKeyConfigured: !!resolvedConfig.sms.vonageApiKey,
      vonageApiSecretConfigured: !!resolvedConfig.sms.vonageApiSecret,
      vonageFromConfigured: !!resolvedConfig.sms.vonageFrom,
      amazonSnsRegionConfigured: !!resolvedConfig.sms.amazonSnsRegion,
      amazonSnsAccessKeyIdConfigured: !!resolvedConfig.sms.amazonSnsAccessKeyId,
      amazonSnsSecretAccessKeyConfigured: !!resolvedConfig.sms.amazonSnsSecretAccessKey,
      amazonSnsSenderIdConfigured: !!resolvedConfig.sms.amazonSnsSenderId,
      providerReady: provider === "better_platform" || provider === "console"
        ? true
        : provider === "vonage"
          ? !!resolvedConfig.sms.vonageApiKey && !!resolvedConfig.sms.vonageApiSecret && !!resolvedConfig.sms.vonageFrom
          : !!resolvedConfig.sms.amazonSnsRegion && !!resolvedConfig.sms.amazonSnsAccessKeyId && !!resolvedConfig.sms.amazonSnsSecretAccessKey && !!resolvedConfig.sms.amazonSnsSenderId,
    },
  };
}
