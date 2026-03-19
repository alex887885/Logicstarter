import { createHash, createHmac } from "node:crypto";

function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmacSha256Raw(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hmacSha256Hex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(amzDate: string) {
  return amzDate.slice(0, 8);
}

function deriveSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const kDate = hmacSha256Raw(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256Raw(kDate, region);
  const kService = hmacSha256Raw(kRegion, service);
  return hmacSha256Raw(kService, "aws4_request");
}

export function createAwsSigV4Headers(input: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
  method: string;
  url: URL;
  headers?: Record<string, string>;
  body: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(amzDate);
  const bodyHash = sha256Hex(input.body);
  const baseHeaders: Record<string, string> = {
    host: input.url.host,
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDate,
    ...Object.fromEntries(Object.entries(input.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value.trim()])),
  };

  const sortedHeaderKeys = Object.keys(baseHeaders).sort();
  const canonicalHeaders = sortedHeaderKeys.map((key) => `${key}:${baseHeaders[key]}\n`).join("");
  const signedHeaders = sortedHeaderKeys.join(";");
  const canonicalRequest = [
    input.method.toUpperCase(),
    input.url.pathname || "/",
    input.url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = deriveSigningKey(input.secretAccessKey, dateStamp, input.region, input.service);
  const signature = hmacSha256Hex(signingKey, stringToSign);

  return {
    ...baseHeaders,
    Authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
