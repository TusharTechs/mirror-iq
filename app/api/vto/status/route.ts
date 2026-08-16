import { NextRequest, NextResponse } from "next/server";
import { garments } from "@/data/garments";
import { isDemoMode } from "@/lib/youcam/config";
import { getApparelTryOnStatus } from "@/lib/youcam/vto";
import { demoTryOnResult } from "@/lib/youcam/demo";
import { errorResponse } from "@/lib/api/respond";
import { logServer } from "@/lib/log";

export const runtime = "nodejs";

function invalid(message: string) {
  return NextResponse.json(
    {
      error: {
        code: "invalid_input",
        message,
        retryable: false,
      },
    },
    {
      status: 400,
    }
  );
}

export async function GET(req: NextRequest) {
  const started = Date.now();

  try {
    const { searchParams } = new URL(req.url);

    const jobId = searchParams.get("jobId");
    const garmentId = searchParams.get("garmentId");

    if (!jobId) {
      return invalid("jobId is required.");
    }

    if (!garmentId) {
      return invalid("garmentId is required.");
    }

    const garment = garments.find((item) => item.id === garmentId);

    if (!garment) {
      return invalid("Unknown garment.");
    }

    if (isDemoMode()) {
      const durationMs = Date.now() - started;

      logServer("api.vto.status.success", {
        demo: true,
        garmentId,
        jobId,
        durationMs,
      });

      return NextResponse.json({
        demo: true,
        durationMs,
        result: demoTryOnResult(garmentId, garment.name),
      });
    }

    const result = await getApparelTryOnStatus(
      {
        garmentId,
        jobId,
      },
      req.signal
    );

    const durationMs = Date.now() - started;

    logServer("api.vto.status.success", {
      demo: false,
      garmentId,
      jobId,
      status: result.status,
      durationMs,
    });

    return NextResponse.json({
      demo: false,
      durationMs,
      result,
    });
  } catch (error) {
    return errorResponse("/api/vto/status", error, started);
  }
}