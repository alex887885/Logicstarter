import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useFetcher, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { listEnabledLogicstarterAuthMethods } from "~/lib/logicstarter/auth-methods.server";
import { getLogicstarterFirstLoginState } from "~/lib/logicstarter/first-login.server";
import type { LogicstarterProviderSettingsCategory } from "~/lib/logicstarter/provider-settings-schema.server";
import {
  getLogicstarterProviderSettingsResponse,
  resolveLogicstarterProviderSettingsCategory,
} from "~/lib/logicstarter/provider-settings-route.server";

type SettingsSection = Awaited<ReturnType<typeof getLogicstarterProviderSettingsResponse>>;

const categoryMeta: Record<LogicstarterProviderSettingsCategory, {
  label: string;
  eyebrow: string;
  description: string;
}> = {
  email: {
    label: "Email",
    eyebrow: "Communications",
    description: "Manage email provider selection, sender identity, and delivery credentials.",
  },
  sms: {
    label: "SMS",
    eyebrow: "Communications",
    description: "Control SMS delivery providers, relay credentials, and runtime env values.",
  },
  storage: {
    label: "Storage",
    eyebrow: "Assets",
    description: "Configure local, S3, or R2 storage before enabling shared uploads and generated asset flows.",
  },
  authentication: {
    label: "Authentication",
    eyebrow: "Login",
    description: "Configure Google and GitHub login before testing the Better Auth sign-in flow.",
  },
  billing: {
    label: "Billing",
    eyebrow: "Payments",
    description: "Manage Stripe runtime keys and webhook configuration used by the Better Auth Stripe plugin.",
  },
} as const;

const fieldOptions = {
  EMAIL_PROVIDER: [
    { value: "better_platform", label: "Better Platform" },
    { value: "resend", label: "Resend" },
    { value: "smtp", label: "SMTP" },
    { value: "ses", label: "Amazon SES" },
  ],
  SMS_PROVIDER: [
    { value: "better_platform", label: "Better Platform" },
    { value: "console", label: "Console" },
    { value: "vonage", label: "Vonage" },
    { value: "amazon_sns", label: "Amazon SNS" },
  ],
  STORAGE_PROVIDER: [
    { value: "local", label: "Local" },
    { value: "s3", label: "Amazon S3" },
    { value: "r2", label: "Cloudflare R2" },
  ],
  AUTH_GOOGLE_ENABLED: [
    { value: "false", label: "Disabled" },
    { value: "true", label: "Enabled" },
  ],
  AUTH_GITHUB_ENABLED: [
    { value: "false", label: "Disabled" },
    { value: "true", label: "Enabled" },
  ],
} as const satisfies Record<string, Array<{ value: string; label: string }>>;

const fieldLabels: Record<string, string> = {
  EMAIL_PROVIDER: "Email provider",
  EMAIL_FROM: "From email",
  EMAIL_FROM_NAME: "From name",
  RESEND_API_KEY: "Resend API key",
  SMTP_HOST: "SMTP host",
  SMTP_PORT: "SMTP port",
  SMTP_USER: "SMTP username",
  SMTP_PASS: "SMTP password",
  SES_REGION: "SES region",
  SES_ACCESS_KEY_ID: "SES access key ID",
  SES_SECRET_ACCESS_KEY: "SES secret access key",
  SMS_PROVIDER: "SMS provider",
  VONAGE_API_KEY: "Vonage API key",
  VONAGE_API_SECRET: "Vonage API secret",
  VONAGE_FROM: "Vonage sender",
  AMAZON_SNS_REGION: "Amazon SNS region",
  AMAZON_SNS_ACCESS_KEY_ID: "Amazon SNS access key ID",
  AMAZON_SNS_SECRET_ACCESS_KEY: "Amazon SNS secret access key",
  AMAZON_SNS_SENDER_ID: "Amazon SNS sender ID",
  STORAGE_PROVIDER: "Storage provider",
  STORAGE_LOCAL_BASE_PATH: "Local base path",
  STORAGE_PUBLIC_BASE_URL: "Public base URL",
  S3_REGION: "S3 region",
  S3_BUCKET: "S3 bucket",
  S3_ACCESS_KEY_ID: "S3 access key ID",
  S3_SECRET_ACCESS_KEY: "S3 secret access key",
  S3_ENDPOINT: "S3 endpoint",
  S3_FORCE_PATH_STYLE: "S3 force path style",
  R2_ACCOUNT_ID: "R2 account ID",
  R2_BUCKET: "R2 bucket",
  R2_ACCESS_KEY_ID: "R2 access key ID",
  R2_SECRET_ACCESS_KEY: "R2 secret access key",
  AUTH_GOOGLE_ENABLED: "Google sign-in",
  AUTH_GOOGLE_CLIENT_ID: "Google client ID",
  AUTH_GOOGLE_CLIENT_SECRET: "Google client secret",
  AUTH_GITHUB_ENABLED: "GitHub sign-in",
  AUTH_GITHUB_CLIENT_ID: "GitHub client ID",
  AUTH_GITHUB_CLIENT_SECRET: "GitHub client secret",
  STRIPE_SECRET_KEY: "Stripe secret key",
  STRIPE_PUBLISHABLE_KEY: "Stripe publishable key",
  STRIPE_WEBHOOK_SECRET: "Stripe webhook secret",
};

const fieldHelpText: Record<string, string> = {
  EMAIL_PROVIDER: "Choose which email delivery provider Logicstarter should use.",
  SMS_PROVIDER: "Choose which SMS delivery provider Logicstarter should use.",
  STORAGE_PROVIDER: "Choose which storage backend Logicstarter should use for shared uploads and generated assets.",
  STORAGE_PUBLIC_BASE_URL: "Optional public base URL used when stored files should resolve to a stable public address.",
  AUTH_GOOGLE_ENABLED: "Turn Google login on or off.",
  AUTH_GITHUB_ENABLED: "Turn GitHub login on or off.",
  STRIPE_SECRET_KEY: "Server-side Stripe secret key used by the Better Auth Stripe plugin.",
  STRIPE_PUBLISHABLE_KEY: "Client-side Stripe publishable key for browser checkout surfaces.",
  STRIPE_WEBHOOK_SECRET: "Webhook signing secret from the Stripe endpoint configured for this site.",
};

function isSecretField(key: string) {
  return key.includes("SECRET") || key.includes("PASS") || key.includes("API_KEY");
}

