import { eq } from "drizzle-orm";
import { db } from "~/db/index.server";
import * as schema from "~/db/schema";

export async function getLogicstarterFirstLoginState() {
  const existingUsers = await db.select({ id: schema.user.id }).from(schema.user).limit(1);
  return {
    bootstrapAdminSetup: existingUsers.length === 0,
  };
}

export async function findLogicstarterUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const [user] = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      emailVerified: schema.user.emailVerified,
    })
    .from(schema.user)
    .where(eq(schema.user.email, normalizedEmail))
    .limit(1);

  return user ?? null;
}
