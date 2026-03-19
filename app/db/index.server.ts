import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { readLogicstarterDatabaseProfile } from "~/lib/logicstarter/config.server";

type LogicstarterDbRuntime = ReturnType<typeof createLogicstarterDb>;

export function createLogicstarterDb() {
  const profile = readLogicstarterDatabaseProfile();

  if (profile !== "pg") {
    throw new Error(`Database profile ${profile} is not implemented yet in Logicstarter runtime wiring.`);
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for the Better Auth Drizzle baseline.");
  }

  const client = postgres(connectionString, {
    prepare: false,
  });

  return {
    profile,
    client,
    db: drizzle(client),
  };
}

let cachedLogicstarterDatabase: LogicstarterDbRuntime | null = null;

export function getLogicstarterDatabaseRuntime() {
  cachedLogicstarterDatabase ??= createLogicstarterDb();
  return cachedLogicstarterDatabase;
}

export function getLogicstarterDatabaseProfile() {
  return getLogicstarterDatabaseRuntime().profile;
}

export function getLogicstarterDb() {
  return getLogicstarterDatabaseRuntime().db;
}

export const logicstarterDatabaseProfile = readLogicstarterDatabaseProfile();
export const db = new Proxy({} as ReturnType<typeof getLogicstarterDb>, {
  get(_, property) {
    return getLogicstarterDb()[property as keyof ReturnType<typeof getLogicstarterDb>];
  },
});
