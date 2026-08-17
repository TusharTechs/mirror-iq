import { NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/youcam/config";
import { submitSkinAnalysis, pollSkinAnalysis } from "@/lib/youcam/skin";
import { demoSkinProfile } from "@/lib/youcam/demo";
import { isFile, validateImageFile, validateImageDimensions } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/respond";
import { YouCamApiError } from "@/lib/youcam/errors";
import { IMAGE_LIMITS } from "@/lib/images/limits";
import type { SkinProfile } from "@/lib/types";

export const runtime = "nodejs";

function invalid(message: string) {
  return NextResponse.json(
    { error: { code: "invalid_input", message, retryable: false } },
    { status: 400 }
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  const started = Date.now();

  try {
    const form = await req.formData();
    const photo = form.get("photo");

    if (!isFile(photo)) return invalid("Photo is required.");

    const validation = validateImageFile(photo, "Photo", ["image/jpeg", "image/png"]);
    if (validation) return invalid(validation);

    const buffer = Buffer.from(await photo.arrayBuffer());

    const dimensionError = validateImageDimensions(buffer, "Photo", {
      minWidth: IMAGE_LIMITS.minWidth,
      minHeight: IMAGE_LIMITS.minHeight,
    });
    if (dimensionError) return invalid(dimensionError);

    if (isDemoMode()) {
      await delay(400);
      return NextResponse.json({
        demo: true,
        durationMs: Date.now() - started,
        profile: demoSkinProfile,
      });
    }

    const taskId = await submitSkinAnalysis(buffer, photo.type, req.signal);

    let profile: SkinProfile | undefined;

    for (let i = 0; i < 15; i += 1) {
      await delay(2000);

      const outcome = await pollSkinAnalysis(taskId, req.signal);

      if (outcome.status === "success") {
        profile = outcome.profile;
        break;
      }

      if (outcome.status === "failed") {
        throw new YouCamApiError({
          code: "processing_failed",
          message: outcome.error,
          retryable: false,
        });
      }
      // "running" → keep polling
    }

    if (!profile) {
      throw new YouCamApiError({
        code: "timeout",
        message: "Skin analysis still running after polling window.",
        retryable: true,
      });
    }

    return NextResponse.json({
      demo: false,
      durationMs: Date.now() - started,
      profile,
    });
  } catch (error) {
    return errorResponse("/api/skin", error, started);
  }
}