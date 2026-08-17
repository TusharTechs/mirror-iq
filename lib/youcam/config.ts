import { YouCamApiError } from "./errors";

export type YouCamConfig = {
  baseUrl: string;
  apiKey: string;
  authStyle: "bearer" | "x-api-key";
  timeoutMs: number;
  vtoSubmitPath: string;
  vtoStatusPathTemplate: string;
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
    vtoSubmitPath: required("YOUCAM_VTO_SUBMIT_PATH"),
    vtoStatusPathTemplate: required("YOUCAM_VTO_STATUS_PATH_TEMPLATE"),
  };
}