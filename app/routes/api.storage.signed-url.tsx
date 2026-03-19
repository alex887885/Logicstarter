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

  const payload = await request.json() as {
    key?: string;
    method?: "GET" | "PUT" | string;
    expiresInSeconds?: number;
    contentType?: string;
  };

  const key = String(payload.key ?? "").trim();
  const method = payload.method === "PUT" ? "PUT" : payload.method === "GET" || payload.method == null ? "GET" : null;
  const expiresInSeconds = typeof payload.expiresInSeconds === "number"
    ? Math.max(60, Math.min(3600, Math.floor(payload.expiresInSeconds)))
    : 900;
  const contentType = typeof payload.contentType === "string" ? payload.contentType.trim() || undefined : undefined;

  if (!key) {
    return Response.json({ ok: false, error: "Storage key is required." }, { status: 400 });
  }

  if (!method) {
    return Response.json({ ok: false, error: "Signed URL method must be GET or PUT." }, { status: 400 });
  }

  try {
    const result = await logicstarter().storage.getSignedUrl({
      key,
      method,
      expiresInSeconds,
      contentType,
    });

    return Response.json({
      ok: true,
      key,
      method,
      expiresInSeconds,
      url: result.url,
      expiresAt: result.expiresAt?.toISOString() ?? null,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to create a signed storage URL.",
    }, { status: 400 });
  }
}
