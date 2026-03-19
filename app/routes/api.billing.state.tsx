import type { LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { createLogicstarterBillingStateStore } from "~/lib/logicstarter/billing-state.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const session = await (await getLogicstarterAuth(request, context)).api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const store = createLogicstarterBillingStateStore(context);
  const owner = {
    ownerType: "user" as const,
    ownerId: session.user.id,
    email: session.user.email ?? null,
  };
  const customer = await store.getCustomerByOwner(owner);
  const subscription = await store.getSubscriptionByOwner(owner);

  return Response.json({
    ok: true,
    billing: {
      linkedCustomer: !!customer?.stripeCustomerId,
      activeSubscription: !!subscription?.stripeSubscriptionId,
      customer,
      subscription,
    },
  });
}
