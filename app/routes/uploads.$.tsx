import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import type { LoaderFunctionArgs } from "react-router";
import {
  getLogicstarterStorageContentType,
  getLogicstarterStorageRuntimeSnapshot,
  resolveLogicstarterLocalStoragePath,
} from "~/lib/logicstarter/storage.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const wildcard = typeof params["*"] === "string" ? params["*"] : "";
  if (!wildcard) {
    throw new Response("Not found", { status: 404 });
  }

  const snapshot = getLogicstarterStorageRuntimeSnapshot();
  if (snapshot.provider !== "local") {
    throw new Response("Not found", { status: 404 });
  }

  let absolutePath: string;
  try {
    absolutePath = resolveLogicstarterLocalStoragePath(wildcard);
  } catch {
    throw new Response("Not found", { status: 404 });
  }

  try {
    await access(absolutePath, constants.R_OK);
  } catch {
    throw new Response("Not found", { status: 404 });
  }

  const body = await readFile(absolutePath);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": getLogicstarterStorageContentType(absolutePath),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
