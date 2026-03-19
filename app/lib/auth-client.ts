import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";
import { ssoClient } from "@better-auth/sso/client";
import { stripeClient } from "@better-auth/stripe/client";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  credentialsPropagation: true,
  plugins: [organizationClient(), dashClient(), ssoClient(), stripeClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export async function getSession() {
  const response = await fetch("/api/auth/get-session", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch auth session: ${response.status}`);
  }

  const data = await response.json();
  return { data };
}
