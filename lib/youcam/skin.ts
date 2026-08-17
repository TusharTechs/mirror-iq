import { getConfig } from "./config";
import { youcamRequest, parseYouCamJsonOrImage } from "./client";
import { normalizeSkinPoll, extractTaskId, type SkinPollOutcome } from "./normalize";
import { uploadToYouCam } from "./upload";
import { logResponseShape } from "./shape";
import { YouCamApiError } from "./errors";
import { logServer } from "../log";

export async function submitSkinAnalysis(
  image: Buffer,
  mimeType: string,
  signal?: AbortSignal
): Promise<string> {
  const cfg = getConfig();

  const fileId = await uploadToYouCam(image, mimeType, "photo.jpg");

  const body = {
    src_file_id: fileId,
    dst_actions: ["skin_type", "radiance", "redness", "texture", "moisture"],
  };

  const res = await youcamRequest(
    cfg.skinPath,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "/api/skin",
    signal
  );

  const parsed = await parseYouCamJsonOrImage(res);
  logResponseShape("/api/skin[submit]", parsed);

  const taskId = extractTaskId(parsed);

  if (!taskId) {
    throw new YouCamApiError({
      code: "malformed_response",
      message: "YouCam Skin submit response missing data.task_id",
      retryable: false,
    });
  }

  return taskId;
}

export async function pollSkinAnalysis(
  taskId: string,
  signal?: AbortSignal
): Promise<SkinPollOutcome> {
  const cfg = getConfig();

  // Verified: path parameter, not query string.
  const pathname = `${cfg.skinStatusPathTemplate}/${encodeURIComponent(taskId)}`;

  const res = await youcamRequest(
    pathname,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    "/api/skin/status",
    signal
  );

  const parsed = await parseYouCamJsonOrImage(res);
  logResponseShape("/api/skin[poll]", parsed);

  const outcome = normalizeSkinPoll(parsed);

  // The provider's error string is a diagnostic message about the task
  // (e.g. "no face detected"), not user data — worth logging on failure
  // since the shape logger above intentionally omits all values.
  if (outcome.status === "failed") {
    logServer("youcam.skin.failed", { taskId, error: outcome.error });
  }

  return outcome;
}