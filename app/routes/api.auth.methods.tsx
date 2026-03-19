import type { LoaderFunctionArgs } from "react-router";
import { listEnabledLogicstarterAuthMethods } from "~/lib/logicstarter/auth-methods.server";

export async function loader(_: LoaderFunctionArgs) {
  return Response.json({
    methods: listEnabledLogicstarterAuthMethods(),
  });
}