function getInitialFieldValues(section: SettingsSection) {
  return Object.fromEntries(
    Object.values(section.settings).map((setting) => [setting.key, setting.value]),
  ) as Record<string, string>;
}

function getVisibleSettingKeys(category: SettingsSection["category"], values: Record<string, string>) {
  if (category === "email") {
    const provider = values.EMAIL_PROVIDER || "better_platform";
    if (provider === "resend") {
      return ["EMAIL_PROVIDER", "EMAIL_FROM", "EMAIL_FROM_NAME", "RESEND_API_KEY"];
    }
    if (provider === "smtp") {
      return ["EMAIL_PROVIDER", "EMAIL_FROM", "EMAIL_FROM_NAME", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
    }
    if (provider === "ses") {
      return ["EMAIL_PROVIDER", "EMAIL_FROM", "EMAIL_FROM_NAME", "SES_REGION", "SES_ACCESS_KEY_ID", "SES_SECRET_ACCESS_KEY"];
    }
    return ["EMAIL_PROVIDER", "EMAIL_FROM", "EMAIL_FROM_NAME"];
  }

  if (category === "sms") {
    const provider = values.SMS_PROVIDER || "better_platform";
    if (provider === "vonage") {
      return ["SMS_PROVIDER", "VONAGE_API_KEY", "VONAGE_API_SECRET", "VONAGE_FROM"];
    }
    if (provider === "amazon_sns") {
      return ["SMS_PROVIDER", "AMAZON_SNS_REGION", "AMAZON_SNS_ACCESS_KEY_ID", "AMAZON_SNS_SECRET_ACCESS_KEY", "AMAZON_SNS_SENDER_ID"];
    }
    return ["SMS_PROVIDER"];
  }

  if (category === "storage") {
    const provider = values.STORAGE_PROVIDER || "local";
    if (provider === "s3") {
      return ["STORAGE_PROVIDER", "STORAGE_PUBLIC_BASE_URL", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_ENDPOINT", "S3_FORCE_PATH_STYLE"];
    }
    if (provider === "r2") {
      return ["STORAGE_PROVIDER", "STORAGE_PUBLIC_BASE_URL", "R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
    }
    return ["STORAGE_PROVIDER", "STORAGE_LOCAL_BASE_PATH", "STORAGE_PUBLIC_BASE_URL"];
  }

  if (category === "authentication") {
    const keys = ["AUTH_GOOGLE_ENABLED", "AUTH_GITHUB_ENABLED"];
    if (values.AUTH_GOOGLE_ENABLED === "true") {
      keys.push("AUTH_GOOGLE_CLIENT_ID", "AUTH_GOOGLE_CLIENT_SECRET");
    }
    if (values.AUTH_GITHUB_ENABLED === "true") {
      keys.push("AUTH_GITHUB_CLIENT_ID", "AUTH_GITHUB_CLIENT_SECRET");
    }
    return keys;
  }

  return ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"];
}

function formatFieldSource(source: "env" | "default") {
  return source === "env"
    ? "Currently resolved from an explicit runtime env value."
    : "Currently resolved from the built-in default snapshot.";
}

function ValueBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-white">{label}</p>
      <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-slate-100 break-all">
        {value}
      </div>
    </div>
  );
}

function BillingApiReferenceCard({ requestOrigin }: { requestOrigin: string }) {
  const runtimeUrl = `${requestOrigin}/api/billing/runtime`;
  const stripeCheckoutUrl = `${requestOrigin}/api/billing/checkout`;
  const stripeStateUrl = `${requestOrigin}/api/billing/state`;
  const stripeSyncUrl = `${requestOrigin}/api/billing/sync`;
  const stripeWebhookUrl = `${requestOrigin}/api/billing/webhook`;

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Stripe API quick reference</p>
      <h3 className="mt-3 text-lg font-semibold text-white">Billing endpoints in this runtime</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Billing runtime snapshot" value={runtimeUrl} />
        <ValueBlock label="Stripe checkout endpoint" value={stripeCheckoutUrl} />
        <ValueBlock label="Billing state endpoint" value={stripeStateUrl} />
        <ValueBlock label="Billing sync endpoint" value={stripeSyncUrl} />
        <ValueBlock label="Stripe webhook endpoint" value={stripeWebhookUrl} />
        <ValueBlock label="Current runtime origin" value={requestOrigin} />
        <div>
          <p className="font-medium text-white">Operator notes</p>
          <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-200">
            Use deployment bindings and secrets as the runtime source of truth on Workers. In Node-target workflows, export updated Stripe values to `.env.runtime` and restart the service before validating webhook delivery. If webhook delivery was delayed or missed, run the authenticated billing sync endpoint to repair local customer and subscription state from Stripe.
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderRuntimeOverviewCard() {
  const fetcher = useFetcher<{
    ok: boolean;
    runtime?: {
      target?: string;
      databaseProfile?: string;
      supportsRuntimeEnvFileExport?: boolean;
      configSourceMode?: string;
      cloudflareCompatible?: boolean;
      cloudflareBlockers?: Array<{ name: string; reason: string }>;
    };
    modules?: Record<string, { provider?: string; runtimeReady?: boolean; attention?: string; remediation?: string }>;
    summary?: {
      readyCount?: number;
      incompleteCount?: number;
      totalCount?: number;
      attentionModules?: Array<{ name: string; provider?: string; remediation?: string }>;
    };
  }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/providers/runtime");
    }
  }, [fetcher]);

  const modules = fetcher.data?.modules ?? {};
  const runtime = fetcher.data?.runtime;
  const summary = fetcher.data?.summary;
  const providerSummary = Object.entries(modules)
    .map(([name, module]) => `${name}: ${module.provider ?? "unknown"}`)
    .join(" · ");
  const attentionModules = summary?.attentionModules ?? [];
  const cloudflareChecklist = runtime?.cloudflareCompatible
    ? [
        "Switch RUNTIME_TARGET to cloudflare when the deployment config and runtime bindings are ready.",
        "Keep remote object storage on R2 or another shared object store before validating uploads in Workers.",
        "Re-run the runtime overview after deployment to confirm the target and provider surfaces still report healthy.",
      ]
    : [
        "Keep STORAGE_PROVIDER on r2 or another remote object store before moving Worker uploads into the mainline path.",
        "Billing is now gated behind the node runtime target, but Stripe checkout and webhook handling still need a Worker-safe path before Cloudflare can become the primary runtime.",
        "Treat Cloudflare bindings and secrets as the source of truth for provider configuration, and export env content from this page before updating deployment secrets manually.",
      ];

  return (
    <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Provider runtime overview</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Live operator readiness</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This summary is sourced from the active runtime APIs instead of only merged form values.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
          {providerSummary || "Loading runtime providers..."}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatusPill label="Runtime-ready modules" value={summary?.readyCount ?? 0} tone="emerald" />
        <StatusPill label="Needs attention" value={summary?.incompleteCount ?? 0} tone="sky" />
        <StatusPill label="Tracked modules" value={summary?.totalCount ?? 0} tone="slate" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ValueBlock label="Runtime target" value={runtime?.target ?? "unknown"} />
        <ValueBlock label="Database profile" value={runtime?.databaseProfile ?? "unknown"} />
        <ValueBlock label="Cloudflare compatibility" value={runtime?.cloudflareCompatible ? "Ready for CF-first follow-up" : "Blocked by Node-first surfaces"} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Runtime config mode" value={runtime?.configSourceMode ?? "unknown"} />
        <ValueBlock label="Runtime env export" value={runtime?.supportsRuntimeEnvFileExport ? "Node env file workflow available" : "Worker runtime should use deployment bindings and secrets"} />
      </div>
      <div className="mt-4 space-y-3">
        {(runtime?.cloudflareBlockers ?? []).map((item) => (
          <div key={item.name} className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
            <div className="font-medium text-white">CF blocker · {item.name}</div>
            <div className="mt-1 text-cyan-100/90">{item.reason}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[24px] border border-violet-400/20 bg-violet-500/10 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-violet-200">Cloudflare deployment guide</p>
        <h3 className="mt-3 text-lg font-semibold text-white">CF-first runtime checklist</h3>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          Use this checklist when you switch Logicstarter from a Node runtime to a Cloudflare Worker target. The overview above reflects the current runtime state, while this card highlights the deployment assumptions that must change for Workers.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ValueBlock label="Target to apply" value={runtime?.target === "cloudflare" ? "cloudflare" : "cloudflare (planned)"} />
          <ValueBlock label="Preferred CF database profile" value={runtime?.databaseProfile === "d1" ? "d1" : `${runtime?.databaseProfile ?? "unknown"} → prefer d1 for Worker-native deployments`} />
          <ValueBlock label="Runtime env export" value={runtime?.supportsRuntimeEnvFileExport ? "Available only in Node-target workflows" : "Use bindings/secrets for runtime config and upload exported values manually"} />
          <ValueBlock label="Current CF status" value={runtime?.cloudflareCompatible ? "No known CF blockers in the tracked provider overview" : "CF blockers still exist in the tracked provider overview"} />
        </div>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-100">
          {cloudflareChecklist.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {attentionModules.length > 0 ? attentionModules.map((item) => (
          <div key={item.name} className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
            <div className="font-medium text-white">{item.name} · {item.provider ?? "unknown"}</div>
            <div className="mt-1 text-amber-100/90">{item.remediation ?? "Review this module before proceeding."}</div>
          </div>
        )) : (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            All tracked modules are currently runtime-ready.
          </div>
        )}
      </div>
    </div>
  );
}

function AuthenticationRuntimeStatusCard() {
  const fetcher = useFetcher<{
    ok: boolean;
    provider?: string;
    snapshot?: {
      emailPasswordEnabled?: boolean;
      googleEnabled?: boolean;
      googleConfigured?: boolean;
      githubEnabled?: boolean;
      githubConfigured?: boolean;
      betterAuthUrlConfigured?: boolean;
      appOriginConfigured?: boolean;
      authCanonicalOriginConfigured?: boolean;
      trustedOriginReady?: boolean;
      socialProvidersConfigured?: number;
    };
  }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/auth/runtime");
    }
  }, [fetcher]);

  const snapshot = fetcher.data?.snapshot;
  const runtimeHealth = snapshot?.trustedOriginReady
    ? "Authentication runtime ready"
    : "Authentication origin configuration incomplete";

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Authentication runtime status</p>
      <h3 className="mt-3 text-lg font-semibold text-white">Active authentication runtime</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Runtime health" value={runtimeHealth} />
        <ValueBlock label="Provider" value={fetcher.data?.provider || "better_auth"} />
        <ValueBlock label="Email/password" value={snapshot?.emailPasswordEnabled ? "Enabled" : "Disabled"} />
        <ValueBlock label="Google enabled" value={snapshot?.googleEnabled ? "Enabled" : "Disabled"} />
        <ValueBlock label="Google configured" value={snapshot?.googleConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="GitHub enabled" value={snapshot?.githubEnabled ? "Enabled" : "Disabled"} />
        <ValueBlock label="GitHub configured" value={snapshot?.githubConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Better Auth URL" value={snapshot?.betterAuthUrlConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="App origin" value={snapshot?.appOriginConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Canonical origin" value={snapshot?.authCanonicalOriginConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Trusted origin readiness" value={snapshot?.trustedOriginReady ? "Ready" : "Missing"} />
        <ValueBlock label="Configured social providers" value={String(snapshot?.socialProvidersConfigured ?? 0)} />
      </div>
    </div>
  );
}

function StorageApiReferenceCard({ requestOrigin }: { requestOrigin: string }) {
  const runtimeUrl = `${requestOrigin}/api/storage/runtime`;
  const signedUrl = `${requestOrigin}/api/storage/signed-url`;
  const uploadUrl = `${requestOrigin}/api/storage/upload`;
  const deleteUrl = `${requestOrigin}/api/storage/delete`;
  const uploadsUrl = `${requestOrigin}/uploads/...`;

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Storage API quick reference</p>
      <h3 className="mt-3 text-lg font-semibold text-white">Operator endpoints</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Runtime status" value={`GET ${runtimeUrl}`} />
        <ValueBlock label="Signed URL" value={`POST ${signedUrl}`} />
        <ValueBlock label="Upload file" value={`POST ${uploadUrl}`} />
        <ValueBlock label="Delete file" value={`POST ${deleteUrl}`} />
        <ValueBlock label="Public files" value={`GET ${uploadsUrl}`} />
      </div>
      <div className="mt-4 grid gap-4">
        <ValueBlock label="Runtime curl" value={`curl -s ${runtimeUrl}`} />
        <ValueBlock label="Signed URL curl" value={`curl -s -X POST ${signedUrl} -H 'content-type: application/json' --data '{"key":"homepage/example.txt","method":"GET"}'`} />
        <ValueBlock label="Direct upload prep curl" value={`curl -s -X POST ${signedUrl} -H 'content-type: application/json' --data '{"key":"homepage/example.txt","method":"PUT","contentType":"text/plain"}'`} />
        <ValueBlock label="Delete curl" value={`curl -s -X POST ${deleteUrl} -H 'content-type: application/json' --data '{"key":"homepage/example.txt"}'`} />
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
        <div><span className="text-slate-400">Signed URL contract:</span> `POST /api/storage/signed-url` requires a signed-in Better Auth session and accepts `GET` or `PUT` in the request body.</div>
        <div className="mt-2"><span className="text-slate-400">Provider support:</span> `local` supports signed `GET` only. `s3` and `r2` support signed `GET` and signed `PUT` for direct uploads.</div>
        <div className="mt-2"><span className="text-slate-400">Direct upload guidance:</span> Use `POST /api/storage/signed-url` with <code>{'{"method":"PUT"}'}</code> only when the active provider is `s3` or `r2`.</div>
        <div><span className="text-slate-400">Auth contract:</span> `POST /api/storage/upload` and `POST /api/storage/delete` require a signed-in Better Auth session and reject anonymous requests with `401`.</div>
        <div className="mt-2"><span className="text-slate-400">Method contract:</span> `GET /api/storage/upload` and `GET /api/storage/delete` return `405 Method Not Allowed`.</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/" className="inline-flex items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20">
          Open homepage upload panel
        </Link>
        <a href={runtimeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10">
          Open runtime JSON
        </a>
      </div>
    </div>
  );
}

function StorageRuntimeStatusCard() {
  const fetcher = useFetcher<{
    ok: boolean;
    provider?: string;
    snapshot?: {
      provider?: string;
      localBasePath?: string;
      publicBaseUrl?: string | null;
      s3Region?: string | null;
      s3Bucket?: string | null;
      s3Endpoint?: string | null;
      s3ForcePathStyle?: boolean;
      r2AccountId?: string | null;
      r2Bucket?: string | null;
      resolvedEndpoint?: string | null;
      capabilities?: {
        putObject?: boolean;
        deleteObject?: boolean;
        signedGetUrl?: boolean;
        signedPutUrl?: boolean;
        publicObjectUrl?: boolean;
      };
    };
    capabilities?: {
      putObject?: boolean;
      deleteObject?: boolean;
      signedGetUrl?: boolean;
      signedPutUrl?: boolean;
      publicObjectUrl?: boolean;
    };
    uploadPolicy?: {
      maxUploadBytes?: number;
      accept?: string;
      label?: string;
      contentTypes?: string[];
    };
    error?: string;
  }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/storage/runtime");
    }
  }, [fetcher]);

  const isLoading = fetcher.state !== "idle";
  const snapshot = fetcher.data?.snapshot;
  const capabilities = fetcher.data?.capabilities || snapshot?.capabilities;
  const uploadPolicy = fetcher.data?.uploadPolicy;
  const resolvedProvider = fetcher.data?.provider || snapshot?.provider || "unknown";
  const publicDeliveryMode = snapshot?.publicBaseUrl
    ? "Stable public base URL"
    : resolvedProvider === "r2" || resolvedProvider === "s3"
      ? "Provider-managed object URL"
      : "Local uploads route";
  const directUploadReadiness = capabilities?.signedPutUrl
    ? "Ready for signed PUT uploads"
    : "Signed PUT unavailable in this runtime";
  const runtimeHealth = fetcher.data?.ok === false
    ? "Configuration error"
    : resolvedProvider === "r2" || resolvedProvider === "s3"
      ? "Remote object storage active"
      : "Local filesystem storage active";

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Storage runtime status</p>
          <h3 className="mt-3 text-lg font-semibold text-white">Active storage runtime</h3>
        </div>
        <button
          type="button"
          onClick={() => fetcher.load("/api/storage/runtime")}
          disabled={isLoading}
          className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Refreshing..." : "Refresh runtime status"}
        </button>
      </div>

      {fetcher.data?.ok === false ? (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {fetcher.data.error || "Unable to validate the active storage runtime."}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Runtime health" value={runtimeHealth} />
        <ValueBlock label="Provider" value={resolvedProvider} />
        <ValueBlock label="Public delivery mode" value={publicDeliveryMode} />
        <ValueBlock label="Direct upload readiness" value={directUploadReadiness} />
        <ValueBlock label="Public base URL" value={snapshot?.publicBaseUrl || "/uploads"} />
        <ValueBlock label="Local path" value={snapshot?.localBasePath || "Not applicable"} />
        <ValueBlock label="Bucket target" value={snapshot?.s3Bucket || snapshot?.r2Bucket || "Not configured"} />
        <ValueBlock label="R2 account" value={snapshot?.r2AccountId || "Not applicable"} />
        <ValueBlock label="Resolved endpoint" value={snapshot?.resolvedEndpoint || snapshot?.s3Endpoint || "Not applicable"} />
        <ValueBlock label="Signed GET support" value={capabilities?.signedGetUrl ? "Enabled" : "Unavailable"} />
        <ValueBlock label="Signed PUT support" value={capabilities?.signedPutUrl ? "Enabled" : "Unavailable"} />
        <ValueBlock label="Upload support" value={capabilities?.putObject ? "Enabled" : "Unavailable"} />
        <ValueBlock label="Delete support" value={capabilities?.deleteObject ? "Enabled" : "Unavailable"} />
        <ValueBlock label="Upload policy" value={uploadPolicy?.label || "Not available"} />
        <ValueBlock label="Max upload bytes" value={String(uploadPolicy?.maxUploadBytes ?? "Not available")} />
        <ValueBlock label="Accept" value={uploadPolicy?.accept || "Not available"} />
        <ValueBlock label="Allowed content types" value={uploadPolicy?.contentTypes?.join(", ") || "Not available"} />
      </div>
    </div>
  );
}

