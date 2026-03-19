const baseUrl = (process.env.LOGICSTARTER_BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const email = process.env.LOGICSTARTER_TEST_EMAIL?.trim().toLowerCase();
const password = process.env.LOGICSTARTER_TEST_PASSWORD ?? "";
const startupTimeoutMs = Number(process.env.LOGICSTARTER_SMOKE_STARTUP_TIMEOUT_MS ?? "30000");
const startupRetryDelayMs = Number(process.env.LOGICSTARTER_SMOKE_RETRY_DELAY_MS ?? "1000");
const requireRemoteStorage = process.env.LOGICSTARTER_REQUIRE_REMOTE_STORAGE === "true";

if (!email || !password) {
  throw new Error("LOGICSTARTER_TEST_EMAIL and LOGICSTARTER_TEST_PASSWORD are required for smoke-storage-real.");
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
    throw new Error("Logicstarter is still in bootstrap-admin mode. Create and verify the first administrator account before running smoke-storage-real.");
  }
  if (!data.exists || !data.hasPassword || !data.emailVerified) {
    throw new Error(`The account ${email} is not ready for authenticated storage smoke.`);
  }

  console.log(`PASS ${email} is ready for authenticated storage validation`);
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

async function uploadFile(cookieJar) {
  const formData = new FormData();
  formData.set("prefix", "smoke-storage-real");
  formData.set("file", new File(["logicstarter authenticated storage smoke"], "storage-smoke.txt", { type: "text/plain" }));

  const response = await fetch(`${baseUrl}/api/storage/upload`, {
    method: "POST",
    headers: cookieJar.apply(),
    body: formData,
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/storage/upload, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/upload");
  if (!data || data.ok !== true || typeof data.key !== "string" || typeof data.url !== "string") {
    throw new Error(`Expected upload API to return a key and URL, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/storage/upload accepts authenticated uploads");
  return data;
}

async function getStorageRuntime() {
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
  if (!data || data.ok !== true || typeof data.provider !== "string") {
    throw new Error(`Expected /api/storage/runtime to return an ok runtime payload, received ${text.slice(0, 300)}`);
  }

  return data;
}

async function assertUploadedFileAccessible(url) {
  const response = await fetch(url.startsWith("http") ? url : `${baseUrl}${url}`);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected uploaded file to be readable at ${url}, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  if (!text.includes("logicstarter authenticated storage smoke")) {
    throw new Error(`Expected uploaded file body to match the smoke payload, received ${text.slice(0, 300)}`);
  }

  console.log("PASS uploaded file is readable from the returned public URL");
}

async function assertSignedUrlAccessible(cookieJar, key) {
  const response = await fetch(`${baseUrl}/api/storage/signed-url`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({
      key,
      method: "GET",
    }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/storage/signed-url, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/signed-url");
  if (!data || data.ok !== true || typeof data.url !== "string") {
    throw new Error(`Expected signed-url API to return ok=true and a URL, received ${text.slice(0, 300)}`);
  }

  const fileResponse = await fetch(data.url.startsWith("http") ? data.url : `${baseUrl}${data.url}`);
  const fileText = await fileResponse.text();

  if (fileResponse.status !== 200) {
    throw new Error(`Expected signed URL to be readable for ${key}, received ${fileResponse.status}. Body: ${fileText.slice(0, 300)}`);
  }

  if (!fileText.includes("logicstarter authenticated storage smoke")) {
    throw new Error(`Expected signed URL response body to match the smoke payload, received ${fileText.slice(0, 300)}`);
  }

  console.log("PASS /api/storage/signed-url returns a readable GET URL for the uploaded object");
}

async function assertSignedPutRejected(cookieJar, key) {
  const response = await fetch(`${baseUrl}/api/storage/signed-url`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({
      key,
      method: "PUT",
      contentType: "text/plain",
    }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 400) {
    throw new Error(`Expected 400 for local PUT /api/storage/signed-url, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/signed-url");
  if (!data || data.ok !== false || typeof data.error !== "string" || !data.error.includes("signed PUT URLs")) {
    throw new Error(`Expected signed-url PUT to be rejected for local storage, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/storage/signed-url rejects PUT requests for the local storage runtime");
}

async function assertSignedPutSucceeds(cookieJar) {
  const key = `smoke-storage-real/signed-put-${Date.now()}.txt`;
  const payload = "logicstarter signed put smoke";
  const response = await fetch(`${baseUrl}/api/storage/signed-url`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({
      key,
      method: "PUT",
      contentType: "text/plain",
    }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for remote PUT /api/storage/signed-url, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/signed-url");
  if (!data || data.ok !== true || typeof data.url !== "string") {
    throw new Error(`Expected signed-url PUT to return ok=true and a URL, received ${text.slice(0, 300)}`);
  }

  const putResponse = await fetch(data.url, {
    method: "PUT",
    headers: {
      "content-type": "text/plain",
    },
    body: payload,
  });
  const putText = await putResponse.text();

  if (!putResponse.ok) {
    throw new Error(`Expected signed PUT upload to succeed for ${key}, received ${putResponse.status}. Body: ${putText.slice(0, 300)}`);
  }

  const getResponse = await fetch(`${baseUrl}/api/storage/signed-url`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({
      key,
      method: "GET",
    }),
  });
  cookieJar.capture(getResponse);
  const getText = await getResponse.text();

  if (getResponse.status !== 200) {
    throw new Error(`Expected 200 for signed GET retrieval after signed PUT, received ${getResponse.status}. Body: ${getText.slice(0, 300)}`);
  }

  const getData = parseJson(getText, "/api/storage/signed-url");
  if (!getData || getData.ok !== true || typeof getData.url !== "string") {
    throw new Error(`Expected signed-url GET to return ok=true and a URL after signed PUT, received ${getText.slice(0, 300)}`);
  }

  const fileResponse = await fetch(getData.url.startsWith("http") ? getData.url : `${baseUrl}${getData.url}`);
  const fileText = await fileResponse.text();

  if (fileResponse.status !== 200) {
    throw new Error(`Expected signed PUT object to be readable for ${key}, received ${fileResponse.status}. Body: ${fileText.slice(0, 300)}`);
  }

  if (!fileText.includes(payload)) {
    throw new Error(`Expected signed PUT object body to match the smoke payload, received ${fileText.slice(0, 300)}`);
  }

  await deleteFile(cookieJar, key);
  console.log("PASS /api/storage/signed-url supports remote signed PUT uploads");
}

async function deleteFile(cookieJar, key) {
  const response = await fetch(`${baseUrl}/api/storage/delete`, {
    method: "POST",
    headers: cookieJar.apply({
      "content-type": "application/json",
      accept: "application/json",
    }),
    body: JSON.stringify({ key }),
  });
  cookieJar.capture(response);
  const text = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected 200 for /api/storage/delete, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  const data = parseJson(text, "/api/storage/delete");
  if (!data || data.ok !== true) {
    throw new Error(`Expected delete API to return ok=true, received ${text.slice(0, 300)}`);
  }

  console.log("PASS /api/storage/delete removes the uploaded file");
}

async function assertUploadedFileMissing(url) {
  const response = await fetch(url.startsWith("http") ? url : `${baseUrl}${url}`);
  const text = await response.text();

  if (response.status !== 404) {
    throw new Error(`Expected deleted upload URL to return 404, received ${response.status}. Body: ${text.slice(0, 300)}`);
  }

  console.log("PASS deleted upload URL returns 404");
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

  console.log("PASS /api/auth/sign-out completed after storage smoke");
}

async function main() {
  console.log(`Running Logicstarter authenticated storage smoke against ${baseUrl}`);
  await waitForRuntimeReady();
  await assertBootstrapState();
  const runtime = await getStorageRuntime();

  if (requireRemoteStorage && (!runtime.provider || runtime.provider === "local" || !runtime.capabilities?.signedPutUrl)) {
    throw new Error(`Expected a remote storage runtime with signed PUT enabled, received provider=${runtime.provider ?? "unknown"}.`);
  }

  const cookieJar = createCookieJar();
  await signInWithPassword(cookieJar);
  const upload = await uploadFile(cookieJar);
  await assertUploadedFileAccessible(upload.url);
  await assertSignedUrlAccessible(cookieJar, upload.key);
  if (runtime.capabilities?.signedPutUrl) {
    await assertSignedPutSucceeds(cookieJar);
  } else {
    await assertSignedPutRejected(cookieJar, upload.key);
  }
  await deleteFile(cookieJar, upload.key);
  await assertUploadedFileMissing(upload.url);
  await signOut(cookieJar);

  console.log("Logicstarter authenticated storage smoke passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
