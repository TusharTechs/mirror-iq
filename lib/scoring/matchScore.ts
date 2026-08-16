import type { Garment } from "@/data/garments";

export type Occasion = "Everyday" | "Work" | "Date Night" | "Party";
export type StylePreference = "Minimal" | "Street" | "Classic";

export type MatchScore = {
  overall: number;
  preferenceMatch: number;
  occasionFit: number;
  reasons: string[];
};

export function matchScore(
  garment: Garment,
  selection: {
    occasion: Occasion;
    style: StylePreference;
  }
): MatchScore {
  const reasons: string[] = [];

  let preferenceMatch = 30;

  if (garment.category === selection.style) {
    preferenceMatch = 100;
    reasons.push(`${garment.name} is a ${selection.style} piece.`);
  } else if (garment.styleTags.includes(selection.style)) {
    preferenceMatch = 80;
    reasons.push(`${garment.name} matches your ${selection.style} preference.`);
  } else {
    reasons.push(`${garment.name} is not a direct ${selection.style} match.`);
  }

  let occasionFit = 30;

  if (garment.occasionTags.includes(selection.occasion)) {
    occasionFit = 100;
    reasons.push(`${garment.name} is tagged for ${selection.occasion}.`);
  } else if (garment.occasionTags.includes("Everyday")) {
    occasionFit = 55;
    reasons.push(`${garment.name} is a versatile everyday option.`);
  } else {
    reasons.push(`Occasion fit for ${garment.name} is uncertain.`);
  }

  const overall = Math.round(
    preferenceMatch * 0.55 + occasionFit * 0.45
  );

  return {
    overall,
    preferenceMatch,
    occasionFit,
    reasons,
  };
}