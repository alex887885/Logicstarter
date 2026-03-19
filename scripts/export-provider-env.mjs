import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.LOGICSTARTER_BASE_URL || "http://127.0.0.1:5000";
const envPath = process.env.LOGICSTARTER_ENV_PATH || path.resolve(process.cwd(), ".env.runtime");
const categories = ["email", "sms", "authentication"];
const orderedKeys = [
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
  "SMS_PROVIDER",
  "VONAGE_API_KEY",
  "VONAGE_API_SECRET",
  "VONAGE_FROM",
  "AMAZON_SNS_REGION",
  "AMAZON_SNS_ACCESS_KEY_ID",
  "AMAZON_SNS_SECRET_ACCESS_KEY",
  "AMAZON_SNS_SENDER_ID",
  "AUTH_GOOGLE_ENABLED",
  "AUTH_GOOGLE_CLIENT_ID",
  "AUTH_GOOGLE_CLIENT_SECRET",
  "AUTH_GITHUB_ENABLED",
  "AUTH_GITHUB_CLIENT_ID",
  "AUTH_GITHUB_CLIENT_SECRET",
];

async function fetchCategory(category) {
  const response = await fetch(`${baseUrl}/api/settings/providers?category=${category}`);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Failed to fetch ${category} settings from ${baseUrl}: ${response.status} ${text.slice(0, 300)}`);
  }

  return JSON.parse(text);
}

function toEnvLine(key, value) {
  return `${key}=${value ?? ""}`;
}

function mergeEnvContent(existingContent, values) {
  const lines = existingContent.split(/\r?\n/);
  const remaining = new Map(Object.entries(values));
  const mergedLines = lines.map((line) => {
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return line;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!remaining.has(key)) {
      return line;
    }

    const nextLine = toEnvLine(key, remaining.get(key));
    remaining.delete(key);
    return nextLine;
  });

  for (const key of orderedKeys) {
    if (remaining.has(key)) {
      mergedLines.push(toEnvLine(key, remaining.get(key)));
      remaining.delete(key);
    }
  }

  for (const [key, value] of remaining.entries()) {
    mergedLines.push(toEnvLine(key, value));
  }

  return `${mergedLines.join("\n").replace(/\n*$/, "")}\n`;
}

async function main() {
  const payloads = await Promise.all(categories.map(fetchCategory));
  const values = Object.fromEntries(
    payloads.flatMap((payload) =>
      Object.values(payload.settings).map((setting) => [setting.key, setting.value]),
    ),
  );
  const existingContent = await readFile(envPath, "utf8");
  const nextContent = mergeEnvContent(existingContent, values);

  await writeFile(envPath, nextContent, "utf8");

  console.log(`Exported ${Object.keys(values).length} provider/auth settings to ${envPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
