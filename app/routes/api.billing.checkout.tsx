import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { createLogicstarterCheckoutSession } from "~/lib/logicstarter/billing.server";

type BillingCheckoutRequest = {
  cancelUrl?: string;
  priceId?: string;
  successUrl?: string;
};

export async function loader(_: LoaderFunctionArgs) {
  return Response.json({ ok: false, error: "Method not allowed." }, {
    status: 405,
    headers: {
      Allow: "POST",
    },
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        Allow: "POST",
      },
    });
  }

  const session = await (await getLogicstarterAuth(request, context)).api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id || !session.user.email) {
    return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json() as BillingCheckoutRequest;

  try {
    const checkout = await createLogicstarterCheckoutSession({
      cancelUrl: String(payload.cancelUrl ?? ""),
      customerEmail: session.user.email,
      metadata: {
        logicstarterRuntime: "billing_api",
        userEmail: session.user.email,
        userId: session.user.id,
      },
      priceId: String(payload.priceId ?? ""),
      successUrl: String(payload.successUrl ?? ""),
    });

    return Response.json({
      ok: true,
      checkout,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to create a Stripe checkout session.",
    }, { status: 400 });
  }
}
