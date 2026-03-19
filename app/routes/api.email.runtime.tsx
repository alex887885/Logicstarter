import type { LoaderFunctionArgs } from "react-router";
import { getLogicstarterEmailRuntimeSnapshot } from "~/lib/logicstarter/provider-runtime.server";

export async function loader(_: LoaderFunctionArgs) {
  const { provider, snapshot } = await getLogicstarterEmailRuntimeSnapshot();

  return Response.json({
    ok: true,
    provider,
    snapshot,
  });
}
