import type { LoaderFunctionArgs } from "react-router";
import { getLogicstarterProviderRuntimeOverview } from "~/lib/logicstarter/provider-runtime.server";

export async function loader(_: LoaderFunctionArgs) {
  const { runtime, modules, summary } = await getLogicstarterProviderRuntimeOverview();

  return Response.json({
    ok: true,
    runtime,
    modules,
    summary,
  });
}
