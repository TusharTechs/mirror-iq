import type { TryOnResult } from "../types";
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