import { YouCamApiError } from "./errors";
import { getConfig } from "./config";
import { logServer } from "../log";
import { getImageDimensions } from "../images/dimensions";

// Official YouCam file upload flow:
// 1. POST /s2s/v2.0/file with metadata → get file_id + presigned S3 URL
// 2. PUT binary image to presigned URL with exact headers from step 1
// 3. Return file_id for use as src_file_id or ref_file_id in AI tasks

export async function uploadToYouCam(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const cfg = getConfig();
  const fileSize = buffer.length;

  // Step 1: Initiate upload
  const initBody = {
    files: [
      {
        content_type: mimeType,
        file_name: filename,
        file_size: fileSize,
      },
    ],
  };

  logServer("youcam.upload.init", {
    filename,
    mimeType,
    fileSize,
    dimensions: getImageDimensions(buffer),
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (cfg.authStyle === "bearer") {
    headers.Authorization = `Bearer ${cfg.apiKey}`;
  } else {
    headers["x-api-key"] = cfg.apiKey;
  }

  const initRes = await fetch(`${cfg.baseUrl}/s2s/v2.0/file`, {
    method: "POST",
    headers,
    body: JSON.stringify(initBody),
  });

  if (!initRes.ok) {
    const errorText = await initRes.text().catch(() => "");
    throw new YouCamApiError({
      code: "request_failed",
      message: `File upload init failed: ${initRes.status} ${errorText}`,
      status: initRes.status,
      retryable: initRes.status >= 500 || initRes.status === 429,
    });
  }

  const initJson = await initRes.json().catch(() => ({}));
  const root = initJson as Record<string, unknown>;
  const data =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : root;

  const files = Array.isArray(data.files) ? data.files : [];
  const firstFile = files[0] as Record<string, unknown> | undefined;

  if (!firstFile) {
    throw new YouCamApiError({
      code: "malformed_response",
      message: "File upload init response missing data.files[0]",
      retryable: false,
    });
  }

  const fileId =
    typeof firstFile.file_id === "string" ? firstFile.file_id : undefined;
  const requests = Array.isArray(firstFile.requests) ? firstFile.requests : [];
  const firstRequest = requests[0] as Record<string, unknown> | undefined;

  if (!fileId || !firstRequest) {
    throw new YouCamApiError({
      code: "malformed_response",
      message: "File upload init response missing file_id or requests[0]",
      retryable: false,
    });
  }

  const putUrl =
    typeof firstRequest.url === "string" ? firstRequest.url : undefined;
  const putMethod =
    typeof firstRequest.method === "string" ? firstRequest.method : "PUT";
  const putHeaders =
    (firstRequest.headers as Record<string, string> | undefined) ?? {};

  if (!putUrl || putMethod.toUpperCase() !== "PUT") {
    throw new YouCamApiError({
      code: "malformed_response",
      message: "File upload init did not return a PUT URL",
      retryable: false,
    });
  }

  logServer("youcam.upload.presigned", { fileId, putMethod });

  // Step 2: PUT binary to presigned S3 URL.
  // Copy into Uint8Array<ArrayBuffer> so it satisfies TS 5.7 BodyInit typings.
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: putHeaders,
    body: new Uint8Array(buffer),
  });

  if (!putRes.ok) {
    const errorText = await putRes.text().catch(() => "");
    throw new YouCamApiError({
      code: "request_failed",
      message: `S3 upload failed: ${putRes.status} ${errorText}`,
      status: putRes.status,
      retryable: putRes.status >= 500,
    });
  }

  logServer("youcam.upload.success", { fileId });

  return fileId;
}