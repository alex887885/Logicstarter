import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { syncLogicstarterBillingState } from "~/lib/logicstarter/billing.server";

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

  try {
    const result = await syncLogicstarterBillingState({
      ownerId: session.user.id,
      ownerEmail: session.user.email ?? null,
    }, context);

    return Response.json({
      ok: true,
      sync: result,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to synchronize billing state from Stripe.",
    }, { status: 400 });
  }
}
