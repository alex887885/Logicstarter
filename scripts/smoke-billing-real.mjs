const baseUrl = (process.env.LOGICSTARTER_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const email = process.env.LOGICSTARTER_TEST_EMAIL?.trim().toLowerCase();
const password = process.env.LOGICSTARTER_TEST_PASSWORD ?? "";
const stripePriceId = process.env.LOGICSTARTER_STRIPE_TEST_PRICE_ID?.trim();
const startupTimeoutMs = Number(process.env.LOGICSTARTER_SMOKE_STARTUP_TIMEOUT_MS ?? "30000");
const startupRetryDelayMs = Number(process.env.LOGICSTARTER_SMOKE_RETRY_DELAY_MS ?? "1000");

if (!email || !password) {
  throw new Error("LOGICSTARTER_TEST_EMAIL and LOGICSTARTER_TEST_PASSWORD are required for smoke-billing-real.");
}

if (!stripePriceId) {
  throw new Error("LOGICSTARTER_STRIPE_TEST_PRICE_ID is required for smoke-billing-real.");
}

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

function createCookieJar() {
  const cookies = new Map();

  return {
    apply(headers = {}) {
      const nextHeaders = new Headers(headers);
      if (cookies.size > 0) {
        nextHeaders.set("cookie", [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; "));
      }
      return nextHeaders;
    },
    capture(response) {
      const values = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : [];

      for (const value of values) {
        if (!value) continue;
        const [firstPart] = value.split(";");
        const separatorIndex = firstPart.indexOf("=");
        if (separatorIndex === -1) continue;
        const key = firstPart.slice(0, separatorIndex).trim();
        const cookieValue = firstPart.slice(separatorIndex + 1).trim();
        if (!key) continue;
        if (!cookieValue) {
          cookies.delete(key);
          continue;
        }
        cookies.set(key, cookieValue);
      }
    },
  };
}

async function assertBootstrapState() {
  const response = await fetch(`${baseUrl}/api/check-email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/check-email, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/check-email");
  if (data.bootstrapAdminSetup) {
    throw new Error("Logicstarter is still in bootstrap-admin mode. Create and verify the first administrator account before running smoke-billing-real.");
  }
  if (!data.exists || !data.hasPassword || !data.emailVerified) {
    throw new Error(`The account ${email} is not ready for authenticated billing smoke.`);
  }

  console.log(`PASS ${email} is ready for authenticated billing validation`);
}

async function signInWithPassword(cookieJar) {
  const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
      origin: baseUrl,
    }),
    body: JSON.stringify({
      email,
      password,
      rememberMe: true,
    }),
    redirect: "manual",
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (![200, 302].includes(response.status)) {
    throw new Error(`Expected 200 or 302 for /api/auth/sign-in/email, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = text ? parseJson(text, "/api/auth/sign-in/email") : null;
  if (data && typeof data === "object" && data.error?.message) {
    throw new Error(`Better Auth sign-in returned an error: ${data.error.message}`);
  }

  console.log("PASS /api/auth/sign-in/email issued an authenticated session for billing validation");
}

async function createCheckout(cookieJar) {
  const response = await fetch(`${baseUrl}/api/billing/checkout`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({
      priceId: stripePriceId,
      successUrl: `${baseUrl}/settings/providers?category=billing&checkout=success`,
      cancelUrl: `${baseUrl}/settings/providers?category=billing&checkout=cancelled`,
    }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/billing/checkout, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/billing/checkout");
  if (!data?.ok || typeof data.checkout?.id !== "string" || typeof data.checkout?.url !== "string") {
    throw new Error(`Expected checkout payload from /api/billing/checkout, received ${text.slice(0, 300)}`);
  }

  if (!data.checkout.url.includes("checkout.stripe.com") && !data.checkout.url.includes("billing.stripe.com")) {
    throw new Error(`Expected Stripe-hosted checkout URL, received ${data.checkout.url}`);
  }

  console.log("PASS /api/billing/checkout returns a Stripe-hosted checkout session");
}

async function assertBillingState(cookieJar) {
  const response = await fetch(`${baseUrl}/api/billing/state`, {
    headers: cookieJar.apply({
      accept: "application/json",
    }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/billing/state, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/billing/state");
  if (!data?.ok || !data.billing || typeof data.billing.linkedCustomer !== "boolean" || typeof data.billing.activeSubscription !== "boolean") {
    throw new Error(`Expected normalized billing state payload, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/billing/state returns the current billing linkage snapshot");
  return data.billing;
}

async function assertPortalContract(cookieJar, billingState) {
  const response = await fetch(`${baseUrl}/api/billing/portal`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({
      returnUrl: `${baseUrl}/settings/providers?category=billing`,
    }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (!billingState.linkedCustomer) {
    if (response.status !== 400) {
      throw new Error(`Expected 400 for portal without a linked customer, received ${response.status}. Body: ${text.slice(0, 300)}`);
    }

    const data = parseJson(text, "/api/billing/portal");
    if (data?.ok !== false) {
      throw new Error(`Expected a normalized error response for /api/billing/portal, received ${text.slice(0, 300)}`);
    }

    console.log("PASS /api/billing/portal returns a controlled error before a customer is linked");
    return;
  }

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/billing/portal with a linked customer, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/billing/portal");
  if (!data?.ok || typeof data.portal?.url !== "string") {
    throw new Error(`Expected a portal payload from /api/billing/portal, received ${text.slice(0, 300)}`);
  }

  if (!data.portal.url.includes("billing.stripe.com")) {
    throw new Error(`Expected Stripe billing portal URL, received ${data.portal.url}`);
  }

  console.log("PASS /api/billing/portal returns a Stripe-hosted billing portal session when a customer is linked");
}

async function main() {
  console.log(`Running Logicstarter real billing smoke against ${baseUrl}`);
  const cookieJar = createCookieJar();
  await waitForRuntimeReady();
  await assertBootstrapState();
  await signInWithPassword(cookieJar);
  await createCheckout(cookieJar);
  const billingState = await assertBillingState(cookieJar);
  await assertPortalContract(cookieJar, billingState);
  console.log("Logicstarter real billing smoke completed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
