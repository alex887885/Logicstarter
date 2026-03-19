import type { LoaderFunctionArgs } from "react-router";
import {
  createLogicstarterStorageProvider,
  getLogicstarterStorageRuntimeSnapshot,
} from "~/lib/logicstarter/storage.server";
import {
  logicstarterStorageAllowedContentTypes,
  logicstarterStorageMaxUploadBytes,
  logicstarterStorageUploadAccept,
  logicstarterStorageUploadPolicyLabel,
} from "~/lib/logicstarter/storage-upload-policy";

export async function loader(_: LoaderFunctionArgs) {
  const storage = createLogicstarterStorageProvider();
  const snapshot = getLogicstarterStorageRuntimeSnapshot();
  const uploadPolicy = {
    maxUploadBytes: logicstarterStorageMaxUploadBytes,
    contentTypes: logicstarterStorageAllowedContentTypes,
    accept: logicstarterStorageUploadAccept,
    label: logicstarterStorageUploadPolicyLabel,
  };

  try {
    await storage.validateConfig();
    return Response.json({
      ok: true,
      provider: storage.provider,
      snapshot,
      capabilities: snapshot.capabilities,
      uploadPolicy,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      provider: storage.provider,
      snapshot,
      capabilities: snapshot.capabilities,
      uploadPolicy,
      error: error instanceof Error ? error.message : "Unable to validate Logicstarter storage runtime.",
    }, { status: 400 });
  }
}
