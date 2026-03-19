import { getLogicstarterDatabaseRuntime } from "~/db/index.server";
import { readLogicstarterDatabaseProfile } from "~/lib/logicstarter/config.server";

type LogicstarterCloudflareRuntimeContext = {
  cloudflare?: {
    env?: Record<string, unknown>;
  };
};

type LogicstarterBillingOwner = {
  email?: string | null;
  ownerId: string;
  ownerType: "user";
};

type LogicstarterBillingSubscriptionState = {
  currentPeriodEnd?: string | null;
  ownerId: string;
  ownerType: "user";
  priceId?: string | null;
  status?: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

type LogicstarterBillingCustomerState = {
  email?: string | null;
  ownerId: string;
  ownerType: "user";
  stripeCustomerId: string;
};

type LogicstarterBillingStore = {
  ensureReady(): Promise<void>;
  clearCustomerByOwner(owner: LogicstarterBillingOwner): Promise<void>;
  clearSubscriptionByOwner(owner: LogicstarterBillingOwner): Promise<void>;
  getCustomerByOwner(owner: LogicstarterBillingOwner): Promise<LogicstarterBillingCustomerState | null>;
  getSubscriptionByOwner(owner: LogicstarterBillingOwner): Promise<LogicstarterBillingSubscriptionState | null>;
  getStripeCustomerIdByOwner(owner: LogicstarterBillingOwner): Promise<string | null>;
  getOwnerByStripeCustomerId(stripeCustomerId: string): Promise<LogicstarterBillingOwner | null>;
  markWebhookProcessed(eventId: string, eventType: string): Promise<boolean>;
  upsertCustomer(state: LogicstarterBillingCustomerState): Promise<void>;
  upsertSubscription(state: LogicstarterBillingSubscriptionState): Promise<void>;
};

type LogicstarterD1Binding = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T = unknown>(): Promise<{ results?: T[] }>;
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
  exec(query: string): Promise<unknown>;
};

function isLogicstarterD1Binding(value: unknown): value is LogicstarterD1Binding {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    prepare?: unknown;
    exec?: unknown;
  };

  return typeof candidate.prepare === "function" && typeof candidate.exec === "function";
}

function resolveLogicstarterD1Binding(runtimeContext?: LogicstarterCloudflareRuntimeContext) {
  const envBindings = runtimeContext?.cloudflare?.env;

  if (!envBindings) {
    throw new Error("Cloudflare billing state requires context.cloudflare.env so a D1 binding can be resolved.");
  }

  for (const value of Object.values(envBindings)) {
    if (isLogicstarterD1Binding(value)) {
      return value;
    }
  }

  throw new Error("Cloudflare billing state could not find a D1 binding in context.cloudflare.env.");
}

function createTableStatements() {
  return [
    `CREATE TABLE IF NOT EXISTS logicstarter_billing_customer (
      owner_type text NOT NULL,
      owner_id text NOT NULL,
      email text,
      stripe_customer_id text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      PRIMARY KEY (owner_type, owner_id)
    );`,
    "CREATE UNIQUE INDEX IF NOT EXISTS logicstarter_billing_customer_customer_uidx ON logicstarter_billing_customer (stripe_customer_id);",
    `CREATE TABLE IF NOT EXISTS logicstarter_billing_subscription (
      owner_type text NOT NULL,
      owner_id text NOT NULL,
      stripe_customer_id text NOT NULL,
      stripe_subscription_id text NOT NULL,
      stripe_price_id text,
      status text,
      current_period_end text,
      updated_at text NOT NULL,
      PRIMARY KEY (owner_type, owner_id)
    );`,
    "CREATE UNIQUE INDEX IF NOT EXISTS logicstarter_billing_subscription_subscription_uidx ON logicstarter_billing_subscription (stripe_subscription_id);",
    `CREATE TABLE IF NOT EXISTS logicstarter_billing_webhook_event (
      event_id text PRIMARY KEY,
      event_type text NOT NULL,
      processed_at text NOT NULL
    );`,
  ] as const;
}

