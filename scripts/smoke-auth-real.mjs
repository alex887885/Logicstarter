import postgres from "postgres";

const baseUrl = (process.env.LOGICSTARTER_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const databaseUrl = process.env.DATABASE_URL;
const email = process.env.LOGICSTARTER_TEST_EMAIL?.trim().toLowerCase();
const password = process.env.LOGICSTARTER_TEST_PASSWORD ?? "";
const startupTimeoutMs = Number(process.env.LOGICSTARTER_SMOKE_STARTUP_TIMEOUT_MS ?? "30000");
const startupRetryDelayMs = Number(process.env.LOGICSTARTER_SMOKE_RETRY_DELAY_MS ?? "1000");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for smoke-auth-real.");
}

if (!email || !password) {
  throw new Error("LOGICSTARTER_TEST_EMAIL and LOGICSTARTER_TEST_PASSWORD are required for smoke-auth-real.");
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
        nextHeaders.set(
          "cookie",
          [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; "),
        );
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
        if (!value) {
          continue;
        }
        const [firstPart] = value.split(";");
        const separatorIndex = firstPart.indexOf("=");
        if (separatorIndex === -1) {
          continue;
        }
        const key = firstPart.slice(0, separatorIndex).trim();
        const cookieValue = firstPart.slice(separatorIndex + 1).trim();
        if (!key) {
          continue;
        }
        if (!cookieValue) {
          cookies.delete(key);
          continue;
        }
        cookies.set(key, cookieValue);
      }
    },
    has(namePart) {
      return [...cookies.keys()].some((key) => key.includes(namePart));
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
    throw new Error("Logicstarter is still in bootstrap-admin mode. Create and verify the first administrator account before running smoke-auth-real.");
  }

  if (!data.exists) {
    throw new Error(`No Logicstarter account exists for ${email}. Create and verify this user before running smoke-auth-real.`);
  }

  if (!data.hasPassword) {
    throw new Error(`The account ${email} does not have a password credential yet. Complete password setup before running smoke-auth-real.`);
  }

  if (!data.emailVerified) {
    throw new Error(`The account ${email} is not email-verified yet. Verify the email before running smoke-auth-real.`);
  }

  console.log(`PASS ${email} is ready for real Better Auth sign-in validation`);
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

  if (!cookieJar.has("better-auth")) {
    throw new Error("Expected Better Auth sign-in to issue a session-related cookie.");
  }

  console.log("PASS /api/auth/sign-in/email issued a Better Auth session cookie");
}

async function fetchSession(cookieJar, expectedAuthenticated) {
  const response = await fetch(`${baseUrl}/api/auth/get-session`, {
    method: "GET",
    headers: cookieJar.apply({
      accept: "application/json",
    }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/auth/get-session, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/auth/get-session");

  if (!expectedAuthenticated) {
    if (data !== null) {
      throw new Error(`Expected unauthenticated get-session to return null, received ${text.slice(0, 300)}`);
    }
    console.log("PASS /api/auth/get-session returns null after sign-out");
    return null;
  }

  if (!data || typeof data !== "object" || !data.user || !data.session) {
    throw new Error(`Expected authenticated get-session envelope, received ${text.slice(0, 300)}`);
  }

  if (String(data.user.email || "").trim().toLowerCase() !== email) {
    throw new Error(`Expected authenticated session email to be ${email}, received ${JSON.stringify(data.user.email)}`);
  }

  console.log("PASS /api/auth/get-session returns the authenticated Better Auth session envelope");
  return data;
}

async function assertDatabaseRecords() {
  const sql = postgres(databaseUrl, { prepare: false });
  try {
    const users = await sql`select id, email, email_verified from "user" where lower(email) = lower(${email}) limit 1`;
    if (users.length !== 1) {
      throw new Error(`Expected one user row for ${email}, found ${users.length}.`);
    }

    const userId = users[0].id;
    const accounts = await sql`select provider_id from account where user_id = ${userId}`;
    const sessions = await sql`select id from session where user_id = ${userId}`;

    if (accounts.length === 0) {
      throw new Error(`Expected at least one account row for ${email}, found none.`);
    }

    if (!accounts.some((account) => account.provider_id === "credential")) {
      throw new Error(`Expected a credential account row for ${email}, received ${JSON.stringify(accounts)}.`);
    }

    if (sessions.length === 0) {
      throw new Error(`Expected at least one active session row for ${email}, found none.`);
    }

    console.log("PASS database contains Better Auth user/account/session rows for the authenticated user");
  } finally {
    await sql.end({ timeout: 1 });
  }
}

async function signOut(cookieJar) {
  const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
    method: "POST",
    headers: cookieJar.apply({
      accept: "application/json",
      "content-type": "application/json",
      origin: baseUrl,
    }),
    body: JSON.stringify({}),
    redirect: "manual",
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (![200, 302].includes(response.status)) {
    throw new Error(`Expected 200 or 302 for /api/auth/sign-out, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/auth/sign-out completed without transport errors");
}

async function main() {
  console.log(`Running Logicstarter real auth smoke against ${baseUrl}`);
  await waitForRuntimeReady();
  await assertBootstrapState();

  const cookieJar = createCookieJar();
  await signInWithPassword(cookieJar);
  await fetchSession(cookieJar, true);
  await assertDatabaseRecords();
  await signOut(cookieJar);
  await fetchSession(cookieJar, false);

  console.log("Logicstarter real auth smoke passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
