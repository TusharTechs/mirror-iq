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