import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/lib/auth.server.ts", import.meta.url), "utf8");
const authRouteSource = await readFile(new URL("../app/routes/api.auth.$.tsx", import.meta.url), "utf8");

if (source.includes('import { stripe } from "@better-auth/stripe";')) {
  throw new Error("Expected auth.server.ts to avoid a top-level @better-auth/stripe import so Cloudflare-target auth can skip eager Stripe plugin loading.");
}

if (source.includes('import Stripe from "stripe";')) {
  throw new Error("Expected auth.server.ts to avoid a top-level Stripe SDK import so Cloudflare-target auth can skip eager Node billing dependencies.");
}

if (!source.includes('if (readLogicstarterRuntimeTarget() !== "node")')) {
  throw new Error("Expected auth.server.ts to gate Stripe plugin loading behind the node runtime target.");
}

if (!source.includes('import("@better-auth/stripe")') || !source.includes('import("stripe")')) {
  throw new Error("Expected auth.server.ts to dynamically import Stripe server dependencies only inside the node-target path.");
}

if (!source.includes('const stripePlugin = await getLogicstarterStripePlugin();')) {
  throw new Error("Expected getLogicstarterAuth() to lazily resolve the Stripe plugin at runtime.");
}

if (!authRouteSource.includes('pathname.startsWith("/api/auth/stripe")')) {
  throw new Error("Expected the Better Auth catch-all route to explicitly detect Stripe auth subroutes.");
}

if (!authRouteSource.includes('if (runtimeTarget === "node")')) {
  throw new Error("Expected the Better Auth catch-all route to allow Stripe auth subroutes only on the node runtime target.");
}

if (!authRouteSource.includes('serverPathMode: "worker_unsupported"')) {
  throw new Error("Expected the Better Auth catch-all route to return explicit worker_unsupported metadata for Stripe auth subroutes on non-node runtimes.");
}

console.log("PASS cloudflare auth contract keeps Stripe server dependencies out of auth top-level initialization");
