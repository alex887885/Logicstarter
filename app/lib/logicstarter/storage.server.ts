import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getAwsSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { readLogicstarterProviderConfig } from "~/lib/logicstarter/config.server";

export type LogicstarterStorageProvider = "local" | "s3" | "r2";

export type LogicstarterStorageVisibility = "public" | "private";

export type LogicstarterStorageObjectInput = {
  key: string;
  body: ArrayBuffer | Uint8Array | ReadableStream<Uint8Array> | string;
  contentType?: string;
  visibility?: LogicstarterStorageVisibility;
  metadata?: Record<string, string>;
};

export type LogicstarterStorageSignedUrlInput = {
  key: string;
  expiresInSeconds?: number;
  method?: "GET" | "PUT";
  contentType?: string;
};

export type LogicstarterStorageDeleteInput = {
  key: string;
};

export type LogicstarterStoragePutResult = {
  key: string;
  url?: string;
};

export type LogicstarterStorageSignedUrlResult = {
  url: string;
  expiresAt?: Date;
};

export interface LogicstarterStorageProviderAdapter {
  provider: LogicstarterStorageProvider;
  validateConfig(): Promise<void> | void;
  putObject(input: LogicstarterStorageObjectInput): Promise<LogicstarterStoragePutResult>;
  getPublicUrl(key: string): Promise<string | null> | string | null;
  getSignedUrl(input: LogicstarterStorageSignedUrlInput): Promise<LogicstarterStorageSignedUrlResult>;
  deleteObject(input: LogicstarterStorageDeleteInput): Promise<void>;
}

type LogicstarterStorageConfig = ReturnType<typeof readLogicstarterProviderConfig>["storage"];

const contentTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".json", "application/json"],
  [".pdf", "application/pdf"],
  [".txt", "text/plain; charset=utf-8"],
]);

function normalizeStorageKey(key: string) {
  return key.replace(/^\/+/, "").replace(/\\/g, "/");
}

function assertSafeStorageKey(key: string) {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey || normalizedKey.includes("..") || normalizedKey.startsWith(".")) {
    throw new Error("Storage key must be a safe relative path.");
  }
  return normalizedKey;
}

function resolveLocalBasePath(config: LogicstarterStorageConfig) {
  const configuredBasePath = config.localBasePath?.trim();
  if (!configuredBasePath) {
    return path.resolve(process.cwd(), "uploads");
  }
  return path.isAbsolute(configuredBasePath)
    ? configuredBasePath
    : path.resolve(process.cwd(), configuredBasePath);
}

export function resolveLogicstarterLocalStoragePath(key: string, config = readLogicstarterProviderConfig().storage) {
  const normalizedKey = assertSafeStorageKey(key);
  return path.join(resolveLocalBasePath(config), normalizedKey);
}

function toUint8Array(body: LogicstarterStorageObjectInput["body"]) {
  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }

  if (body instanceof Uint8Array) {
    return body;
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }

  throw new Error("ReadableStream bodies are not implemented yet for local Logicstarter storage.");
}

function resolvePublicUrl(baseUrl: string | null | undefined, key: string) {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey) {
    return null;
  }

  const trimmedBaseUrl = baseUrl?.trim();
  if (!trimmedBaseUrl) {
    return `/uploads/${normalizedKey}`;
  }

  if (trimmedBaseUrl.startsWith("/")) {
    return `${trimmedBaseUrl.replace(/\/$/, "")}/${normalizedKey}`;
  }

  return `${trimmedBaseUrl.replace(/\/$/, "")}/${normalizedKey}`;
}

function parseForcePathStyle(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function buildS3DefaultPublicUrl(config: LogicstarterStorageConfig, key: string) {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey || !config.s3Bucket) {
    return null;
  }

  if (config.s3Endpoint) {
    const trimmedEndpoint = config.s3Endpoint.replace(/\/$/, "");
    if (parseForcePathStyle(config.s3ForcePathStyle)) {
      return `${trimmedEndpoint}/${config.s3Bucket}/${normalizedKey}`;
    }
    return `${trimmedEndpoint.replace(/:\/\//, `://${config.s3Bucket}.`)}/${normalizedKey}`;
  }

  if (!config.s3Region) {
    return null;
  }

  return `https://${config.s3Bucket}.s3.${config.s3Region}.amazonaws.com/${normalizedKey}`;
}

