import type { SkinProfile, TryOnResult } from "../types";
import { YouCamApiError } from "./errors";

// Verified official envelope:
// submit: { status: number, data: { task_id: string } }
// poll:   { status: number, data: { task_status, error, results } }
// Live-verified task_status values: "running" | "success" | "error"
// (docs also mention "failed"; any value that is not running/success,
//  or a non-empty error, is treated as failed → fail fast).

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dataOf(raw: unknown): Record<string, unknown> {
  const root = isRecord(raw) ? raw : {};
  return isRecord(root.data) ? root.data : root;
}

function errorMessageOf(data: Record<string, unknown>): string {
  return typeof data.error === "string" && data.error.trim()
    ? data.error.trim()
    : "";
}

export function extractTaskId(raw: unknown): string | undefined {
  const data = dataOf(raw);
  return typeof data.task_id === "string" ? data.task_id : undefined;
}

export type SkinPollOutcome =
  | { status: "running" }
  | { status: "failed"; error: string }
  | { status: "success"; profile: SkinProfile };

export function normalizeSkinPoll(raw: unknown): SkinPollOutcome {
  const data = dataOf(raw);
  const taskStatus =
    typeof data.task_status === "string" ? data.task_status : undefined;
  const errorMessage = errorMessageOf(data);

  if (taskStatus === "success" && !errorMessage) {
    const results = isRecord(data.results) ? data.results : {};
    const scoreInfo = isRecord(results.score_info) ? results.score_info : {};

    const uiScore = (key: string): number | undefined => {
      const entry = scoreInfo[key];
      return isRecord(entry) && typeof entry.ui_score === "number"
        ? entry.ui_score
        : undefined;
    };

    let skinType: string | undefined;
    const skinTypeEntry = scoreInfo.hd_skin_type;
    if (typeof skinTypeEntry === "string") {
      skinType = skinTypeEntry;
    } else if (isRecord(skinTypeEntry)) {
      for (const region of ["whole", "t_zone", "u_zone"]) {
        const regionValue = skinTypeEntry[region];
        if (typeof regionValue === "string") {
          skinType = regionValue;
          break;
        }
      }
    }

    return {
      status: "success",
      profile: {
        skinType,
        radiance: uiScore("hd_radiance"),
        redness: uiScore("hd_redness"),
        texture: uiScore("hd_texture"),
        moisture: uiScore("hd_moisture"),
      },
    };
  }

  if (taskStatus === "running" && !errorMessage) {
    return { status: "running" };
  }

  // "error", "failed", or unexpected status → fail fast with API message.
  return {
    status: "failed",
    error:
      errorMessage ||
      `YouCam skin task did not complete (status: ${taskStatus ?? "unknown"}).`,
  };
}

export function normalizeVtoSubmission(
  raw: unknown,
  garmentId: string
): TryOnResult {
  const taskId = extractTaskId(raw);

  if (!taskId) {
    throw new YouCamApiError({
      code: "malformed_response",
      message: "YouCam VTO submit response missing data.task_id",
      retryable: false,
    });
  }

  return {
    id: taskId,
    garmentId,
    status: "processing",
    providerJobId: taskId,
  };
}

export function normalizeVtoStatus(
  raw: unknown,
  garmentId: string,
  jobId: string
): TryOnResult {
  const data = dataOf(raw);
  const taskStatus =
    typeof data.task_status === "string" ? data.task_status : undefined;
  const errorMessage = errorMessageOf(data);

  if (taskStatus === "success" && !errorMessage) {
    const results = isRecord(data.results) ? data.results : {};
    const url = typeof results.url === "string" ? results.url : undefined;

    if (!url) {
      return {
        id: jobId,
        garmentId,
        status: "failed",
        error: "YouCam VTO succeeded but results.url is missing.",
        providerJobId: jobId,
      };
    }

    return {
      id: jobId,
      garmentId,
      status: "completed",
      imageUrl: url,
      providerJobId: jobId,
    };
  }

  if (taskStatus === "running" && !errorMessage) {
    return { id: jobId, garmentId, status: "processing", providerJobId: jobId };
  }

  return {
    id: jobId,
    garmentId,
    status: "failed",
    error:
      errorMessage ||
      `YouCam VTO task did not complete (status: ${taskStatus ?? "unknown"}).`,
    providerJobId: jobId,
  };
}