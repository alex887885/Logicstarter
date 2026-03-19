import type { LoaderFunctionArgs } from "react-router";
import { getLogicstarterSmsRuntimeSnapshot } from "~/lib/logicstarter/provider-runtime.server";

export async function loader(_: LoaderFunctionArgs) {
  const { provider, snapshot } = await getLogicstarterSmsRuntimeSnapshot();

  return Response.json({
    ok: true,
    provider,
    snapshot,
  });
}