function buildR2Endpoint(config: LogicstarterStorageConfig) {
  if (!config.r2AccountId) {
    return null;
  }
  return `https://${config.r2AccountId}.r2.cloudflarestorage.com`;
}

function buildR2DefaultPublicUrl(config: LogicstarterStorageConfig, key: string) {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey || !config.r2AccountId || !config.r2Bucket) {
    return null;
  }

  return `https://${config.r2Bucket}.${config.r2AccountId}.r2.cloudflarestorage.com/${normalizedKey}`;
}

function createS3CompatibleClient(options: {
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId: string;
  secretAccessKey: string;
}) {
  return new S3Client({
    region: options.region,
    endpoint: options.endpoint,
    forcePathStyle: options.forcePathStyle,
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
  });
}

function createRemoteStorageProvider(options: {
  provider: LogicstarterStorageProvider;
  config: LogicstarterStorageConfig;
  bucket: string;
  client: S3Client;
  resolvePublicUrlForKey: (key: string) => string | null;
}) {
  return {
    provider: options.provider,
    validateConfig() {},
    async putObject(input: LogicstarterStorageObjectInput) {
      const key = assertSafeStorageKey(input.key);
      await options.client.send(new PutObjectCommand({
        Bucket: options.bucket,
        Key: key,
        Body: toUint8Array(input.body),
        ContentType: input.contentType,
        Metadata: input.metadata,
      }));

      return {
        key,
        url: options.resolvePublicUrlForKey(key) ?? undefined,
      };
    },
    getPublicUrl(key: string) {
      return options.resolvePublicUrlForKey(key);
    },
    async getSignedUrl(input: LogicstarterStorageSignedUrlInput) {
      const key = assertSafeStorageKey(input.key);
      const expiresInSeconds = input.expiresInSeconds ?? 900;
      const command = input.method === "PUT"
        ? new PutObjectCommand({ Bucket: options.bucket, Key: key, ContentType: input.contentType })
        : new GetObjectCommand({ Bucket: options.bucket, Key: key });

      return {
        url: await getAwsSignedUrl(options.client, command, { expiresIn: expiresInSeconds }),
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      };
    },
    async deleteObject(input: LogicstarterStorageDeleteInput) {
      const key = assertSafeStorageKey(input.key);
      await options.client.send(new DeleteObjectCommand({
        Bucket: options.bucket,
        Key: key,
      }));
    },
  } satisfies LogicstarterStorageProviderAdapter;
}

function createNotImplementedOperation(provider: LogicstarterStorageProvider, operation: string) {
  return async () => {
    throw new Error(`Logicstarter storage provider ${provider} does not implement ${operation} yet.`);
  };
}

export function getLogicstarterStorageContentType(filePath: string) {
  return contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
}

function createLocalStorageProvider(config: LogicstarterStorageConfig): LogicstarterStorageProviderAdapter {
  return {
    provider: "local",
    validateConfig() {},
    async putObject(input) {
      this.validateConfig();
      const key = assertSafeStorageKey(input.key);
      const absolutePath = resolveLogicstarterLocalStoragePath(key, config);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, toUint8Array(input.body));
      return {
        key,
        url: resolvePublicUrl(config.publicBaseUrl, key) ?? undefined,
      };
    },
    getPublicUrl(key) {
      return resolvePublicUrl(config.publicBaseUrl, key);
    },
    async getSignedUrl(input) {
      this.validateConfig();
      if (input.method === "PUT") {
        throw new Error("Logicstarter local storage does not support signed PUT URLs.");
      }
      const url = resolvePublicUrl(config.publicBaseUrl, input.key);
      if (!url) {
        throw new Error("A valid storage key is required to resolve a local storage URL.");
      }
      return {
        url,
      };
    },
    async deleteObject(input) {
      this.validateConfig();
      const absolutePath = resolveLogicstarterLocalStoragePath(input.key, config);
      await rm(absolutePath, { force: true });
    },
  };
}

