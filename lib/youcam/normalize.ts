import type { SkinProfile, TryOnResult } from "../types";
import { YouCamApiError } from "./errors";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstRecord(
  ...values: unknown[]
): Record<string, unknown> | undefined {
  for (const value of values) {
    if (isRecord(value)) return value;
    if (Array.isArray(value) && isRecord(value[0])) return value[0];
  }

  return undefined;
}

function pick(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const normalized = value.replace("%", "").trim();
    const n = Number(normalized);

    return Number.isFinite(n) ? n : undefined;
  }

  return undefined;
}

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function extractImageUrl(source: Record<string, unknown>): string | undefined {
  const binary = toNonEmptyString(source.__binaryImageBase64);
  const contentType = toNonEmptyString(source.__contentType) ?? "image/jpeg";

  if (binary) {
    return `data:${contentType};base64,${binary}`;
  }

  const url = toNonEmptyString(
    pick(source, [
      "imageUrl",
      "image_url",
      "resultImageUrl",
      "result_image_url",
      "outputImageUrl",
      "output_image_url",
      "resultUrl",
      "result_url",
      "url",
    ])
  );

  if (url) {
    return url;
  }

  const base64 = toNonEmptyString(
    pick(source, [
      "imageBase64",
      "image_base64",
      "base64Image",
      "base64",
      "resultImage",
      "result_image",
      "image",
    ])
  );

  if (base64) {
    if (base64.startsWith("data:")) {
      return base64;
    }

    if (!base64.startsWith("http") && base64.length > 100) {
      return `data:image/jpeg;base64,${base64}`;
    }
  }

  return undefined;
}

const PROCESSING_STATES = new Set([
  "processing",
  "pending",
  "queued",
  "running",
  "accepted",
  "submitted",
  "in_progress",
  "started",
]);

const FAILED_STATES = new Set([
  "failed",
  "error",
  "cancelled",
  "canceled",
  "timeout",
]);

export function normalizeSkin(raw: unknown): SkinProfile {
  const root = isRecord(raw) ? raw : {};

  const data =
    firstRecord(root.result, root.data, root.response, root.output, root) ??
    {};

  const faces = data.faces;
  const firstFace = Array.isArray(faces) ? faces[0] : undefined;
  const firstFaceRecord = isRecord(firstFace) ? firstFace : undefined;

  const attributes = isRecord(data.attributes) ? data.attributes : undefined;
  const faceAttributes =
    firstFaceRecord && isRecord(firstFaceRecord.attributes)
      ? firstFaceRecord.attributes
      : undefined;

  const skin =
    firstRecord(
      data.skin,
      data.skinAnalysis,
      data.skin_analysis,
      firstFaceRecord?.skin,
      attributes?.skin,
      faceAttributes?.skin,
      firstFaceRecord,
      data
    ) ?? {};

  const profile: SkinProfile = {
    skinType: toNonEmptyString(pick(skin, ["skinType", "skin_type", "type"])),
    radiance: toFiniteNumber(
      pick(skin, ["radiance", "radianceScore", "radiance_score", "glow"])
    ),
    redness: toFiniteNumber(
      pick(skin, ["redness", "rednessScore", "redness_score"])
    ),
    texture: toFiniteNumber(
      pick(skin, ["texture", "textureScore", "texture_score"])
    ),
    moisture: toFiniteNumber(
      pick(skin, ["moisture", "moistureScore", "moisture_score", "hydration"])
    ),
  };

  if (Object.values(profile).every((value) => value === undefined)) {
    throw new YouCamApiError({
      code: "malformed_response",
      message:
        "YouCam Skin response did not contain recognizable skin fields. Adjust lib/youcam/normalize.ts to match the official response.",
      retryable: false,
    });
  }

  return profile;
}

export function normalizeVtoSubmission(
  raw: unknown,
  garmentId: string
): TryOnResult {
  const id = randomId();

  const root = isRecord(raw) ? raw : {};
  const data = firstRecord(root.result, root.data, root.output, root) ?? {};

  const imageUrl = extractImageUrl(data);

  if (imageUrl) {
    return {
      id,
      garmentId,
      status: "completed",
      imageUrl,
    };
  }

  const jobId = toNonEmptyString(
    pick(data, [
      "jobId",
      "job_id",
      "taskId",
      "task_id",
      "requestId",
      "request_id",
      "id",
    ])
  );

  const status = toNonEmptyString(
    pick(data, [
      "status",
      "state",
      "jobStatus",
      "job_status",
      "taskStatus",
      "task_status",
    ])
  )?.toLowerCase();

  const errorMessage = toNonEmptyString(
    pick(data, ["message", "error", "errorMessage", "error_message"])
  );

  if (status && FAILED_STATES.has(status)) {
    return {
      id,
      garmentId,
      status: "failed",
      error: errorMessage ?? "YouCam processing failed.",
      providerJobId: jobId,
    };
  }

  if (jobId && (!status || PROCESSING_STATES.has(status))) {
    return {
      id,
      garmentId,
      status: "processing",
      providerJobId: jobId,
    };
  }

  if (status && ["completed", "succeeded", "success"].includes(status)) {
    return {
      id,
      garmentId,
      status: "failed",
      error:
        "YouCam reported completion but did not return an image. Adjust normalization to match official response.",
      providerJobId: jobId,
    };
  }

  throw new YouCamApiError({
    code: "malformed_response",
    message:
      "YouCam VTO response did not contain an image or a polling job id. Adjust lib/youcam/normalize.ts to match the official response.",
    retryable: false,
  });
}

export function normalizeVtoStatus(
  raw: unknown,
  garmentId: string,
  jobId: string
): TryOnResult {
  const root = isRecord(raw) ? raw : {};
  const data = firstRecord(root.result, root.data, root.output, root) ?? {};

  const imageUrl = extractImageUrl(data);

  if (imageUrl) {
    return {
      id: jobId,
      garmentId,
      status: "completed",
      imageUrl,
      providerJobId: jobId,
    };
  }

  const status = toNonEmptyString(
    pick(data, [
      "status",
      "state",
      "jobStatus",
      "job_status",
      "taskStatus",
      "task_status",
    ])
  )?.toLowerCase();

  const errorMessage = toNonEmptyString(
    pick(data, ["message", "error", "errorMessage", "error_message"])
  );

  if (status && FAILED_STATES.has(status)) {
    return {
      id: jobId,
      garmentId,
      status: "failed",
      error: errorMessage ?? "YouCam processing failed.",
      providerJobId: jobId,
    };
  }

  if (!status || PROCESSING_STATES.has(status)) {
    return {
      id: jobId,
      garmentId,
      status: "processing",
      providerJobId: jobId,
    };
  }

  if (["completed", "succeeded", "success"].includes(status)) {
    return {
      id: jobId,
      garmentId,
      status: "failed",
      error:
        "YouCam status reported completion but did not return an image. Adjust normalization to match official response.",
      providerJobId: jobId,
    };
  }

  throw new YouCamApiError({
    code: "malformed_response",
    message:
      "YouCam VTO status response was not recognizable. Adjust lib/youcam/normalize.ts to match the official response.",
    retryable: false,
  });
}