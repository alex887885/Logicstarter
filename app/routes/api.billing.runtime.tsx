import type { LoaderFunctionArgs } from "react-router";
import { getLogicstarterBillingRuntimeSnapshot, getLogicstarterBillingRuntimeStatus } from "~/lib/logicstarter/provider-runtime.server";

export async function loader(_: LoaderFunctionArgs) {
  const snapshot = await getLogicstarterBillingRuntimeSnapshot();
  const status = getLogicstarterBillingRuntimeStatus(snapshot);

  return Response.json({
    ok: true,
    provider: "stripe",
    attention: status.attention,
    remediation: status.remediation,
    runtimeHealth: status.runtimeHealth,
    checkoutReadiness: status.checkoutReadiness,
    webhookReadiness: status.webhookReadiness,
    snapshot,
  });
}
