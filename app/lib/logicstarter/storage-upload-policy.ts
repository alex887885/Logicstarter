export const logicstarterStorageMaxUploadBytes = 10 * 1024 * 1024;

export const logicstarterStorageAllowedContentTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/json",
  "text/plain",
  "text/markdown",
] as const;

export const logicstarterStorageUploadAccept = [
  ...logicstarterStorageAllowedContentTypes,
  ".md",
].join(",");

export const logicstarterStorageUploadPolicyLabel = "images, PDF, JSON, text; max 10 MB";
