import { NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/youcam/config";
import { analyzeSkin } from "@/lib/youcam/skin";
import { demoSkinProfile } from "@/lib/youcam/demo";
import { isFile, validateImageFile } from "@/lib/api/validation";
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  const started = Date.now();

  try {
    const form = await req.formData();
    const photo = form.get("photo");

    if (!isFile(photo)) {
      return invalid("Photo is required.");
    }

    const validation = validateImageFile(photo, "Photo", [
      "image/jpeg",
      "image/png",
    ]);

    if (validation) {
      return invalid(validation);
    }

    const buffer = Buffer.from(await photo.arrayBuffer());

    if (isDemoMode()) {
      await delay(400);

      const durationMs = Date.now() - started;

      logServer("api.skin.success", {
        demo: true,
        durationMs,
      });

      return NextResponse.json({
        demo: true,
        durationMs,
        profile: demoSkinProfile,
      });
    }

    const profile = await analyzeSkin(buffer, photo.type, req.signal);

    const durationMs = Date.now() - started;

    logServer("api.skin.success", {
      demo: false,
      durationMs,
      hasProfile: Boolean(profile),
    });

    return NextResponse.json({
      demo: false,
      durationMs,
      profile,
    });
  } catch (error) {
    return errorResponse("/api/skin", error, started);
  }
}