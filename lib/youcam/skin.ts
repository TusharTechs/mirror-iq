import { getConfig } from "./config";
import { youcamRequest, parseYouCamJsonOrImage, bufferToBlob } from "./client";
import { normalizeSkin } from "./normalize";
import type { SkinProfile } from "../types";

export async function analyzeSkin(
  image: Buffer,
  mimeType: string,
  signal?: AbortSignal
): Promise<SkinProfile> {
  const cfg = getConfig();

  const body = new FormData();

  body.append(
  cfg.skinImageField,
  bufferToBlob(image, mimeType),
  "photo.jpg"
  );

  const res = await youcamRequest(
    cfg.skinPath,
    {
      method: "POST",
      body,
    },
    "/api/skin",
    signal
  );

  const parsed = await parseYouCamJsonOrImage(res);

  return normalizeSkin(parsed);
}