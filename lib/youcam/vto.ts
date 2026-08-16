import { getConfig } from "./config";
import { youcamRequest, parseYouCamJsonOrImage, bufferToBlob } from "./client";
import { normalizeVtoSubmission, normalizeVtoStatus } from "./normalize";
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

  const body = new FormData();

  body.append(
  cfg.vtoPersonImageField,
  bufferToBlob(input.personImage, input.personMimeType),
  "person.jpg"
  );

  body.append(
  cfg.vtoGarmentImageField,
  bufferToBlob(input.garmentImage, input.garmentMimeType),
  "garment.jpg"
  );

  const res = await youcamRequest(
    cfg.vtoSubmitPath,
    {
      method: "POST",
      body,
    },
    "/api/vto",
    signal
  );

  const parsed = await parseYouCamJsonOrImage(res);

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

  const pathname = cfg.vtoStatusPathTemplate.replaceAll(
    "{jobId}",
    encodeURIComponent(input.jobId)
  );

  const res = await youcamRequest(
    pathname,
    {
      method: "GET",
    },
    "/api/vto/status",
    signal
  );

  const parsed = await parseYouCamJsonOrImage(res);

  return normalizeVtoStatus(parsed, input.garmentId, input.jobId);
}