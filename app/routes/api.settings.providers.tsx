import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  getLogicstarterProviderSettingsResponse,
  parseLogicstarterProviderSettingsRequest,
  resolveLogicstarterProviderSettingsCategory,
} from "~/lib/logicstarter/provider-settings-route.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = resolveLogicstarterProviderSettingsCategory(url.searchParams.get("category"));

  if (!category) {
    return Response.json(
      {
        error: "Invalid or missing provider settings category.",
      },
      { status: 400 },
    );
  }

  return Response.json(await getLogicstarterProviderSettingsResponse(category));
}

export async function action({ request }: ActionFunctionArgs) {
  const result = await parseLogicstarterProviderSettingsRequest(request);

  if (!result.ok) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
