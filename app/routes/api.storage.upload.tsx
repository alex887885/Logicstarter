import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getLogicstarterAuth } from "~/lib/auth.server";
import { logicstarter } from "~/lib/logicstarter/index.server";
import {
  logicstarterStorageAllowedContentTypes,
  logicstarterStorageMaxUploadBytes,
} from "~/lib/logicstarter/storage-upload-policy";

const allowedContentTypes = new Set<string>(logicstarterStorageAllowedContentTypes);

function sanitizePrefix(value: string) {
  return value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .filter(Boolean)
    .join("/");
}

function sanitizeExtension(fileName: string, contentType: string) {
  const fromName = extname(fileName).toLowerCase();
  if (/^\.[a-z0-9]{1,10}$/.test(fromName)) {
    return fromName;
  }
  if (contentType === "image/png") return ".png";
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  if (contentType === "image/svg+xml") return ".svg";
  if (contentType === "application/pdf") return ".pdf";
  if (contentType === "application/json") return ".json";
  if (contentType.startsWith("text/")) return ".txt";
  return "";
}

export async function loader(_: LoaderFunctionArgs) {
  return Response.json({ ok: false, error: "Method not allowed. Use POST to upload files." }, {
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

  const formData = await request.formData();
  const fileEntry = formData.get("file");
  const prefix = sanitizePrefix(String(formData.get("prefix") ?? "uploads"));

  if (!(fileEntry instanceof File)) {
    return Response.json({ ok: false, error: "File is required." }, { status: 400 });
  }

  if (fileEntry.size <= 0) {
    return Response.json({ ok: false, error: "Empty files are not supported." }, { status: 400 });
  }

  if (fileEntry.size > logicstarterStorageMaxUploadBytes) {
    return Response.json({ ok: false, error: `Files larger than ${logicstarterStorageMaxUploadBytes} bytes are not supported.` }, { status: 400 });
  }

  if (!allowedContentTypes.has(fileEntry.type || "")) {
    return Response.json({ ok: false, error: "Unsupported file type." }, { status: 400 });
  }

  const extension = sanitizeExtension(fileEntry.name, fileEntry.type);
  if (!extension) {
    return Response.json({ ok: false, error: "Unable to determine a safe file extension for this upload." }, { status: 400 });
  }
  const baseName = fileEntry.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "") || "upload";
  const fileName = `${Date.now()}-${baseName}-${randomUUID()}${extension}`;
  const key = prefix ? `${prefix}/${fileName}` : fileName;
  const arrayBuffer = await fileEntry.arrayBuffer();

  const result = await logicstarter().storage.putObject({
    key,
    body: arrayBuffer,
    contentType: fileEntry.type || undefined,
  });

  return Response.json({
    ok: true,
    key: result.key,
    url: result.url ?? null,
    contentType: fileEntry.type || null,
    size: fileEntry.size,
  });
}
