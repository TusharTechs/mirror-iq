/* eslint-disable @next/next/no-img-element */
"use client";

import type { Garment } from "@/data/garments";
import type { Occasion, StylePreference, MatchScore } from "@/lib/scoring/matchScore";
import type { TryOnResult } from "@/lib/types";
import { CheckItem, GhostButton, MirrorMark, PrimaryButton, ScorePill } from "../ui";

type LookUi = TryOnResult & { stage?: string };
type ScoredLook = LookUi & { garment: Garment; score: MatchScore };

const CARD_CLASSES = "w-[86%] shrink-0 snap-center space-y-3 rounded-2xl border p-3 sm:w-auto";

// matchScore() already generates one real sentence about style fit and one
// about occasion fit — always showing reasons[0] means garments that miss
// the style but hit the occasion (or vice versa) read as uniformly negative
// ("X is not a direct Y match") even though the other half is genuinely
// positive. Lead with whichever dimension actually scored higher — still
// exactly the algorithm's own words, just choosing which true sentence to
// surface first.
function pickLeadingReason(score: MatchScore): string {
  const [styleReason, occasionReason] = score.reasons;
  if (score.occasionFit > score.preferenceMatch && occasionReason) {
    return occasionReason;
  }
  return styleReason ?? occasionReason ?? "";
}

// YouCam's VTO response carries no fit-quality signal of its own (just the
// rendered image URL) — the only real substance available is MirrorIQ's own
// two scored dimensions. When a garment is genuinely strong on both (the
// same >= 80 bar the recommendation banner uses), show both real sentences
// instead of truncating to one; otherwise stick to the single strongest
// fact so a weak/uncertain dimension never gets surfaced.
function getReasonLines(score: MatchScore): string[] {
  const [styleReason, occasionReason] = score.reasons;
  const bothStrong = score.preferenceMatch >= 80 && score.occasionFit >= 80;

  if (bothStrong && styleReason && occasionReason) {
    return score.preferenceMatch >= score.occasionFit
      ? [styleReason, occasionReason]
      : [occasionReason, styleReason];
  }

  return [pickLeadingReason(score)];
}

function RecommendationBanner({
  bestLook,
  runnerUpScore,
  occasion,
  stylePreference,
}: {
  bestLook: ScoredLook;
  runnerUpScore: number | null;
  occasion: Occasion;
  stylePreference: StylePreference;
}) {
  const diff =
    runnerUpScore !== null ? bestLook.score.overall - runnerUpScore : null;

  return (
    <div className="motion-safe:animate-pop space-y-4 rounded-2xl border border-emerald-400/50 bg-emerald-400/[0.06] p-5 sm:p-6">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
        <MirrorMark className="h-4 w-4 text-zinc-100" /> MirrorIQ&rsquo;s Pick
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium text-zinc-50 sm:text-3xl">
          {bestLook.garment.name}
        </h3>
        <ScorePill score={bestLook.score.overall} size="lg" />
      </div>

      <p className="text-[15px] text-zinc-300">
        Best aligned with your <span className="font-medium text-zinc-100">{occasion}</span> +{" "}
        <span className="font-medium text-zinc-100">{stylePreference}</span> choices.
        {diff !== null && diff > 0 && (
          <span className="text-zinc-400"> {diff} points ahead of your next best option.</span>
        )}
      </p>

      <div className="space-y-2 border-t border-emerald-400/20 pt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Why it won
        </div>
        <ul className="space-y-1.5">
          {bestLook.score.preferenceMatch >= 80 && (
            <CheckItem>Strong style compatibility</CheckItem>
          )}
          {bestLook.score.occasionFit >= 80 && (
            <CheckItem>Strong occasion compatibility</CheckItem>
          )}
          <CheckItem>Highest overall compatibility</CheckItem>
        </ul>
      </div>

      <p className="text-xs text-zinc-500">
        MirrorIQ Match Score is a MirrorIQ decision aid, not a YouCam metric.
      </p>
    </div>
  );
}

