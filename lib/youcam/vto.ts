import { getConfig } from "./config";
import { youcamRequest, parseYouCamJsonOrImage } from "./client";
import { normalizeVtoSubmission, normalizeVtoStatus } from "./normalize";
import { uploadToYouCam } from "./upload";
import { logResponseShape } from "./shape";
import type { TryOnResult } from "../types";

export async function submitApparelTryOn(
  input: {
    garmentId: string;
    personImage: Buffer;
    personMimeType: string;
    garmentImage: Buffer;
    garmentMimeType: string;
  },
  signal?: AbortSignal
): Promise<TryOnResult> {
  const cfg = getConfig();

  const personFileId = await uploadToYouCam(
    input.personImage,
    input.personMimeType,
    "person.jpg"
  );
  const garmentFileId = await uploadToYouCam(
    input.garmentImage,
    input.garmentMimeType,
    "garment.jpg"
  );

  const body = {
    src_file_id: personFileId,
    ref_file_id: garmentFileId,
    garment_category: "auto",
  };

  const res = await youcamRequest(
    cfg.vtoSubmitPath,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "/api/vto",
    signal
  );

  const parsed = await parseYouCamJsonOrImage(res);
  logResponseShape("/api/vto[submit]", parsed);

  return normalizeVtoSubmission(parsed, input.garmentId);
}

export async function getApparelTryOnStatus(
  input: {
    garmentId: string;
    jobId: string;
  },
  signal?: AbortSignal
): Promise<TryOnResult> {
  const cfg = getConfig();

  // Verified: path parameter, not query string.
  const pathname = `${cfg.vtoStatusPathTemplate}/${encodeURIComponent(input.jobId)}`;

  const res = await youcamRequest(
    pathname,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    "/api/vto/status",
    signal
  );

  const parsed = await parseYouCamJsonOrImage(res);
  logResponseShape("/api/vto/status", parsed);

  return normalizeVtoStatus(parsed, input.garmentId, input.jobId);
}