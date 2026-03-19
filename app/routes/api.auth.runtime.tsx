import type { LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuthRuntimeSnapshot } from "~/lib/logicstarter/provider-runtime.server";

export async function loader(_: LoaderFunctionArgs) {
  const { provider, snapshot } = await getLogicstarterAuthRuntimeSnapshot();

  return Response.json({
    ok: true,
    provider,
    snapshot,
  });
}