function createNodeBillingStore(): LogicstarterBillingStore {
  const profile = readLogicstarterDatabaseProfile();
  if (profile !== "pg") {
    throw new Error(`Node billing state store does not support database profile ${profile}.`);
  }

  const client = getLogicstarterDatabaseRuntime().client;
  let readyPromise: Promise<void> | null = null;

  async function ensureReady() {
    if (!readyPromise) {
      readyPromise = (async () => {
        for (const statement of createTableStatements()) {
          await client.unsafe(statement);
        }
      })();
    }

    await readyPromise;
  }

  return {
    async ensureReady() {
      await ensureReady();
    },
    async clearCustomerByOwner(owner) {
      await ensureReady();
      await client`
        DELETE FROM logicstarter_billing_customer
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
      `;
    },
    async clearSubscriptionByOwner(owner) {
      await ensureReady();
      await client`
        DELETE FROM logicstarter_billing_subscription
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
      `;
    },
    async getCustomerByOwner(owner) {
      await ensureReady();
      const rows = await client<{ email: string | null; stripe_customer_id: string }[]>`
        SELECT email, stripe_customer_id
        FROM logicstarter_billing_customer
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
        LIMIT 1
      `;
      const row = rows[0];
      return row
        ? {
            ownerType: owner.ownerType,
            ownerId: owner.ownerId,
            email: row.email,
            stripeCustomerId: row.stripe_customer_id,
          }
        : null;
    },
    async getSubscriptionByOwner(owner) {
      await ensureReady();
      const rows = await client<{ current_period_end: string | null; status: string | null; stripe_customer_id: string; stripe_price_id: string | null; stripe_subscription_id: string }[]>`
        SELECT current_period_end, status, stripe_customer_id, stripe_price_id, stripe_subscription_id
        FROM logicstarter_billing_subscription
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
        LIMIT 1
      `;
      const row = rows[0];
      return row
        ? {
            ownerType: owner.ownerType,
            ownerId: owner.ownerId,
            currentPeriodEnd: row.current_period_end,
            priceId: row.stripe_price_id,
            status: row.status,
            stripeCustomerId: row.stripe_customer_id,
            stripeSubscriptionId: row.stripe_subscription_id,
          }
        : null;
    },
    async getStripeCustomerIdByOwner(owner) {
      await ensureReady();
      const rows = await client<{ stripe_customer_id: string }[]>`
        SELECT stripe_customer_id
        FROM logicstarter_billing_customer
        WHERE owner_type = ${owner.ownerType} AND owner_id = ${owner.ownerId}
        LIMIT 1
      `;
      return rows[0]?.stripe_customer_id ?? null;
    },
    async getOwnerByStripeCustomerId(stripeCustomerId) {
      await ensureReady();
      const rows = await client<{ owner_type: "user"; owner_id: string; email: string | null }[]>`
        SELECT owner_type, owner_id, email
        FROM logicstarter_billing_customer
        WHERE stripe_customer_id = ${stripeCustomerId}
        LIMIT 1
      `;
      const row = rows[0];
      return row ? { ownerType: row.owner_type, ownerId: row.owner_id, email: row.email } : null;
    },
    async markWebhookProcessed(eventId, eventType) {
      await ensureReady();
      const rows = await client<{ event_id: string }[]>`
        INSERT INTO logicstarter_billing_webhook_event (event_id, event_type, processed_at)
        VALUES (${eventId}, ${eventType}, ${new Date().toISOString()})
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
      `;
      return rows.length > 0;
    },
    async upsertCustomer(state) {
      await ensureReady();
      await client`
        INSERT INTO logicstarter_billing_customer (owner_type, owner_id, email, stripe_customer_id, created_at, updated_at)
        VALUES (${state.ownerType}, ${state.ownerId}, ${state.email ?? null}, ${state.stripeCustomerId}, ${new Date().toISOString()}, ${new Date().toISOString()})
        ON CONFLICT (owner_type, owner_id)
        DO UPDATE SET email = EXCLUDED.email, stripe_customer_id = EXCLUDED.stripe_customer_id, updated_at = EXCLUDED.updated_at
      `;
    },
    async upsertSubscription(state) {
      await ensureReady();
      await client`
        INSERT INTO logicstarter_billing_subscription (owner_type, owner_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end, updated_at)
        VALUES (${state.ownerType}, ${state.ownerId}, ${state.stripeCustomerId}, ${state.stripeSubscriptionId}, ${state.priceId ?? null}, ${state.status ?? null}, ${state.currentPeriodEnd ?? null}, ${new Date().toISOString()})
        ON CONFLICT (owner_type, owner_id)
        DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, stripe_subscription_id = EXCLUDED.stripe_subscription_id, stripe_price_id = EXCLUDED.stripe_price_id, status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end, updated_at = EXCLUDED.updated_at
      `;
    },
  };
}

