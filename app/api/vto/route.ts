import { NextRequest, NextResponse } from "next/server";
import { garments } from "@/data/garments";
import { isDemoMode } from "@/lib/youcam/config";
import { submitApparelTryOn } from "@/lib/youcam/vto";
import { demoTryOnResult } from "@/lib/youcam/demo";
import { isFile, validateImageFile, validateImageDimensions } from "@/lib/api/validation";
import { errorResponse } from "@/lib/api/respond";
import { logServer } from "@/lib/log";
import { VTO_IMAGE_LIMITS } from "@/lib/images/limits";

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
    const personImage = form.get("personImage");
    const garmentId = form.get("garmentId");
    const garmentImage = form.get("garmentImage");

    if (!isFile(personImage)) return invalid("personImage is required.");
    if (typeof garmentId !== "string" || !garmentId) return invalid("garmentId is required.");

    const garment = garments.find((item) => item.id === garmentId);
    if (!garment) return invalid("Unknown garment.");

    const personValidation = validateImageFile(personImage, "Person photo", ["image/jpeg", "image/png"]);
    if (personValidation) return invalid(personValidation);

    if (isDemoMode()) {
      await delay(700);
      return NextResponse.json({
        demo: true,
        durationMs: Date.now() - started,
        result: demoTryOnResult(garmentId, garment.name),
      });
    }

    if (!isFile(garmentImage)) return invalid("garmentImage is required in live mode.");

    const garmentValidation = validateImageFile(garmentImage, "Garment image", ["image/jpeg", "image/png"]);
    if (garmentValidation) return invalid(garmentValidation);

    const personBuffer = Buffer.from(await personImage.arrayBuffer());
    const garmentBuffer = Buffer.from(await garmentImage.arrayBuffer());

    const personDimensionError = validateImageDimensions(personBuffer, "Person photo", {
      minLongSide: VTO_IMAGE_LIMITS.minLongSide,
    });
    if (personDimensionError) return invalid(personDimensionError);

    const garmentDimensionError = validateImageDimensions(garmentBuffer, "Garment image", {
      minLongSide: VTO_IMAGE_LIMITS.minLongSide,
    });
    if (garmentDimensionError) return invalid(garmentDimensionError);

    const result = await submitApparelTryOn(
      {
        garmentId,
        personImage: personBuffer,
        personMimeType: personImage.type,
        garmentImage: garmentBuffer,
        garmentMimeType: garmentImage.type,
      },
      req.signal
    );

    return NextResponse.json({
      demo: false,
      durationMs: Date.now() - started,
      result,
    });
  } catch (error) {
    return errorResponse("/api/vto", error, started);
  }
}