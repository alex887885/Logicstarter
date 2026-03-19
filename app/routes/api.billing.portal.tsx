import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { createLogicstarterBillingPortalSession } from "~/lib/logicstarter/billing.server";

type BillingPortalRequest = {
  returnUrl?: string;
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

  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json() as BillingPortalRequest;

  try {
    const portal = await createLogicstarterBillingPortalSession({
      ownerId: session.user.id,
      returnUrl: String(payload.returnUrl ?? ""),
    }, context);

    return Response.json({
      ok: true,
      portal,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to create a Stripe billing portal session.",
    }, { status: 400 });
  }
}