function createCloudflareBillingStore(runtimeContext?: LogicstarterCloudflareRuntimeContext): LogicstarterBillingStore {
  const binding = resolveLogicstarterD1Binding(runtimeContext);
  let readyPromise: Promise<void> | null = null;

  async function ensureReady() {
    if (!readyPromise) {
      readyPromise = (async () => {
        for (const statement of createTableStatements()) {
          await binding.exec(statement);
        }
      })();
    }

    await readyPromise;
  }

  return {
    async ensureReady() {
      await ensureReady();
    },
    async clearCustomerByOwner(owner) {
      await ensureReady();
      await binding
        .prepare("DELETE FROM logicstarter_billing_customer WHERE owner_type = ?1 AND owner_id = ?2")
        .bind(owner.ownerType, owner.ownerId)
        .run();
    },
    async clearSubscriptionByOwner(owner) {
      await ensureReady();
      await binding
        .prepare("DELETE FROM logicstarter_billing_subscription WHERE owner_type = ?1 AND owner_id = ?2")
        .bind(owner.ownerType, owner.ownerId)
        .run();
    },
    async getCustomerByOwner(owner) {
      await ensureReady();
      const row = await binding
        .prepare("SELECT email, stripe_customer_id FROM logicstarter_billing_customer WHERE owner_type = ?1 AND owner_id = ?2 LIMIT 1")
        .bind(owner.ownerType, owner.ownerId)
        .first<{ email: string | null; stripe_customer_id: string }>();
      return row
        ? {
            ownerType: owner.ownerType,
            ownerId: owner.ownerId,
            email: row.email,
            stripeCustomerId: row.stripe_customer_id,
          }
        : null;
    },
    async getSubscriptionByOwner(owner) {
      await ensureReady();
      const row = await binding
        .prepare("SELECT current_period_end, status, stripe_customer_id, stripe_price_id, stripe_subscription_id FROM logicstarter_billing_subscription WHERE owner_type = ?1 AND owner_id = ?2 LIMIT 1")
        .bind(owner.ownerType, owner.ownerId)
        .first<{ current_period_end: string | null; status: string | null; stripe_customer_id: string; stripe_price_id: string | null; stripe_subscription_id: string }>();
      return row
        ? {
            ownerType: owner.ownerType,
            ownerId: owner.ownerId,
            currentPeriodEnd: row.current_period_end,
            priceId: row.stripe_price_id,
            status: row.status,
            stripeCustomerId: row.stripe_customer_id,
            stripeSubscriptionId: row.stripe_subscription_id,
          }
        : null;
    },
    async getStripeCustomerIdByOwner(owner) {
      await ensureReady();
      const row = await binding
        .prepare("SELECT stripe_customer_id FROM logicstarter_billing_customer WHERE owner_type = ?1 AND owner_id = ?2 LIMIT 1")
        .bind(owner.ownerType, owner.ownerId)
        .first<{ stripe_customer_id: string }>();
      return row?.stripe_customer_id ?? null;
    },
    async getOwnerByStripeCustomerId(stripeCustomerId) {
      await ensureReady();
      const row = await binding
        .prepare("SELECT owner_type, owner_id, email FROM logicstarter_billing_customer WHERE stripe_customer_id = ?1 LIMIT 1")
        .bind(stripeCustomerId)
        .first<{ owner_type: "user"; owner_id: string; email: string | null }>();
      return row ? { ownerType: row.owner_type, ownerId: row.owner_id, email: row.email } : null;
    },
    async markWebhookProcessed(eventId, eventType) {
      await ensureReady();
      const existing = await binding
        .prepare("SELECT event_id FROM logicstarter_billing_webhook_event WHERE event_id = ?1 LIMIT 1")
        .bind(eventId)
        .first<{ event_id: string }>();
      if (existing?.event_id) {
        return false;
      }
      await binding
        .prepare("INSERT INTO logicstarter_billing_webhook_event (event_id, event_type, processed_at) VALUES (?1, ?2, ?3)")
        .bind(eventId, eventType, new Date().toISOString())
        .run();
      return true;
    },
    async upsertCustomer(state) {
      await ensureReady();
      await binding
        .prepare(`INSERT INTO logicstarter_billing_customer (owner_type, owner_id, email, stripe_customer_id, created_at, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          ON CONFLICT(owner_type, owner_id) DO UPDATE SET
            email = excluded.email,
            stripe_customer_id = excluded.stripe_customer_id,
            updated_at = excluded.updated_at`)
        .bind(state.ownerType, state.ownerId, state.email ?? null, state.stripeCustomerId, new Date().toISOString(), new Date().toISOString())
        .run();
    },
    async upsertSubscription(state) {
      await ensureReady();
      await binding
        .prepare(`INSERT INTO logicstarter_billing_subscription (owner_type, owner_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
          ON CONFLICT(owner_type, owner_id) DO UPDATE SET
            stripe_customer_id = excluded.stripe_customer_id,
            stripe_subscription_id = excluded.stripe_subscription_id,
            stripe_price_id = excluded.stripe_price_id,
            status = excluded.status,
            current_period_end = excluded.current_period_end,
            updated_at = excluded.updated_at`)
        .bind(state.ownerType, state.ownerId, state.stripeCustomerId, state.stripeSubscriptionId, state.priceId ?? null, state.status ?? null, state.currentPeriodEnd ?? null, new Date().toISOString())
        .run();
    },
  };
}

export function createLogicstarterBillingStateStore(runtimeContext?: LogicstarterCloudflareRuntimeContext) {
  return readLogicstarterDatabaseProfile() === "d1"
    ? createCloudflareBillingStore(runtimeContext)
    : createNodeBillingStore();
}