function SettingField({
  setting,
  value,
  disabled,
  error,
  onValueChange,
}: {
  setting: SettingsSection["settings"][string];
  value: string;
  disabled: boolean;
  error?: string[];
  onValueChange: (nextValue: string) => void;
}) {
  const options = fieldOptions[setting.key as keyof typeof fieldOptions];

  return (
    <label className="block rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-white">{fieldLabels[setting.key] ?? setting.key}</span>
        <span className={setting.source === "env"
          ? "rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-sky-300"
          : "rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300"}
        >
          {setting.source}
        </span>
      </div>
      {options ? (
        <select
          name={setting.key}
          value={value || options[0]?.value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/40"
        >
          {options.map((option: { value: string; label: string }) => (
            <option key={option.value} value={option.value} className="bg-slate-950 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={setting.key}
          type={isSecretField(setting.key) ? "password" : "text"}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/40"
        />
      )}
      <p className="mt-2 text-xs leading-5 text-slate-400">
        {fieldHelpText[setting.key] ?? formatFieldSource(setting.source)}
      </p>
      {error?.length ? <p className="mt-2 text-sm text-rose-300">{error.join(" ")}</p> : null}
    </label>
  );
}

function resolveRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const protocol = forwardedProto?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "") || "https";
    return `${protocol}://${forwardedHost.split(",")[0].trim()}`;
  }

  return new URL(request.url).origin;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const focusedCategory = resolveLogicstarterProviderSettingsCategory(url.searchParams.get("category"));
  const firstLogin = await getLogicstarterFirstLoginState();
  const requestOrigin = resolveRequestOrigin(request);

  return {
    email: await getLogicstarterProviderSettingsResponse("email"),
    sms: await getLogicstarterProviderSettingsResponse("sms"),
    storage: await getLogicstarterProviderSettingsResponse("storage"),
    authentication: await getLogicstarterProviderSettingsResponse("authentication"),
    billing: await getLogicstarterProviderSettingsResponse("billing"),
    authMethods: listEnabledLogicstarterAuthMethods(),
    focusedCategory,
    firstLogin,
    requestOrigin,
  };
}

export default function SettingsProvidersPage() {
  const data = useLoaderData<typeof loader>();
  const allSections = [data.email, data.sms, data.storage, data.authentication, data.billing];
  const sections = data.focusedCategory
    ? allSections.filter((section) => section.category === data.focusedCategory)
    : allSections;
  const focusedSection = data.focusedCategory
    ? allSections.find((section) => section.category === data.focusedCategory) ?? null
    : null;
  const categoryTabs = [
    { label: "All", value: null },
    { label: "Email", value: "email" },
    { label: "SMS", value: "sms" },
    { label: "Storage", value: "storage" },
    { label: "Authentication", value: "authentication" },
    { label: "Billing", value: "billing" },
  ] as const;
  const focusedEnvExport = focusedSection
    ? Object.values(focusedSection.settings)
        .map((setting) => `${setting.key}=${setting.value}`)
        .join("\n")
    : null;
  const sourceCounts = allSections.reduce(
    (counts, section) => {
      for (const setting of Object.values(section.settings)) {
        counts[setting.source] = (counts[setting.source] ?? 0) + 1;
      }
      return counts;
    },
    {} as Record<string, number>,
  );
  const configuredFieldCount = allSections.reduce(
    (count, section) => count + Object.values(section.settings).filter((setting) => setting.value.trim() !== "").length,
    0,
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#020617_42%,#020617_100%)] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="rounded-[32px] border border-white/10 bg-[rgba(8,15,30,0.78)] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Logicstarter operator console</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Provider settings</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                This page is now the env-only provider workspace. You can review runtime sources, validate provider input, write values into the runtime env file, and export deployment-ready configuration before testing login.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/" className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/10">
                Back to home
              </Link>
              <Link to="/settings/providers?category=authentication" className="inline-flex items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20">
                Prepare login test
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryPanel label="Visible categories" value={String(allSections.length)} detail="Email, SMS, storage, authentication, and billing are all exposed here." />
            <SummaryPanel label="Configured fields" value={String(configuredFieldCount)} detail="Non-empty provider values currently resolved into the runtime snapshot." />
            <SummaryPanel label="Default-backed fields" value={String(sourceCounts.default ?? 0)} detail="Fields currently falling back to the built-in default runtime snapshot." />
            <SummaryPanel label="Env-backed fields" value={String(sourceCounts.env ?? 0)} detail="Fields currently taking precedence from explicit runtime env values." />
          </div>

          <ProviderRuntimeOverviewCard />

          {data.firstLogin.bootstrapAdminSetup ? (
            <div className="mt-8">
              <BootstrapAdminCard />
            </div>
          ) : null}
        </header>

        <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Navigation</p>
            <div className="mt-5 space-y-3">
              {categoryTabs.map((tab) => {
                const isActive = tab.value === data.focusedCategory || (!tab.value && !data.focusedCategory);

                return (
                  <Link
                    key={tab.label}
                    to={tab.value ? `/settings/providers?category=${tab.value}` : "/settings/providers"}
                    className={isActive
                      ? "block rounded-[22px] border border-sky-400/30 bg-sky-500/10 px-4 py-4 text-sm font-medium text-sky-200"
                      : "block rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"}
                  >
                    <div>{tab.label}</div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {tab.value ? categoryMeta[tab.value].description : "Show the full runtime snapshot across all available categories."}
                    </p>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Enabled auth methods</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.authMethods.map((method) => (
                  <span
                    key={method.key}
                    className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200"
                  >
                    {method.label}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {sections.map((section) => (
              <ProviderValidationCard key={section.category} section={section} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Runtime snapshot</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">Full env export</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This export reflects the full provider and authentication configuration currently resolved from env values in Logicstarter.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-[24px] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-slate-200">
              <code>{data.email.envExport}</code>
            </pre>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Focused export</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">Category export preview</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {focusedSection
                ? `This export is focused on ${categoryMeta[focusedSection.category].label}. Use it when you only want one category while testing.`
                : "Select a category tab to preview a focused export for a single configuration group."}
            </p>
            <pre className="mt-6 overflow-x-auto rounded-[24px] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-slate-200">
              <code>{focusedEnvExport ?? "Select email, sms, storage, authentication, or billing to preview a focused export."}</code>
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryPanel({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{value}</div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

function StorageProviderGuide({ provider }: { provider: string }) {
  const title = provider === "s3"
    ? "Amazon S3 runtime checklist"
    : provider === "r2"
      ? "Cloudflare R2 runtime checklist"
      : "Local storage runtime checklist";
  const detail = provider === "s3"
    ? "Use this mode when Logicstarter should write shared uploads into an S3-compatible bucket that works across Node and Worker runtime targets."
    : provider === "r2"
      ? "Use this mode for Cloudflare-first object storage while keeping the Logicstarter storage contract aligned with the shared provider model."
      : "Use this mode for local development and simple Node deployments before shared object storage is configured.";
  const checklist = provider === "s3"
    ? [
        "Confirm the bucket, region, and IAM credentials are scoped for Logicstarter uploads.",
        "Use a stable public URL or rely on signed GET URLs depending on your distribution model.",
        "Keep signed PUT enabled only when browser direct uploads are part of the deployment plan.",
      ]
    : provider === "r2"
      ? [
          "Confirm the R2 account ID, bucket, and access keys match the active production bucket.",
          "Verify STORAGE_PUBLIC_BASE_URL points at the public file domain when public object delivery is expected.",
          "Use the runtime card to confirm signed PUT support is enabled before validating direct uploads.",
        ]
      : [
          "Use STORAGE_LOCAL_BASE_PATH for the writable uploads directory inside the Node runtime.",
          "Expect signed GET support only; signed PUT remains unavailable for local storage.",
          "Move to R2 or S3 before relying on cross-instance shared uploads or browser direct upload flows.",
        ];

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Storage guidance</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
        {checklist.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingRuntimeStatusCard({
}: {}) {
  const fetcher = useFetcher<{
    ok: boolean;
    provider?: string;
    attention?: string;
    remediation?: string;
    runtimeHealth?: string;
    checkoutReadiness?: string;
    webhookReadiness?: string;
    snapshot?: {
      runtimeTarget?: string;
      stripeSecretKeyConfigured?: boolean;
      stripePublishableKeyConfigured?: boolean;
      stripeWebhookSecretConfigured?: boolean;
      serverPluginEligible?: boolean;
      serverPathMode?: string;
      pluginActive?: boolean;
      checkoutReady?: boolean;
      webhookReady?: boolean;
    };
  }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/billing/runtime");
    }
  }, [fetcher]);

  const snapshot = fetcher.data?.snapshot;
  const runtimeHealth = fetcher.data?.runtimeHealth ?? "Loading billing runtime...";
  const checkoutReadiness = fetcher.data?.checkoutReadiness ?? "Loading checkout readiness...";
  const webhookReadiness = fetcher.data?.webhookReadiness ?? "Loading webhook readiness...";
  const remediation = fetcher.data?.remediation ?? "Checking Stripe runtime status...";

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Billing runtime status</p>
      <h3 className="mt-3 text-lg font-semibold text-white">Active Stripe runtime</h3>
      <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-50">
        {remediation}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Runtime health" value={runtimeHealth} />
        <ValueBlock label="Checkout readiness" value={checkoutReadiness} />
        <ValueBlock label="Webhook readiness" value={webhookReadiness} />
        <ValueBlock label="Provider" value={fetcher.data?.provider || "stripe"} />
        <ValueBlock label="Runtime target" value={snapshot?.runtimeTarget || "unknown"} />
        <ValueBlock label="Server path mode" value={snapshot?.serverPathMode === "node_only" ? "Node-only" : snapshot?.serverPathMode === "worker_unsupported" ? "Worker-safe path required" : "unknown"} />
        <ValueBlock label="Secret key" value={snapshot?.stripeSecretKeyConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Publishable key" value={snapshot?.stripePublishableKeyConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Webhook secret" value={snapshot?.stripeWebhookSecretConfigured ? "Configured" : "Missing"} />
      </div>
    </div>
  );
}

function EmailRuntimeStatusCard() {
  const fetcher = useFetcher<{
    ok: boolean;
    provider?: string;
    snapshot?: {
      fromConfigured?: boolean;
      fromNameConfigured?: boolean;
      resendApiKeyConfigured?: boolean;
      smtpHostConfigured?: boolean;
      smtpPortConfigured?: boolean;
      smtpUserConfigured?: boolean;
      smtpPassConfigured?: boolean;
      sesRegionConfigured?: boolean;
      sesAccessKeyIdConfigured?: boolean;
      sesSecretAccessKeyConfigured?: boolean;
      providerReady?: boolean;
    };
  }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/email/runtime");
    }
  }, [fetcher]);

  const snapshot = fetcher.data?.snapshot;
  const provider = fetcher.data?.provider || "unknown";
  const runtimeHealth = snapshot?.providerReady ? "Email provider ready" : "Email provider incomplete";

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Email runtime status</p>
      <h3 className="mt-3 text-lg font-semibold text-white">Active email runtime</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Runtime health" value={runtimeHealth} />
        <ValueBlock label="Provider" value={provider} />
        <ValueBlock label="From email" value={snapshot?.fromConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="From name" value={snapshot?.fromNameConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Resend API key" value={snapshot?.resendApiKeyConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SMTP host" value={snapshot?.smtpHostConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SMTP port" value={snapshot?.smtpPortConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SMTP user" value={snapshot?.smtpUserConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SMTP password" value={snapshot?.smtpPassConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SES region" value={snapshot?.sesRegionConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SES access key" value={snapshot?.sesAccessKeyIdConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SES secret key" value={snapshot?.sesSecretAccessKeyConfigured ? "Configured" : "Missing"} />
      </div>
    </div>
  );
}

function SmsRuntimeStatusCard() {
  const fetcher = useFetcher<{
    ok: boolean;
    provider?: string;
    snapshot?: {
      vonageApiKeyConfigured?: boolean;
      vonageApiSecretConfigured?: boolean;
      vonageFromConfigured?: boolean;
      amazonSnsRegionConfigured?: boolean;
      amazonSnsAccessKeyIdConfigured?: boolean;
      amazonSnsSecretAccessKeyConfigured?: boolean;
      amazonSnsSenderIdConfigured?: boolean;
      providerReady?: boolean;
    };
  }>();

  useEffect(() => {
    if (fetcher.state === "idle" && !fetcher.data) {
      fetcher.load("/api/sms/runtime");
    }
  }, [fetcher]);

  const snapshot = fetcher.data?.snapshot;
  const provider = fetcher.data?.provider || "unknown";
  const runtimeHealth = snapshot?.providerReady ? "SMS provider ready" : "SMS provider incomplete";

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">SMS runtime status</p>
      <h3 className="mt-3 text-lg font-semibold text-white">Active SMS runtime</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ValueBlock label="Runtime health" value={runtimeHealth} />
        <ValueBlock label="Provider" value={provider} />
        <ValueBlock label="Vonage API key" value={snapshot?.vonageApiKeyConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Vonage API secret" value={snapshot?.vonageApiSecretConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="Vonage sender" value={snapshot?.vonageFromConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SNS region" value={snapshot?.amazonSnsRegionConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SNS access key" value={snapshot?.amazonSnsAccessKeyIdConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SNS secret key" value={snapshot?.amazonSnsSecretAccessKeyConfigured ? "Configured" : "Missing"} />
        <ValueBlock label="SNS sender ID" value={snapshot?.amazonSnsSenderIdConfigured ? "Configured" : "Missing"} />
      </div>
    </div>
  );
}

function BootstrapAdminCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          name: email.trim().split("@")[0] || "admin",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to initialize administrator.");
      }

      setStatus(data.message || "Administrator account created. You can now sign in.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to initialize administrator.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-emerald-400/30 bg-emerald-500/10 p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">First login</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Initialize the first administrator</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
        This Logicstarter runtime does not have any users yet. Create the first administrator here before continuing with provider testing and sign-in validation.
      </p>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bootstrap-admin-email">Administrator email</Label>
          <Input id="bootstrap-admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bootstrap-admin-password">Password</Label>
          <Input id="bootstrap-admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bootstrap-admin-confirm-password">Confirm password</Label>
          <Input id="bootstrap-admin-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the password" />
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || !email.trim() || !password || !confirmPassword}>
            {busy ? "Creating administrator..." : "Create administrator"}
          </Button>
          <Link to="/" className="text-sm text-emerald-100 underline-offset-4 hover:underline">Back to home</Link>
        </div>
      </form>

      {status ? <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{status}</div> : null}
      {error ? <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
    </div>
  );
}

function ProviderValidationCard({ section }: { section: SettingsSection }) {
  const fetcher = useFetcher<{
    ok: boolean;
    category?: string;
    intent?: "validate" | "apply" | "export-env";
    applied?: boolean;
    exported?: boolean;
    envPath?: string;
    values?: Record<string, string>;
    error?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[] | undefined>;
    } | string;
  }>();
  const isSubmitting = fetcher.state !== "idle";
  const isApplying = fetcher.formData?.get("intent") === "apply";
  const isExporting = fetcher.formData?.get("intent") === "export-env";
  const fieldErrors = typeof fetcher.data?.error === "object" && fetcher.data?.error?.fieldErrors
    ? fetcher.data.error.fieldErrors
    : undefined;
  const formErrors = typeof fetcher.data?.error === "object" && fetcher.data?.error?.formErrors
    ? fetcher.data.error.formErrors
    : undefined;
  const submittedFieldCount = fetcher.data?.ok && fetcher.data.values
    ? Object.keys(fetcher.data.values).length - 1
    : 0;
  const meta = categoryMeta[section.category];
  const settingsList = Object.values(section.settings);
  const envCount = settingsList.filter((setting) => setting.source === "env").length;
  const defaultCount = settingsList.filter((setting) => setting.source === "default").length;
  const { requestOrigin } = useLoaderData<typeof loader>();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => getInitialFieldValues(section));

  useEffect(() => {
    setFieldValues(getInitialFieldValues(section));
  }, [section]);

  const visibleKeys = getVisibleSettingKeys(section.category, fieldValues);
  const visibleSettings = visibleKeys
    .map((key) => section.settings[key])
    .filter(Boolean);

  function updateFieldValue(key: string, value: string) {
    setFieldValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{meta.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold capitalize tracking-[-0.04em] text-white">{meta.label}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{meta.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusPill label="env" value={envCount} tone="sky" />
          <StatusPill label="default" value={defaultCount} tone="slate" />
        </div>
      </div>

      {section.category === "authentication" ? (
        <AuthenticationPlatformGuide
          requestOrigin={requestOrigin}
          googleEnabled={fieldValues.AUTH_GOOGLE_ENABLED === "true"}
          githubEnabled={fieldValues.AUTH_GITHUB_ENABLED === "true"}
        />
      ) : null}
      {section.category === "authentication" ? <AuthenticationRuntimeStatusCard /> : null}
      {section.category === "billing" ? <BillingPlatformGuide requestOrigin={requestOrigin} /> : null}
      {section.category === "billing" ? <BillingRuntimeStatusCard /> : null}
      {section.category === "billing" ? <BillingApiReferenceCard requestOrigin={requestOrigin} /> : null}
      {section.category === "sms" ? <SmsRuntimeStatusCard /> : null}
      {section.category === "sms" ? <SmsProviderGuide provider={fieldValues.SMS_PROVIDER || "better_auth_infra"} /> : null}
      {section.category === "email" ? <EmailRuntimeStatusCard /> : null}
      {section.category === "email" ? <EmailProviderGuide provider={fieldValues.EMAIL_PROVIDER || "better_auth_infra"} /> : null}
      {section.category === "storage" ? <StorageProviderGuide provider={fieldValues.STORAGE_PROVIDER || "local"} /> : null}
      {section.category === "storage" ? <StorageRuntimeStatusCard /> : null}
      {section.category === "storage" ? <StorageApiReferenceCard requestOrigin={requestOrigin} /> : null}

      <fetcher.Form method="post" action="/api/settings/providers" className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold capitalize text-white">{section.category} controls</h3>
          <input type="hidden" name="category" value={section.category} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              name="intent"
              value="validate"
              disabled={isSubmitting}
              className="rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/20"
            >
              {isSubmitting && !isApplying && !isExporting ? "Validating..." : "Validate current values"}
            </button>
            <button
              type="submit"
              name="intent"
              value="apply"
              disabled={isSubmitting}
              className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
            >
              {isSubmitting && isApplying ? "Writing..." : "Write to runtime env"}
            </button>
            <button
              type="submit"
              name="intent"
              value="export-env"
              disabled={isSubmitting}
              className="rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
            >
              {isSubmitting && isExporting ? "Exporting..." : "Export env preview"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {visibleSettings.map((setting) => (
            <SettingField
              key={setting.key}
              setting={setting}
              value={fieldValues[setting.key] ?? ""}
              disabled={isSubmitting}
              error={fieldErrors?.[setting.key]}
              onValueChange={(nextValue) => updateFieldValue(setting.key, nextValue)}
            />
          ))}
        </div>

        {isSubmitting ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            {isApplying
              ? `Writing ${section.category} settings into the runtime env workflow is in progress.`
              : isExporting
                ? `Exporting ${section.category} settings as runtime env content is in progress.`
                : `Validation is in progress for ${section.category}.`}
          </div>
        ) : null}
      </fetcher.Form>

      {fetcher.data ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Operation status</h4>
            <span className={fetcher.data.ok
              ? "rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200"
              : "rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-rose-200"}
            >
              {fetcher.data.ok ? (fetcher.data.exported ? "Env written" : fetcher.data.applied ? "Validated" : "Schema valid") : "Schema errors"}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {fetcher.data.exported
              ? `The submitted provider settings were validated and written to ${fetcher.data.envPath ?? ".env.runtime"}.`
              : fetcher.data.applied
              ? "The submitted provider settings were validated for the env-only workflow. Export the generated config and upload it to deployment bindings or secrets manually when the runtime does not support writing .env.runtime directly."
              : "This is a validation-only response. No runtime env changes were exported."}
          </p>

          {fetcher.data.ok ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {fetcher.data.exported
                ? `Validated ${section.category} settings and wrote them to ${fetcher.data.envPath ?? ".env.runtime"}. ${submittedFieldCount} fields were submitted.`
                : fetcher.data.applied
                ? `Validated ${section.category} settings for env-only deployment. ${submittedFieldCount} fields were submitted.`
                : `Validation passed for ${section.category}. ${submittedFieldCount} fields were submitted successfully.`}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {typeof fetcher.data.error === "string"
                ? fetcher.data.error
                : formErrors?.join(" ") || "Validation failed. Review the highlighted fields below."}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function AuthenticationPlatformGuide({
  requestOrigin,
  googleEnabled,
  githubEnabled,
}: {
  requestOrigin: string;
  googleEnabled: boolean;
  githubEnabled: boolean;
}) {
  const googleRedirectUri = `${requestOrigin}/api/auth/callback/google`;
  const githubCallbackUrl = `${requestOrigin}/api/auth/callback/github`;

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-[24px] border border-sky-400/20 bg-sky-500/10 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-200">Current site identity</p>
        <h3 className="mt-3 text-lg font-semibold text-white">Runtime origin</h3>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          Logicstarter should use the current reverse-proxied domain. Do not register a fixed container port or internal IP in external OAuth platform settings.
        </p>
        <div className="mt-4"><ValueBlock label="Current runtime origin" value={requestOrigin} /></div>
      </div>

      {googleEnabled ? (
        <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Google OAuth setup</p>
          <h3 className="mt-3 text-lg font-semibold text-white">Values to paste into Google Cloud</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-100">
            <ValueBlock label="Authorized JavaScript origins" value={requestOrigin} />
            <ValueBlock label="Authorized redirect URI" value={googleRedirectUri} />
          </div>
        </div>
      ) : null}

      {githubEnabled ? (
        <div className="rounded-[24px] border border-violet-400/20 bg-violet-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-violet-200">GitHub OAuth app</p>
          <h3 className="mt-3 text-lg font-semibold text-white">Values to paste into GitHub</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-100">
            <ValueBlock label="Homepage URL" value={requestOrigin} />
            <ValueBlock label="Authorization callback URL" value={githubCallbackUrl} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BillingPlatformGuide({ requestOrigin }: { requestOrigin: string }) {
  const stripeWebhookUrl = `${requestOrigin}/api/billing/webhook`;

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Stripe runtime</p>
        <h3 className="mt-3 text-lg font-semibold text-white">How these keys are used</h3>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          The Stripe secret key and webhook secret are server-only values. Save them here, then apply them through deployment bindings/secrets on Worker targets or export them into the Node runtime env before validating billing flows.
        </p>
        <div className="mt-4"><ValueBlock label="Current runtime origin" value={requestOrigin} /></div>
      </div>

      <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Stripe Dashboard setup</p>
        <h3 className="mt-3 text-lg font-semibold text-white">Values to configure in Stripe</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-100">
          <ValueBlock label="Webhook endpoint URL" value={stripeWebhookUrl} />
          <div>
            <p className="font-medium text-white">Webhook events</p>
            <div className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 leading-6">
              <div>`checkout.session.completed`</div>
              <div>`customer.subscription.created`</div>
              <div>`customer.subscription.updated`</div>
              <div>`customer.subscription.deleted`</div>
            </div>
          </div>
          <div>
            <p className="font-medium text-white">Publishable key</p>
            <p className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 leading-6 text-slate-200">
              Safe for client-side checkout/bootstrap usage.
            </p>
          </div>
          <div>
            <p className="font-medium text-white">Secret key + webhook secret</p>
            <p className="mt-2 rounded-2xl border border-white/10 bg-black/30 p-3 leading-6 text-slate-200">
              Keep server-side only. After updating them, apply them through deployment bindings/secrets or the Node runtime env before restarting the active Logicstarter runtime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmsProviderGuide({ provider }: { provider: string }) {
  const title = provider === "vonage"
    ? "Vonage configuration"
    : provider === "amazon_sns"
      ? "Amazon SNS configuration"
      : "SMS provider configuration";
  const description = provider === "vonage"
    ? "Only Vonage fields are shown below. Fill the API key, API secret, and sender name for the selected relay."
    : provider === "amazon_sns"
      ? "Only Amazon SNS fields are shown below. Fill the region, AWS credentials, and sender ID for the selected relay."
      : provider === "console"
        ? "Console mode does not require external credentials, so no relay-specific fields are shown."
        : "Better Auth Infra mode does not require extra SMS relay credentials here.";

  return (
    <div className="mb-6 rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Provider-specific settings</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-200">{description}</p>
    </div>
  );
}

function EmailProviderGuide({ provider }: { provider: string }) {
  const title = provider === "resend"
    ? "Resend configuration"
    : provider === "smtp"
      ? "SMTP configuration"
      : provider === "ses"
        ? "Amazon SES configuration"
        : "Email provider configuration";
  const description = provider === "resend"
    ? "Only Resend fields are shown below. Provide the API key and sender identity for the selected email provider."
    : provider === "smtp"
      ? "Only SMTP fields are shown below. Provide host, port, username, password, and sender identity."
      : provider === "ses"
        ? "Only Amazon SES fields are shown below. Provide the region, AWS credentials, and sender identity."
        : "Better Auth Infra mode does not require extra email relay credentials here.";

  return (
    <div className="mb-6 rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-500/10 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-fuchsia-200">Provider-specific settings</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-200">{description}</p>
    </div>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: number; tone: "sky" | "emerald" | "slate" }) {
  const className = tone === "sky"
    ? "rounded-[20px] border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-center"
    : tone === "emerald"
      ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center"
      : "rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-center";
  const labelClassName = tone === "sky"
    ? "text-[11px] uppercase tracking-[0.22em] text-sky-200"
    : tone === "emerald"
      ? "text-[11px] uppercase tracking-[0.22em] text-emerald-200"
      : "text-[11px] uppercase tracking-[0.22em] text-slate-300";

  return (
    <div className={className}>
      <div className={labelClassName}>{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{value}</div>
    </div>
  );
}
