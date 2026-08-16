import { getConfig, type YouCamConfig } from "./config";
import { YouCamApiError } from "./errors";
import { logServer } from "../log";

function buildHeaders(cfg: YouCamConfig): Record<string, string> {
  if (cfg.authStyle === "x-api-key") {
    return {
      "x-api-key": cfg.apiKey,
    };
  }

  return {
    Authorization: `Bearer ${cfg.apiKey}`,
  };
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort);
    }
  }

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch {
    if (externalSignal?.aborted) {
      throw new YouCamApiError({
        code: "cancelled",
        message: "YouCam request cancelled.",
        retryable: false,
      });
    }

    if (timedOut) {
      throw new YouCamApiError({
        code: "timeout",
        message: "YouCam API request timed out.",
        retryable: true,
      });
    }

    throw new YouCamApiError({
      code: "request_failed",
      message: "Unable to reach YouCam API.",
      retryable: true,
    });
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

export async function youcamRequest(
  pathname: string,
  init: RequestInit,
  route: string,
  externalSignal?: AbortSignal
): Promise<Response> {
  const started = Date.now();
  const cfg = getConfig();

  const url = new URL(pathname, cfg.baseUrl).toString();
  const headers = buildHeaders(cfg);

  try {
    const res = await fetchWithTimeout(
      url,
      {
        ...init,
        headers,
      },
      cfg.timeoutMs,
      externalSignal
    );

    logServer("youcam.request", {
      route,
      pathname,
      status: res.status,
      durationMs: Date.now() - started,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");

      const code =
        res.status === 401 || res.status === 403
          ? "auth_failed"
          : res.status === 429
            ? "rate_limited"
            : "request_failed";

      const retryable = res.status === 429 || res.status >= 500;

      throw new YouCamApiError({
        code,
        message: body
          ? `YouCam API returned ${res.status}: ${truncate(body, 300)}`
          : `YouCam API returned ${res.status}.`,
        status: res.status,
        retryable,
      });
    }

    return res;
  } catch (error) {
    if (error instanceof YouCamApiError) {
      logServer("youcam.error", {
        route,
        pathname,
        code: error.code,
        status: error.status,
        durationMs: Date.now() - started,
      });

      throw error;
    }

    logServer("youcam.error", {
      route,
      pathname,
      code: "request_failed",
      durationMs: Date.now() - started,
    });

    throw new YouCamApiError({
      code: "request_failed",
      message: "Unable to reach YouCam API.",
      retryable: true,
    });
  }
}

export async function parseYouCamJsonOrImage(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  if (contentType.startsWith("image/")) {
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      __binaryImageBase64: base64,
      __contentType: contentType,
    };
  }

  const text = await res.text().catch(() => "");

  try {
    return JSON.parse(text);
  } catch {
    return {
      __rawText: text,
    };
  }
}

export function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
  // Copy into a fresh Uint8Array<ArrayBuffer> so it satisfies BlobPart
  // under TypeScript 5.7+ generic ArrayBuffer typings.
  return new Blob([new Uint8Array(buffer)], { type: mimeType });
}