function LookCard({ look, isBest }: { look: ScoredLook; isBest: boolean }) {
  return (
    <div className={`${CARD_CLASSES} ${isBest ? "border-emerald-400/60" : "border-zinc-800"}`}>
      {look.imageUrl && (
        <div className="overflow-hidden rounded-xl bg-zinc-900">
          <img
            src={look.imageUrl}
            alt={`${look.garment.name} on your photo`}
            loading="lazy"
            decoding="async"
            className="aspect-[3/4] w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-1 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-zinc-100">{look.garment.name}</div>
          <ScorePill score={look.score.overall} size="sm" />
        </div>
        {getReasonLines(look.score).map((reason, index) => (
          <p key={reason} className={index === 0 ? "text-sm text-zinc-400" : "text-xs text-zinc-500"}>
            {reason}
          </p>
        ))}
      </div>
    </div>
  );
}

function GeneratingCard({ garment, stage }: { garment: Garment; stage?: string }) {
  return (
    <div className={`${CARD_CLASSES} border-zinc-800`}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-900">
        <img
          src={garment.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="h-full w-full scale-110 object-cover opacity-30 blur-md"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative flex h-3 w-3">
            <span className="motion-safe:animate-ping motion-reduce:hidden absolute inline-flex h-full w-full rounded-full bg-emerald-400/50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
          </span>
        </div>
      </div>

      <div className="space-y-1 px-1">
        <div className="font-medium text-zinc-100">{garment.name}</div>
        <p className="text-sm text-zinc-500">{stage ?? "Generating…"}</p>
      </div>
    </div>
  );
}

export function LookLabStep({
  demo,
  garments,
  results,
  selectedGarments,
  scoredLooks,
  bestLook,
  failedLooks,
  occasion,
  stylePreference,
  busy,
  onRetry,
  onReset,
  onCancel,
}: {
  demo: boolean;
  garments: Garment[];
  results: LookUi[];
  selectedGarments: string[];
  scoredLooks: ScoredLook[];
  bestLook: ScoredLook | null;
  failedLooks: LookUi[];
  occasion: Occasion | null;
  stylePreference: StylePreference | null;
  busy: boolean;
  onRetry: (garmentId: string) => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  const stillGenerating = results.some((item) => item.status === "processing");

  // Stable selection order while anything is still in flight — re-sorting
  // by score as results trickle in would make cards jump around mid-reveal.
  // Once everything has reached a terminal state, lead with the best look.
  const displayGarmentIds = stillGenerating
    ? selectedGarments
    : [...scoredLooks].sort((a, b) => b.score.overall - a.score.overall).map((look) => look.garment.id);

  const cards = displayGarmentIds
    .map((garmentId) => {
      const result = results.find((item) => item.garmentId === garmentId);
      if (!result || result.status === "failed") return null;

      if (result.status === "processing") {
        const garment = garments.find((item) => item.id === garmentId);
        if (!garment) return null;
        return { type: "processing" as const, garment, stage: result.stage };
      }

      const scored = scoredLooks.find((look) => look.garment.id === garmentId);
      return scored ? { type: "done" as const, look: scored } : null;
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  const runnerUpScore =
    scoredLooks.length > 1
      ? [...scoredLooks].sort((a, b) => b.score.overall - a.score.overall)[1].score.overall
      : null;

  return (
    <section className="motion-safe:animate-fade-up space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium text-zinc-50 sm:text-3xl">
          Look Lab
        </h2>
        <GhostButton onClick={stillGenerating ? onCancel : onReset}>
          {stillGenerating ? "Cancel" : "Start over"}
        </GhostButton>
      </div>

      {demo && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
          Demo mode — sample looks shown
        </div>
      )}

      {stillGenerating && (
        <p className="text-sm text-zinc-400">
          YouCam is rendering each garment on your photo — this usually takes 10–30 seconds per look.
        </p>
      )}

      {bestLook && occasion && stylePreference && !stillGenerating && (
        <RecommendationBanner
          bestLook={bestLook}
          runnerUpScore={runnerUpScore}
          occasion={occasion}
          stylePreference={stylePreference}
        />
      )}

      {cards.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-400">
            {cards.length > 1 ? "Compare your looks" : "Your look"}
          </h3>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {cards.map((card) =>
              card.type === "processing" ? (
                <GeneratingCard key={card.garment.id} garment={card.garment} stage={card.stage} />
              ) : (
                <LookCard
                  key={card.look.garment.id}
                  look={card.look}
                  isBest={bestLook?.garment.id === card.look.garment.id}
                />
              )
            )}
          </div>
          {cards.length > 1 && (
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-zinc-500 sm:hidden">
              Swipe to compare
              <span aria-hidden="true" className="motion-safe:animate-nudge">→</span>
            </p>
          )}
        </div>
      )}

      {!stillGenerating && scoredLooks.length === 0 && failedLooks.length > 0 && (
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-center">
          <p className="text-zinc-300">
            None of your looks could be generated this time.
          </p>
          <p className="text-sm text-zinc-500">
            Try a different photo, or retry below — a plain, front-facing upper-body
            photo works best.
          </p>
        </div>
      )}

      {failedLooks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-red-200">Failed looks</h3>
          {failedLooks.map((look) => (
            <div
              key={look.garmentId}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5"
            >
              <div className="font-medium text-zinc-100">
                {garments.find((item) => item.id === look.garmentId)?.name ?? look.garmentId}
              </div>
              <div className="text-sm text-red-200">{look.error ?? "Try-on failed."}</div>
              <GhostButton
                onClick={() => onRetry(look.garmentId)}
                disabled={busy}
                className="mt-2 border-red-400/40"
              >
                Retry
              </GhostButton>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <PrimaryButton onClick={onReset}>
          Try another combination
        </PrimaryButton>
      </div>
    </section>
  );
}
