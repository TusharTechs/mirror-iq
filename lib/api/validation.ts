import { getImageDimensions } from "../images/dimensions";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

export function validateImageFile(
  file: File,
  label: string,
  allowedTypes: string[]
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `${label} must be one of: ${allowedTypes.join(", ")}.`;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `${label} must be smaller than ${MAX_IMAGE_BYTES / 1024 / 1024}MB.`;
  }

  return null;
}

// Provider face-detection tasks reject small source images (e.g. YouCam's
// error_src_face_too_small) after a slow round trip instead of failing fast.
// Catch that here so users get an immediate, clear message.
//
// Since accepted types are restricted to image/jpeg and image/png, and our
// own parser recognizes both formats' real headers, failing to read
// dimensions means the bytes aren't actually a valid image of that type
// (e.g. an error page or empty response saved with an image extension) —
// not an unsupported-but-valid format we should silently wave through.
//
// Thresholds differ per feature (verified against docs.perfectcorp.com):
// - Skin analysis (SD tier): short side >= 480px.
// - AI Clothes VTO (src or ref image): the *documented minimum* of 512x384 is
//   only a quality recommendation — the actual enforced floor
//   (error_below_min_image_size) is just long side >= 128px. Pass minLongSide
//   for VTO call sites instead of minWidth/minHeight, or a real product photo
//   like a 399x501 flat-lay gets rejected for no reason.
export function validateImageDimensions(
  buffer: Buffer,
  label: string,
  opts: { minWidth?: number; minHeight?: number; minLongSide?: number } = {}
): string | null {
  const dimensions = getImageDimensions(buffer);

  if (!dimensions) {
    return `${label} isn't a valid JPEG or PNG file. The file may be corrupted or empty.`;
  }

  const { minWidth, minHeight, minLongSide } = opts;

  if (
    minWidth !== undefined &&
    minHeight !== undefined &&
    (dimensions.width < minWidth || dimensions.height < minHeight)
  ) {
    return `${label} is too small (${dimensions.width}x${dimensions.height}px). Minimum is ${minWidth}x${minHeight}px.`;
  }

  if (
    minLongSide !== undefined &&
    Math.max(dimensions.width, dimensions.height) < minLongSide
  ) {
    return `${label} is too small (${dimensions.width}x${dimensions.height}px). The longer side must be at least ${minLongSide}px.`;
  }

  return null;
}