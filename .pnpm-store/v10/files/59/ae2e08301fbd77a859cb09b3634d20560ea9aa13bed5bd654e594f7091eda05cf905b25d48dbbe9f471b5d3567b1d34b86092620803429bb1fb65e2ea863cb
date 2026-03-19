import { env } from "@better-auth/core/env";

//#region src/constants.ts
/**
* Infrastructure API URL
* Can be overridden via plugin config or BETTER_AUTH_API_URL env var for local development
*/
const INFRA_API_URL = env.BETTER_AUTH_API_URL || "https://dash.better-auth.com";
/**
* KV Storage URL
* Can be overridden via plugin config or BETTER_AUTH_KV_URL env var for local development
*/
const INFRA_KV_URL = env.BETTER_AUTH_KV_URL || "https://kv.better-auth.com";
/** Timeout for KV HTTP operations (ms) */
const KV_TIMEOUT_MS = 5e3;

//#endregion
export { INFRA_KV_URL as n, KV_TIMEOUT_MS as r, INFRA_API_URL as t };