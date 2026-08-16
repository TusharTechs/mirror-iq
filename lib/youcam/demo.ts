import type { SkinProfile, TryOnResult } from "../types";

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const demoSkinProfile: SkinProfile = {
  skinType: "combination",
  radiance: 72,
  redness: 18,
  texture: 34,
  moisture: 61,
};

export function demoLookImage(label: string): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024" viewBox="0 0 768 1024">
  <rect width="768" height="1024" fill="#111827" />
  <rect x="48" y="120" width="672" height="784" rx="32" fill="#374151" />
  <text x="50%" y="90" font-family="sans-serif" font-size="36" fill="#f9fafb" text-anchor="middle">
    MirrorIQ Demo Look
  </text>
  <text x="50%" y="960" font-family="sans-serif" font-size="28" fill="#d1d5db" text-anchor="middle">
    ${label}
  </text>
</svg>
`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function demoTryOnResult(
  garmentId: string,
  garmentName: string
): TryOnResult {
  return {
    id: randomId(),
    garmentId,
    status: "completed",
    imageUrl: demoLookImage(garmentName),
  };
}