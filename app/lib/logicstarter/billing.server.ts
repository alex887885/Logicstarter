import { readLogicstarterProviderConfig, readLogicstarterRuntimeTarget } from "~/lib/logicstarter/config.server";
import { createLogicstarterBillingStateStore } from "~/lib/logicstarter/billing-state.server";

type LogicstarterCloudflareRuntimeContext = {
  cloudflare?: {
    env?: Record<string, unknown>;
  };
};

type LogicstarterStripeModule = typeof import("stripe");
type LogicstarterStripe = InstanceType<LogicstarterStripeModule["default"]>;

type LogicstarterCheckoutInput = {
  cancelUrl: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
  priceId: string;
  successUrl: string;
};

function requireConfigured(value: string | undefined, message: string) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(message);
  }
  return normalized;
}

function normalizeAbsoluteUrl(value: string, label: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid absolute URL.`);
  }
}

async function getStripeRuntime() {
  const billing = readLogicstarterProviderConfig().billing;
  const secretKey = requireConfigured(
    billing.stripeSecretKey,
    "STRIPE_SECRET_KEY is required before using Logicstarter billing routes.",
  );
  const stripeModule = await import("stripe");
  const stripe = new stripeModule.default(secretKey, {
    apiVersion: "2025-11-17.clover",
  });

  return {
    stripe,
    webhookSecret: billing.stripeWebhookSecret?.trim() || undefined,
    publishableKeyConfigured: !!billing.stripePublishableKey?.trim(),
    runtimeTarget: readLogicstarterRuntimeTarget(),
  } as const;
}

export async function createLogicstarterCheckoutSession(input: LogicstarterCheckoutInput) {
  const { stripe, publishableKeyConfigured, runtimeTarget } = await getStripeRuntime();
  const priceId = requireConfigured(input.priceId, "priceId is required.");
  const successUrl = normalizeAbsoluteUrl(input.successUrl, "successUrl");
  const cancelUrl = normalizeAbsoluteUrl(input.cancelUrl, "cancelUrl");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    client_reference_id: input.metadata?.userId,
    customer_email: input.customerEmail?.trim() || undefined,
    allow_promotion_codes: true,
    metadata: input.metadata,
  });

  return {
    id: session.id,
    url: session.url,
    publishableKeyConfigured,
    runtimeTarget,
  };
}

export async function verifyLogicstarterStripeWebhook(request: Request) {
  const signature = request.headers.get("stripe-signature")?.trim();
  if (!signature) {
    throw new Error("Missing Stripe signature header.");
  }

  const { stripe, webhookSecret, runtimeTarget } = await getStripeRuntime();
  const verifiedWebhookSecret = requireConfigured(
    webhookSecret,
    "STRIPE_WEBHOOK_SECRET is required before using the Logicstarter billing webhook.",
  );
  const payload = await request.text();
  const event = await stripe.webhooks.constructEventAsync(payload, signature, verifiedWebhookSecret);

  return {
    event,
    runtimeTarget,
  };
}

export async function createLogicstarterBillingPortalSession(
  input: { ownerId: string; returnUrl: string },
  runtimeContext?: LogicstarterCloudflareRuntimeContext,
) {
  const { stripe, runtimeTarget } = await getStripeRuntime();
  const store = createLogicstarterBillingStateStore(runtimeContext);
  const returnUrl = normalizeAbsoluteUrl(input.returnUrl, "returnUrl");
  const stripeCustomerId = await store.getStripeCustomerIdByOwner({
    ownerType: "user",
    ownerId: input.ownerId,
  });

  if (!stripeCustomerId) {
    throw new Error("No Stripe customer is linked to the current Logicstarter account yet.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return {
    runtimeTarget,
    url: session.url,
  };
}

async function syncLogicstarterSubscriptionFromStripe(
  stripe: LogicstarterStripe,
  input: { ownerId: string; ownerType: "user"; stripeCustomerId: string; stripeSubscriptionId: string },
  runtimeContext?: LogicstarterCloudflareRuntimeContext,
) {
  const store = createLogicstarterBillingStateStore(runtimeContext);
  const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId) as unknown as {
    current_period_end?: number | null;
    id: string;
    items?: { data?: Array<{ price?: { id?: string | null } | null }> } | null;
    status?: string | null;
  };

  await store.upsertSubscription({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    priceId: subscription.items?.data?.[0]?.price?.id ?? null,
    status: subscription.status ?? null,
    currentPeriodEnd: typeof subscription.current_period_end === "number"
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
  });
}

export async function syncLogicstarterBillingState(
  input: { ownerId: string; ownerEmail?: string | null },
  runtimeContext?: LogicstarterCloudflareRuntimeContext,
) {
  const { stripe, runtimeTarget } = await getStripeRuntime();
  const store = createLogicstarterBillingStateStore(runtimeContext);
  const owner = {
    ownerType: "user" as const,
    ownerId: input.ownerId,
    email: input.ownerEmail ?? null,
  };

  let stripeCustomerId = await store.getStripeCustomerIdByOwner(owner);

  if (!stripeCustomerId && owner.email) {
    const customers = await stripe.customers.list({
      email: owner.email,
      limit: 5,
    });
    const customer = customers.data.find((candidate) => !candidate.deleted && typeof candidate.id === "string");

    if (customer?.id) {
      stripeCustomerId = customer.id;
      await store.upsertCustomer({
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        email: owner.email,
        stripeCustomerId,
      });
    }
  }

  if (!stripeCustomerId) {
    await store.clearSubscriptionByOwner(owner);
    return {
      linkedCustomer: false,
      runtimeTarget,
      synced: true,
    };
  }

  const customer = await stripe.customers.retrieve(stripeCustomerId) as unknown as {
    deleted?: boolean;
    email?: string | null;
    id: string;
  };

  if (customer.deleted) {
    await store.clearSubscriptionByOwner(owner);
    await store.clearCustomerByOwner(owner);
    return {
      linkedCustomer: false,
      runtimeTarget,
      synced: true,
    };
  }

  await store.upsertCustomer({
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
    email: customer.email ?? owner.email,
    stripeCustomerId: customer.id,
  });

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    limit: 10,
    status: "all",
  });
  const preferredSubscription = subscriptions.data.find((subscription) => subscription.status !== "canceled") ?? subscriptions.data[0];

  if (!preferredSubscription?.id) {
    await store.clearSubscriptionByOwner(owner);
    return {
      linkedCustomer: true,
      runtimeTarget,
      synced: true,
      stripeCustomerId: customer.id,
      subscriptionLinked: false,
    };
  }

  await syncLogicstarterSubscriptionFromStripe(stripe, {
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: preferredSubscription.id,
  }, runtimeContext);

  return {
    linkedCustomer: true,
    runtimeTarget,
    synced: true,
    stripeCustomerId: customer.id,
    subscriptionLinked: true,
    stripeSubscriptionId: preferredSubscription.id,
  };
}

export async function processLogicstarterStripeWebhook(
  request: Request,
  runtimeContext?: LogicstarterCloudflareRuntimeContext,
) {
  const { event, runtimeTarget } = await verifyLogicstarterStripeWebhook(request);
  const { stripe } = await getStripeRuntime();
  const store = createLogicstarterBillingStateStore(runtimeContext);
  const accepted = await store.markWebhookProcessed(event.id, event.type);

  if (!accepted) {
    return {
      accepted: false,
      event,
      runtimeTarget,
    };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      customer?: string | null;
      customer_email?: string | null;
      metadata?: Record<string, string> | null;
      subscription?: string | null;
    };
    const userId = session.metadata?.userId?.trim();
    const stripeCustomerId = session.customer?.trim();

    if (userId && stripeCustomerId) {
      await store.upsertCustomer({
        ownerType: "user",
        ownerId: userId,
        email: session.customer_email ?? null,
        stripeCustomerId,
      });

      const stripeSubscriptionId = session.subscription?.trim();
      if (stripeSubscriptionId) {
        await syncLogicstarterSubscriptionFromStripe(stripe, {
          ownerType: "user",
          ownerId: userId,
          stripeCustomerId,
          stripeSubscriptionId,
        }, runtimeContext);
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as {
      metadata?: Record<string, string> | null;
    };
    const userId = session.metadata?.userId?.trim();
    if (userId) {
      await store.clearSubscriptionByOwner({
        ownerType: "user",
        ownerId: userId,
      });
    }
  }

  if (
    event.type === "customer.subscription.created"
    || event.type === "customer.subscription.updated"
    || event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as {
      id: string;
      customer: string;
      status?: string | null;
      current_period_end?: number | null;
      items?: { data?: Array<{ price?: { id?: string | null } | null }> } | null;
    };
    const owner = await store.getOwnerByStripeCustomerId(subscription.customer);

    if (owner) {
      if (event.type === "customer.subscription.deleted") {
        await store.clearSubscriptionByOwner(owner);
      } else {
        await store.upsertSubscription({
          ownerType: owner.ownerType,
          ownerId: owner.ownerId,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          priceId: subscription.items?.data?.[0]?.price?.id ?? null,
          status: subscription.status ?? null,
          currentPeriodEnd: typeof subscription.current_period_end === "number"
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        });
      }
    }
  }

  if (event.type === "customer.updated") {
    const customer = event.data.object as {
      deleted?: boolean;
      email?: string | null;
      id: string;
    };
    const owner = await store.getOwnerByStripeCustomerId(customer.id);

    if (owner) {
      if (customer.deleted) {
        await store.clearSubscriptionByOwner(owner);
        await store.clearCustomerByOwner(owner);
      } else {
        await store.upsertCustomer({
          ownerType: owner.ownerType,
          ownerId: owner.ownerId,
          email: customer.email ?? owner.email ?? null,
          stripeCustomerId: customer.id,
        });
      }
    }
  }

  if (event.type === "customer.deleted") {
    const customer = event.data.object as {
      id: string;
    };
    const owner = await store.getOwnerByStripeCustomerId(customer.id);

    if (owner) {
      await store.clearSubscriptionByOwner(owner);
      await store.clearCustomerByOwner(owner);
    }
  }

  return {
    accepted: true,
    event,
    runtimeTarget,
  };
}

export function isLogicstarterWorkerBillingRouteAvailable() {
  const billing = readLogicstarterProviderConfig().billing;
  return !!billing.stripeSecretKey?.trim() && !!billing.stripeWebhookSecret?.trim();
}
