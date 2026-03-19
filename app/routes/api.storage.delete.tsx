import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { logicstarter } from "~/lib/logicstarter/index.server";

export async function loader(_: LoaderFunctionArgs) {
  return Response.json({ ok: false, error: "Method not allowed." }, {
    status: 405,
    headers: {
      Allow: "POST",
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        Allow: "POST",
      },
    });
  }

  const session = await (await getLogicstarterAuth(request)).api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const { key } = await request.json() as { key?: string };
  const normalizedKey = String(key ?? "").trim();

  if (!normalizedKey) {
    return Response.json({ ok: false, error: "Storage key is required." }, { status: 400 });
  }

  await logicstarter().storage.deleteObject({ key: normalizedKey });
  return Response.json({ ok: true, key: normalizedKey });
}
