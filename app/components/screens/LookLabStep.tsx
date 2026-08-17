/* eslint-disable @next/next/no-img-element */
"use client";

import type { Garment } from "@/data/garments";
import type { Occasion, StylePreference, MatchScore } from "@/lib/scoring/matchScore";
import type { TryOnResult } from "@/lib/types";
import { CheckItem, GhostButton, PrimaryButton, ScorePill } from "../ui";

type LookUi = TryOnResult & { stage?: string };
type ScoredLook = LookUi & { garment: Garment; score: MatchScore };

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
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
        <span aria-hidden="true">✦</span> MirrorIQ&rsquo;s Pick
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
        MirrorIQ Match Score is our transparent style + occasion heuristic — not a YouCam metric.
      </p>
    </div>
  );
}

function LookCard({ look, isBest }: { look: ScoredLook; isBest: boolean }) {
  return (
    <div
      className={`w-[86%] shrink-0 snap-center space-y-3 rounded-2xl border p-3 sm:w-auto ${
        isBest ? "border-emerald-400/60" : "border-zinc-800"
      }`}
    >
      {look.imageUrl && (
        <div className="overflow-hidden rounded-xl bg-zinc-900">
          <img
            src={look.imageUrl}
            alt={`${look.garment.name} on your photo`}
            className="aspect-[3/4] w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-1 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-zinc-100">{look.garment.name}</div>
          <ScorePill score={look.score.overall} size="sm" />
        </div>
        <p className="text-sm text-zinc-400">{look.score.reasons[0]}</p>
      </div>
    </div>
  );
}

export function LookLabStep({
  demo,
  garments,
  scoredLooks,
  bestLook,
  failedLooks,
  occasion,
  stylePreference,
  busy,
  onRetry,
  onReset,
}: {
  demo: boolean;
  garments: Garment[];
  scoredLooks: ScoredLook[];
  bestLook: ScoredLook | null;
  failedLooks: LookUi[];
  occasion: Occasion | null;
  stylePreference: StylePreference | null;
  busy: boolean;
  onRetry: (garmentId: string) => void;
  onReset: () => void;
}) {
  const sortedByScore = [...scoredLooks].sort((a, b) => b.score.overall - a.score.overall);
  const runnerUpScore = sortedByScore.length > 1 ? sortedByScore[1].score.overall : null;

  return (
    <section className="motion-safe:animate-fade-up space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium text-zinc-50 sm:text-3xl">
          Look Lab
        </h2>
        <GhostButton onClick={onReset}>Start over</GhostButton>
      </div>

      {demo && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
          Demo mode — sample looks shown
        </div>
      )}

      {bestLook && occasion && stylePreference && (
        <RecommendationBanner
          bestLook={bestLook}
          runnerUpScore={runnerUpScore}
          occasion={occasion}
          stylePreference={stylePreference}
        />
      )}

      {scoredLooks.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-400">
            {scoredLooks.length > 1 ? "Compare your looks" : "Your look"}
          </h3>
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {sortedByScore.map((look) => (
              <LookCard key={look.garment.id} look={look} isBest={bestLook?.garment.id === look.garment.id} />
            ))}
          </div>
        </div>
      )}

      {scoredLooks.length === 0 && failedLooks.length > 0 && (
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

      <PrimaryButton onClick={onReset} fullWidthOnMobile={false}>
        Try another combination
      </PrimaryButton>
    </section>
  );
}
