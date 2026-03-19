import type { ActionFunctionArgs } from "react-router";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "~/db/index.server";
import * as schema from "~/db/schema";
import { getLogicstarterFirstLoginState } from "~/lib/logicstarter/first-login.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email } = await request.json() as { email?: string };
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const { bootstrapAdminSetup } = await getLogicstarterFirstLoginState();

    if (!normalizedEmail) {
      return Response.json({ exists: false, bootstrapAdminSetup });
    }

    const [user] = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        emailVerified: schema.user.emailVerified,
      })
      .from(schema.user)
      .where(eq(schema.user.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return Response.json({ exists: false, bootstrapAdminSetup });
    }

    const [passwordAccount] = await db
      .select({ id: schema.account.id })
      .from(schema.account)
      .where(and(eq(schema.account.userId, user.id), eq(schema.account.providerId, "credential"), isNotNull(schema.account.password)))
      .limit(1);

    const linkedAccounts = await db
      .select({ providerId: schema.account.providerId })
      .from(schema.account)
      .where(eq(schema.account.userId, user.id));

    const linkedProviders = linkedAccounts
      .map((account) => account.providerId)
      .filter((providerId) => providerId !== "credential");

    return Response.json({
      exists: true,
      bootstrapAdminSetup,
      hasPassword: Boolean(passwordAccount),
      hasSocialAccount: linkedProviders.length > 0,
      linkedProviders,
      name: user.name,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error("[Logicstarter Auth] Email existence check failed", { error });
    return Response.json({ exists: false }, { status: 500 });
  }
}
