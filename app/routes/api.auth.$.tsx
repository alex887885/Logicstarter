import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { readLogicstarterRuntimeTarget } from "~/lib/logicstarter/config.server";

function getLogicstarterStripeRuntimeGuardResponse(request: Request) {
  const pathname = new URL(request.url).pathname;

  if (!pathname.startsWith("/api/auth/stripe")) {
    return null;
  }

  const runtimeTarget = readLogicstarterRuntimeTarget();
  if (runtimeTarget === "node") {
    return null;
  }

  return Response.json({
    ok: false,
    error: `Stripe billing routes are not yet Worker-safe on ${runtimeTarget}.`,
    runtimeTarget,
    serverPathMode: "worker_unsupported",
  }, { status: 503 });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const guardResponse = getLogicstarterStripeRuntimeGuardResponse(request);
  if (guardResponse) {
    return guardResponse;
  }

  return (await getLogicstarterAuth(request, context)).handler(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const guardResponse = getLogicstarterStripeRuntimeGuardResponse(request);
  if (guardResponse) {
    return guardResponse;
  }

  return (await getLogicstarterAuth(request, context)).handler(request);
}
