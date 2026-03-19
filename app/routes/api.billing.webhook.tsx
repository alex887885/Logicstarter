import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { processLogicstarterStripeWebhook } from "~/lib/logicstarter/billing.server";

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

  try {
    const result = await processLogicstarterStripeWebhook(request, context);

    return Response.json({
      ok: true,
      runtimeTarget: result.runtimeTarget,
      received: true,
      accepted: result.accepted,
      event: {
        id: result.event.id,
        type: result.event.type,
      },
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to verify the Stripe webhook payload.",
    }, { status: 400 });
  }
}
