import { YouCamApiError } from "./errors";

export type YouCamConfig = {
  baseUrl: string;
  apiKey: string;
  authStyle: "bearer" | "x-api-key";
  timeoutMs: number;

  skinPath: string;
  skinImageField: string;

  vtoSubmitPath: string;
  vtoStatusPathTemplate: string;
  vtoPersonImageField: string;
  vtoGarmentImageField: string;
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new YouCamApiError({
      code: "config_missing",
      message: `Missing required YouCam env var: ${name}. Set it in .env.local or enable DEMO_MODE=true.`,
      retryable: false,
    });
  }

  return value;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function getConfig(): YouCamConfig {
  const authStyle =
    process.env.YOUCAM_AUTH_STYLE === "x-api-key" ? "x-api-key" : "bearer";

  const timeoutRaw = Number(process.env.YOUCAM_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(timeoutRaw) ? timeoutRaw : 45000;

  return {
    baseUrl: required("YOUCAM_BASE_URL"),
    apiKey: required("YOUCAM_API_KEY"),
    authStyle,
    timeoutMs,

    skinPath: required("YOUCAM_SKIN_PATH"),
    skinImageField: process.env.YOUCAM_SKIN_IMAGE_FIELD || "image",

    vtoSubmitPath: required("YOUCAM_VTO_SUBMIT_PATH"),
    vtoStatusPathTemplate: required("YOUCAM_VTO_STATUS_PATH_TEMPLATE"),
    vtoPersonImageField:
      process.env.YOUCAM_VTO_PERSON_IMAGE_FIELD || "personImage",
    vtoGarmentImageField:
      process.env.YOUCAM_VTO_GARMENT_IMAGE_FIELD || "garmentImage",
  };
}