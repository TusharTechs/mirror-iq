// Playground-reported constraints; pending official doc verification.
// App limits stay conservative on purpose (API reportedly allows up to 10 MB).
export const IMAGE_LIMITS = {
  acceptedTypes: ["image/jpeg", "image/png"],
  maxBytes: 4 * 1024 * 1024,
  minWidth: 512,
  minHeight: 384,
  maxLongSide: 4096,
} as const;

// AI Clothes VTO (docs.perfectcorp.com/reference/ai_clothes): 1024x768 is
// only the *recommended* size for quality. The actual enforced floor
// (error_below_min_image_size) is long side >= 128px, for both the person
// photo and the garment reference image.
export const VTO_IMAGE_LIMITS = {
  minLongSide: 128,
} as const;