function createS3StorageProvider(config: LogicstarterStorageConfig): LogicstarterStorageProviderAdapter {
  if (!config.s3Region || !config.s3Bucket || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
    return {
      provider: "s3",
      validateConfig() {
        throw new Error("S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY are required when STORAGE_PROVIDER=s3.");
      },
      putObject: createNotImplementedOperation("s3", "putObject") as LogicstarterStorageProviderAdapter["putObject"],
      getPublicUrl(key) {
        return resolvePublicUrl(config.publicBaseUrl, key) ?? buildS3DefaultPublicUrl(config, key);
      },
      getSignedUrl: createNotImplementedOperation("s3", "getSignedUrl") as LogicstarterStorageProviderAdapter["getSignedUrl"],
      deleteObject: createNotImplementedOperation("s3", "deleteObject") as LogicstarterStorageProviderAdapter["deleteObject"],
    };
  }

  const client = createS3CompatibleClient({
    region: config.s3Region,
    endpoint: config.s3Endpoint,
    forcePathStyle: parseForcePathStyle(config.s3ForcePathStyle),
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
  });

  return createRemoteStorageProvider({
    provider: "s3",
    config,
    bucket: config.s3Bucket,
    client,
    resolvePublicUrlForKey(key) {
      return resolvePublicUrl(config.publicBaseUrl, key) ?? buildS3DefaultPublicUrl(config, key);
    },
  });
}

function createR2StorageProvider(config: LogicstarterStorageConfig): LogicstarterStorageProviderAdapter {
  if (!config.r2AccountId || !config.r2Bucket || !config.r2AccessKeyId || !config.r2SecretAccessKey) {
    return {
      provider: "r2",
      validateConfig() {
        throw new Error("R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required when STORAGE_PROVIDER=r2.");
      },
      putObject: createNotImplementedOperation("r2", "putObject") as LogicstarterStorageProviderAdapter["putObject"],
      getPublicUrl(key) {
        return resolvePublicUrl(config.publicBaseUrl, key) ?? buildR2DefaultPublicUrl(config, key);
      },
      getSignedUrl: createNotImplementedOperation("r2", "getSignedUrl") as LogicstarterStorageProviderAdapter["getSignedUrl"],
      deleteObject: createNotImplementedOperation("r2", "deleteObject") as LogicstarterStorageProviderAdapter["deleteObject"],
    };
  }

  const client = createS3CompatibleClient({
    region: "auto",
    endpoint: buildR2Endpoint(config) ?? undefined,
    forcePathStyle: true,
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  });

  return createRemoteStorageProvider({
    provider: "r2",
    config,
    bucket: config.r2Bucket,
    client,
    resolvePublicUrlForKey(key) {
      return resolvePublicUrl(config.publicBaseUrl, key) ?? buildR2DefaultPublicUrl(config, key);
    },
  });
}

export function getLogicstarterStorageRuntimeSnapshot() {
  const config = readLogicstarterProviderConfig().storage;
  const capabilities = {
    putObject: true,
    deleteObject: true,
    signedGetUrl: true,
    signedPutUrl: config.provider === "s3" || config.provider === "r2",
    publicObjectUrl: true,
  };

  return {
    provider: config.provider,
    localBasePath: resolveLocalBasePath(config),
    publicBaseUrl: config.publicBaseUrl,
    s3Region: config.s3Region,
    s3Bucket: config.s3Bucket,
    s3Endpoint: config.s3Endpoint,
    s3ForcePathStyle: parseForcePathStyle(config.s3ForcePathStyle),
    r2AccountId: config.r2AccountId,
    r2Bucket: config.r2Bucket,
    resolvedEndpoint: config.provider === "s3"
      ? config.s3Endpoint ?? (config.s3Region ? `https://s3.${config.s3Region}.amazonaws.com` : null)
      : config.provider === "r2"
        ? buildR2Endpoint(config)
        : null,
    capabilities,
  };
}

export function createLogicstarterStorageProvider() {
  const config = readLogicstarterProviderConfig().storage;

  if (config.provider === "s3") {
    return createS3StorageProvider(config);
  }

  if (config.provider === "r2") {
    return createR2StorageProvider(config);
  }

  return createLocalStorageProvider(config);
}
