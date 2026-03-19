import { execFile } from "node:child_process";
import { promisify } from "node:util";

const baseUrl = (process.env.LOGICSTARTER_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const startupTimeoutMs = Number(process.env.LOGICSTARTER_SMOKE_STARTUP_TIMEOUT_MS ?? "30000");
const startupRetryDelayMs = Number(process.env.LOGICSTARTER_SMOKE_RETRY_DELAY_MS ?? "1000");
const execFileAsync = promisify(execFile);

function parseJson(text, path) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Expected JSON response for ${path}, but parsing failed: ${error instanceof Error ? error.message : String(error)}. Body: ${text.slice(0, 300)}`);
  }
}

async function waitForRuntimeReady() {
  const deadline = Date.now() + startupTimeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`, {
        headers: {
          Accept: "text/html",
        },
      });

      if (response.ok) {
        console.log(`PASS runtime ready at ${baseUrl}`);
        return;
      }

      lastError = new Error(`Runtime readiness probe returned status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, startupRetryDelayMs));
  }

  throw new Error(`Logicstarter runtime did not become ready within ${startupTimeoutMs}ms: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function request(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();

  if (response.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus} for ${path}, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  return text;
}

async function assertIncludes(path, expectedText, expectedStatus = 200) {
  const text = await request(path, expectedStatus);

  if (!text.includes(expectedText)) {
    throw new Error(`Expected response for ${path} to include ${JSON.stringify(expectedText)}.`);
  }

  console.log(`PASS ${path} includes ${JSON.stringify(expectedText)}`);
}

async function assertScriptContract(scriptPath, successText) {
  const { stdout, stderr } = await execFileAsync("node", [scriptPath], {
    cwd: process.cwd(),
    env: process.env,
  });
  const output = `${stdout}${stderr}`;

  if (!output.includes(successText)) {
    throw new Error(`Expected script contract ${scriptPath} to pass. Output: ${output.slice(0, 300)}`);
  }

  console.log(successText);
}

async function assertRuntimeEnvInjectionContract() {
  await assertScriptContract(
    "./scripts/runtime-env-contract.mjs",
    "PASS runtime env injection contract resolves Worker-safe config snapshots",
  );
}

async function assertCloudflareAuthContract() {
  await assertScriptContract(
    "./scripts/cloudflare-auth-contract.mjs",
    "PASS cloudflare auth contract keeps Stripe server dependencies out of auth top-level initialization",
  );
}

async function postForm(path, values, expectedStatus) {
  const body = new URLSearchParams(values);
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const text = await response.text();

  if (response.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus} for POST ${path}, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  return text;
}

async function assertPostIncludes(path, values, expectedStatus, expectedText) {
  const text = await postForm(path, values, expectedStatus);

  if (!text.includes(expectedText)) {
    throw new Error(`Expected POST response for ${path} to include ${JSON.stringify(expectedText)}.`);
  }

  console.log(`PASS POST ${path} includes ${JSON.stringify(expectedText)}`);
}

async function assertGetSessionContract() {
  const response = await fetch(`${baseUrl}/api/auth/get-session`, {
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/auth/get-session, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/auth/get-session");
  if (data === null) {
    console.log("PASS /api/auth/get-session returns null when no active Better Auth session exists");
    return;
  }

  if (typeof data !== "object" || !Object.prototype.hasOwnProperty.call(data, "session") || !Object.prototype.hasOwnProperty.call(data, "user")) {
    throw new Error(`Expected /api/auth/get-session to return null or a session/user envelope, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/auth/get-session returns the Better Auth session envelope");
}

async function assertAuthRuntimeApi() {
  const response = await fetch(`${baseUrl}/api/auth/runtime`, {
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/auth/runtime, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/auth/runtime");
  if (!data || data.ok !== true || data.provider !== "better_auth" || typeof data.snapshot !== "object") {
    throw new Error(`Expected /api/auth/runtime to return an authentication runtime snapshot, received ${text.slice(0, 300)}`);
  }

  if (typeof data.snapshot?.trustedOriginReady !== "boolean" || typeof data.snapshot?.socialProvidersConfigured !== "number") {
    throw new Error(`Expected /api/auth/runtime to include authentication readiness metadata, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/auth/runtime returns a valid authentication runtime snapshot");
}

async function assertProvidersRuntimeOverviewApi() {
  const response = await fetch(`${baseUrl}/api/providers/runtime`, {
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/providers/runtime, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/providers/runtime");
  if (!data || data.ok !== true || typeof data.runtime !== "object" || typeof data.modules !== "object" || typeof data.summary !== "object") {
    throw new Error(`Expected /api/providers/runtime to return a provider runtime overview, received ${text.slice(0, 300)}`);
  }

  if (typeof data.runtime?.target !== "string" || typeof data.runtime?.cloudflareCompatible !== "boolean" || !Array.isArray(data.runtime?.cloudflareBlockers)) {
    throw new Error(`Expected /api/providers/runtime to include runtime target and Cloudflare compatibility metadata, received ${text.slice(0, 300)}`);
  }

  if (typeof data.summary?.readyCount !== "number" || typeof data.summary?.incompleteCount !== "number" || typeof data.summary?.totalCount !== "number") {
    throw new Error(`Expected /api/providers/runtime to include runtime overview summary counts, received ${text.slice(0, 300)}`);
  }

  if (!Array.isArray(data.summary?.attentionModules)) {
    throw new Error(`Expected /api/providers/runtime to include attention module metadata, received ${text.slice(0, 300)}`);
  }

  for (const item of data.summary.attentionModules) {
    if (typeof item?.name !== "string" || typeof item?.remediation !== "string") {
      throw new Error(`Expected /api/providers/runtime attention modules to include name and remediation strings, received ${text.slice(0, 300)}`);
    }
  }

  console.log("PASS /api/providers/runtime returns a valid provider runtime overview");
}

async function assertSocialSignInContract() {
  const callbackURL = `${baseUrl}/?authReturn=social-smoke`;
  const response = await fetch(`${baseUrl}/api/auth/sign-in/social`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      origin: baseUrl,
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL,
      errorCallbackURL: callbackURL,
    }),
    redirect: "manual",
  });
  const text = await response.text();

  if (![200, 302].includes(response.status)) {
    throw new Error(`Expected social sign-in initiation to return 200 or 302, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  if (response.status === 302) {
    const location = response.headers.get("location") ?? "";
    if (!location) {
      throw new Error("Expected social sign-in redirect response to include a location header.");
    }
    console.log("PASS /api/auth/sign-in/social returns a redirect response");
    return;
  }

  const data = parseJson(text, "/api/auth/sign-in/social");
  if (typeof data !== "object" || data === null) {
    throw new Error(`Expected social sign-in initiation JSON response, received ${text.slice(0, 300)}`);
  }

  const redirectUrl = typeof data.url === "string"
    ? data.url
    : typeof data.redirect === "boolean" && typeof data.data?.url === "string"
      ? data.data.url
      : typeof data.data?.redirectTo === "string"
        ? data.data.redirectTo
        : null;

  const errorMessage = typeof data.error?.message === "string"
    ? data.error.message
    : typeof data.message === "string"
      ? data.message
      : null;

  if (!redirectUrl && !errorMessage) {
    throw new Error(`Expected social sign-in initiation to return either a redirect URL or a structured error message. Body: ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/auth/sign-in/social returns a Better Auth compatible initiation payload");
}

async function assertSmsSettingPersistsFromDb() {
  await postForm(
    "/api/settings/providers",
    {
      category: "sms",
      intent: "save",
      SMS_PROVIDER: "console",
      VONAGE_API_KEY: "",
      VONAGE_API_SECRET: "",
      VONAGE_FROM: "LogicstarterSmoke",
      AMAZON_SNS_REGION: "",
      AMAZON_SNS_ACCESS_KEY_ID: "",
      AMAZON_SNS_SECRET_ACCESS_KEY: "",
      AMAZON_SNS_SENDER_ID: "",
    },
    200,
  );

  const text = await request("/api/settings/providers?category=sms", 200);
  const data = JSON.parse(text);

  if (data.settings?.VONAGE_FROM?.value !== "LogicstarterSmoke") {
    throw new Error(`Expected VONAGE_FROM to be saved as "LogicstarterSmoke", received ${JSON.stringify(data.settings?.VONAGE_FROM?.value)}.`);
  }

  if (data.settings?.VONAGE_FROM?.source !== "db") {
    throw new Error(`Expected VONAGE_FROM source to be "db", received ${JSON.stringify(data.settings?.VONAGE_FROM?.source)}.`);
  }

  console.log("PASS /api/settings/providers?category=sms returns DB-backed SMS setting values");
}

async function assertSmsSettingExportsToEnv() {
  const text = await postForm(
    "/api/settings/providers",
    {
      category: "sms",
      intent: "export-env",
      SMS_PROVIDER: "console",
      VONAGE_API_KEY: "",
      VONAGE_API_SECRET: "",
      VONAGE_FROM: "",
      AMAZON_SNS_REGION: "",
      AMAZON_SNS_ACCESS_KEY_ID: "",
      AMAZON_SNS_SECRET_ACCESS_KEY: "",
      AMAZON_SNS_SENDER_ID: "",
    },
    200,
  );
  const data = JSON.parse(text);

  if (!data.exported) {
    throw new Error(`Expected export-env response to include exported=true, received ${JSON.stringify(data)}.`);
  }

  if (typeof data.envPath !== "string" || !data.envPath.endsWith(".env.runtime")) {
    throw new Error(`Expected export-env to target .env.runtime, received ${JSON.stringify(data.envPath)}.`);
  }

  console.log("PASS POST /api/settings/providers exports merged settings to .env.runtime");
}

async function assertUploadsMissingFileReturns404() {
  const response = await fetch(`${baseUrl}/uploads/logicstarter-smoke-missing-file.txt`, {
    headers: {
      Accept: "text/plain",
    },
  });
  const text = await response.text();

  if (response.status !== 404) {
    throw new Error(`Expected 404 for /uploads/logicstarter-smoke-missing-file.txt, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  console.log("PASS /uploads/... returns 404 for a missing local storage file");
}

async function assertStorageRuntimeApi() {
  const response = await fetch(`${baseUrl}/api/storage/runtime`, {
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/storage/runtime, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/runtime");
  if (!data || data.ok !== true || typeof data.provider !== "string" || typeof data.snapshot !== "object") {
    throw new Error(`Expected /api/storage/runtime to return an ok runtime snapshot, received ${text.slice(0, 300)}`);
  }

  if (typeof data.uploadPolicy?.label !== "string" || typeof data.uploadPolicy?.maxUploadBytes !== "number") {
    throw new Error(`Expected /api/storage/runtime to include uploadPolicy metadata, received ${text.slice(0, 300)}`);
  }

   if (typeof data.capabilities !== "object" || typeof data.capabilities?.putObject !== "boolean" || typeof data.capabilities?.deleteObject !== "boolean" || typeof data.capabilities?.signedGetUrl !== "boolean" || typeof data.capabilities?.signedPutUrl !== "boolean") {
     throw new Error(`Expected /api/storage/runtime to include storage capability metadata, received ${text.slice(0, 300)}`);
   }

   if (!(data.snapshot?.resolvedEndpoint == null || typeof data.snapshot?.resolvedEndpoint === "string")) {
     throw new Error(`Expected /api/storage/runtime to include a nullable resolvedEndpoint, received ${text.slice(0, 300)}`);
   }

  console.log("PASS /api/storage/runtime returns a valid storage runtime snapshot");
}

async function assertStorageUploadRequiresAuth() {
  const formData = new FormData();
  formData.set("prefix", "smoke");
  formData.set("file", new File(["logicstarter smoke upload"], "smoke.txt", { type: "text/plain" }));

  const response = await fetch(`${baseUrl}/api/storage/upload`, {
    method: "POST",
    body: formData,
  });
  const text = await response.text();

  if (response.status !== 401) {
    throw new Error(`Expected 401 for POST /api/storage/upload without a session, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/upload");
  if (!data || data.ok !== false) {
    throw new Error(`Expected /api/storage/upload to return an auth error payload, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/storage/upload rejects anonymous uploads with 401");
}

async function assertStorageUploadMethodNotAllowed() {
  const response = await fetch(`${baseUrl}/api/storage/upload`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 405) {
    throw new Error(`Expected 405 for GET /api/storage/upload, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  if (response.headers.get("allow") !== "POST") {
    throw new Error(`Expected GET /api/storage/upload to return Allow: POST, received ${JSON.stringify(response.headers.get("allow"))}`);
  }

  console.log("PASS GET /api/storage/upload returns 405");
}

async function assertStorageSignedUrlMethodNotAllowed() {
  const response = await fetch(`${baseUrl}/api/storage/signed-url`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 405) {
    throw new Error(`Expected 405 for GET /api/storage/signed-url, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  if (response.headers.get("allow") !== "POST") {
    throw new Error(`Expected GET /api/storage/signed-url to return Allow: POST, received ${JSON.stringify(response.headers.get("allow"))}`);
  }

  console.log("PASS GET /api/storage/signed-url returns 405");
}

async function assertStorageSignedUrlRequiresAuth() {
  const response = await fetch(`${baseUrl}/api/storage/signed-url`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ key: "smoke/example.txt", method: "GET" }),
  });
  const text = await response.text();

  if (response.status !== 401) {
    throw new Error(`Expected 401 for POST /api/storage/signed-url without a session, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/signed-url");
  if (!data || data.ok !== false) {
    throw new Error(`Expected /api/storage/signed-url to return an auth error payload, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/storage/signed-url rejects anonymous requests with 401");
}

async function assertStorageDeleteRequiresAuth() {
  const response = await fetch(`${baseUrl}/api/storage/delete`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ key: "smoke/missing.txt" }),
  });
  const text = await response.text();

  if (response.status !== 401) {
    throw new Error(`Expected 401 for POST /api/storage/delete without a session, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/delete");
  if (!data || data.ok !== false) {
    throw new Error(`Expected /api/storage/delete to return an auth error payload, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/storage/delete rejects anonymous deletes with 401");
}

async function assertStorageDeleteMethodNotAllowed() {
  const response = await fetch(`${baseUrl}/api/storage/delete`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 405) {
    throw new Error(`Expected 405 for GET /api/storage/delete, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  if (response.headers.get("allow") !== "POST") {
    throw new Error(`Expected GET /api/storage/delete to return Allow: POST, received ${JSON.stringify(response.headers.get("allow"))}`);
  }

  console.log("PASS GET /api/storage/delete returns 405");
}

async function assertBillingRuntimeApi() {
  const response = await fetch(`${baseUrl}/api/billing/runtime`, {
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/billing/runtime, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/billing/runtime");
  if (!data || data.ok !== true || data.provider !== "stripe" || typeof data.snapshot !== "object") {
    throw new Error(`Expected /api/billing/runtime to return a Stripe runtime snapshot, received ${text.slice(0, 300)}`);
  }

  if (typeof data.attention !== "string" || typeof data.remediation !== "string" || typeof data.runtimeHealth !== "string") {
    throw new Error(`Expected /api/billing/runtime to include shared Stripe runtime status metadata, received ${text.slice(0, 300)}`);
  }

  if (typeof data.snapshot?.pluginActive !== "boolean" || typeof data.snapshot?.checkoutReady !== "boolean" || typeof data.snapshot?.webhookReady !== "boolean") {
    throw new Error(`Expected /api/billing/runtime to include billing readiness flags, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/billing/runtime returns a valid billing runtime snapshot");
}

async function assertBillingCheckoutRoute() {
  const methodResponse = await fetch(`${baseUrl}/api/billing/checkout`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (methodResponse.status !== 405) {
    throw new Error(`Expected 405 for GET /api/billing/checkout, received ${methodResponse.status}.`);
  }

  console.log("PASS GET /api/billing/checkout returns 405");

  const authResponse = await fetch(`${baseUrl}/api/billing/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      priceId: "price_test",
      successUrl: `${baseUrl}/billing/success`,
      cancelUrl: `${baseUrl}/billing/cancel`,
    }),
  });

  if (authResponse.status !== 401) {
    throw new Error(`Expected 401 for anonymous POST /api/billing/checkout, received ${authResponse.status}.`);
  }

  console.log("PASS /api/billing/checkout rejects anonymous requests with 401");
}

async function assertBillingWebhookRoute() {
  const response = await fetch(`${baseUrl}/api/billing/webhook`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status !== 405) {
    throw new Error(`Expected 405 for GET /api/billing/webhook, received ${response.status}.`);
  }

  console.log("PASS GET /api/billing/webhook returns 405");
}

async function assertBillingPortalRoute() {
  const methodResponse = await fetch(`${baseUrl}/api/billing/portal`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (methodResponse.status !== 405) {
    throw new Error(`Expected 405 for GET /api/billing/portal, received ${methodResponse.status}.`);
  }

  console.log("PASS GET /api/billing/portal returns 405");

  const authResponse = await fetch(`${baseUrl}/api/billing/portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      returnUrl: `${baseUrl}/settings/providers?category=billing`,
    }),
  });

  if (authResponse.status !== 401) {
    throw new Error(`Expected 401 for anonymous POST /api/billing/portal, received ${authResponse.status}.`);
  }

  console.log("PASS /api/billing/portal rejects anonymous requests with 401");
}

async function assertBillingStateRoute() {
  const response = await fetch(`${baseUrl}/api/billing/state`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status !== 401) {
    throw new Error(`Expected 401 for anonymous GET /api/billing/state, received ${response.status}.`);
  }

  console.log("PASS /api/billing/state rejects anonymous requests with 401");
}

async function assertBillingSyncRoute() {
  const methodResponse = await fetch(`${baseUrl}/api/billing/sync`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (methodResponse.status !== 405) {
    throw new Error(`Expected 405 for GET /api/billing/sync, received ${methodResponse.status}.`);
  }

  console.log("PASS GET /api/billing/sync returns 405");

  const authResponse = await fetch(`${baseUrl}/api/billing/sync`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (authResponse.status !== 401) {
    throw new Error(`Expected 401 for anonymous POST /api/billing/sync, received ${authResponse.status}.`);
  }

  console.log("PASS /api/billing/sync rejects anonymous requests with 401");
}

async function assertEmailRuntimeApi() {
  const response = await fetch(`${baseUrl}/api/email/runtime`, {
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/email/runtime, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/email/runtime");
  if (!data || data.ok !== true || typeof data.provider !== "string" || typeof data.snapshot !== "object") {
    throw new Error(`Expected /api/email/runtime to return an email runtime snapshot, received ${text.slice(0, 300)}`);
  }

  if (typeof data.snapshot?.providerReady !== "boolean") {
    throw new Error(`Expected /api/email/runtime to include provider readiness metadata, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/email/runtime returns a valid email runtime snapshot");
}

async function assertSmsRuntimeApi() {
  const response = await fetch(`${baseUrl}/api/sms/runtime`, {
    headers: {
      Accept: "application/json",
    },
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/sms/runtime, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/sms/runtime");
  if (!data || data.ok !== true || typeof data.provider !== "string" || typeof data.snapshot !== "object") {
    throw new Error(`Expected /api/sms/runtime to return an SMS runtime snapshot, received ${text.slice(0, 300)}`);
  }

  if (typeof data.snapshot?.providerReady !== "boolean") {
    throw new Error(`Expected /api/sms/runtime to include provider readiness metadata, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/sms/runtime returns a valid SMS runtime snapshot");
}

async function main() {
  console.log(`Running Logicstarter baseline smoke against ${baseUrl}`);

  await assertRuntimeEnvInjectionContract();
  await assertCloudflareAuthContract();
  await waitForRuntimeReady();

  await assertIncludes("/", "Enabled auth methods");
  await assertIncludes("/settings/providers", "Provider settings");
  await assertIncludes("/settings/providers", "Cloudflare deployment guide");
  await assertIncludes("/settings/providers?category=authentication", "Category export preview");
  await assertIncludes("/settings/providers?category=billing", "Stripe API quick reference");
  await assertIncludes("/settings/providers?category=storage", "Storage runtime status");
  await assertIncludes("/settings/providers?category=storage", "Storage API quick reference");
  await assertIncludes("/api/settings/providers?category=email", '"category":"email"');
  await assertIncludes("/api/auth/methods", '"methods"');
  await assertGetSessionContract();
  await assertAuthRuntimeApi();
  await assertProvidersRuntimeOverviewApi();
  await assertSocialSignInContract();
  await assertPostIncludes(
    "/api/settings/providers",
    {
      category: "authentication",
      AUTH_GOOGLE_ENABLED: "false",
      AUTH_GOOGLE_CLIENT_ID: "",
      AUTH_GOOGLE_CLIENT_SECRET: "",
      AUTH_GITHUB_ENABLED: "false",
      AUTH_GITHUB_CLIENT_ID: "",
      AUTH_GITHUB_CLIENT_SECRET: "",
    },
    200,
    '"ok":true',
  );
  await assertPostIncludes(
    "/api/settings/providers",
    {
      category: "authentication",
      AUTH_GOOGLE_ENABLED: "true",
      AUTH_GOOGLE_CLIENT_ID: "",
      AUTH_GOOGLE_CLIENT_SECRET: "",
    },
    400,
    '"ok":false',
  );
  await assertBillingRuntimeApi();
  await assertBillingCheckoutRoute();
  await assertBillingPortalRoute();
  await assertBillingStateRoute();
  await assertBillingSyncRoute();
  await assertBillingWebhookRoute();
  await assertEmailRuntimeApi();
  await assertSmsRuntimeApi();
  await assertSmsSettingPersistsFromDb();
  await assertSmsSettingExportsToEnv();
  await assertStorageRuntimeApi();
  await assertStorageSignedUrlMethodNotAllowed();
  await assertStorageSignedUrlRequiresAuth();
  await assertStorageUploadMethodNotAllowed();
  await assertStorageUploadRequiresAuth();
  await assertStorageDeleteMethodNotAllowed();
  await assertStorageDeleteRequiresAuth();
  await assertUploadsMissingFileReturns404();

  console.log("Logicstarter baseline smoke passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
