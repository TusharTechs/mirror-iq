import { NextResponse } from "next/server";
import { YouCamApiError } from "@/lib/youcam/errors";
import { logServer } from "@/lib/log";

function mapStatus(code: YouCamApiError["code"]): number {
  switch (code) {
    case "invalid_input":
      return 400;
    case "cancelled":
      return 400;
    case "config_missing":
      return 501;
    case "auth_failed":
      return 502;
    case "rate_limited":
      return 429;
    case "timeout":
      return 504;
    default:
      return 502;
  }
}

export function errorResponse(route: string, error: unknown, started: number) {
  const durationMs = Date.now() - started;

  if (error instanceof Error && error.name === "AbortError") {
    logServer("api.cancelled", {
      route,
      durationMs,
    });

    return NextResponse.json(
      {
        error: {
          code: "cancelled",
          message: "Request cancelled.",
          retryable: false,
        },
      },
      {
        status: 400,
      }
    );
  }

  if (error instanceof YouCamApiError) {
    const status = error.status ?? mapStatus(error.code);

    logServer("api.error", {
      route,
      code: error.code,
      status,
      durationMs,
    });

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
        },
      },
      {
        status,
      }
    );
  }

  const message =
    error instanceof Error && error.message
      ? error.message
      : "Unexpected server error.";

  logServer("api.error", {
    route,
    code: "unexpected",
    status: 500,
    durationMs,
  });

  return NextResponse.json(
    {
      error: {
        code: "unexpected",
        message,
        retryable: true,
      },
    },
    {
      status: 500,
    }
  );
}