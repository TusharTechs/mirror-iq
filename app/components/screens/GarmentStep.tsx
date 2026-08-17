/* eslint-disable @next/next/no-img-element */
"use client";

import type { Garment } from "@/data/garments";
import { matchScore } from "@/lib/scoring/matchScore";
import type { Occasion, StylePreference } from "@/lib/scoring/matchScore";
import { ProgressTrail, SectionHeading } from "../ui";

const MAX_GARMENTS = 3;

function GarmentCard({
  garment,
  selected,
  disabled,
  onToggle,
}: {
  garment: Garment;
  selected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(garment.id)}
      disabled={disabled}
      aria-pressed={selected}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-emerald-400 ring-2 ring-emerald-400/60"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-800">
        <img
          src={garment.image}
          alt={garment.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>

      {selected && (
        <span
          aria-hidden="true"
          className="motion-safe:animate-pop absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-zinc-950 shadow"
        >
          ✓
        </span>
      )}

      <div className="space-y-0.5 bg-zinc-900 p-2.5">
        <div className="truncate text-sm font-medium text-zinc-100">{garment.name}</div>
        <div className="text-xs text-zinc-500">{garment.category}</div>
      </div>
    </button>
  );
}

export function GarmentStep({
  garments,
  occasion,
  stylePreference,
  selectedGarments,
  onToggle,
  onContinue,
  busy,
}: {
  garments: Garment[];
  occasion: Occasion | null;
  stylePreference: StylePreference | null;
  selectedGarments: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  busy: boolean;
}) {
  const count = selectedGarments.length;

  // Reuses the same frozen matchScore() the Look Lab scores with — this is
  // presentation-only prioritization, not a new scoring path. Falls back to
  // a single flat grid if intent isn't set yet (shouldn't happen given the
  // step order, but keeps this defensive rather than crashing).
  let shortlist: Garment[] = [];
  let rest: Garment[] = garments;

  if (occasion && stylePreference) {
    const scored = garments.map((garment) => ({
      garment,
      score: matchScore(garment, { occasion, style: stylePreference }).overall,
    }));
    const topScore = Math.max(...scored.map((s) => s.score));
    shortlist = scored.filter((s) => s.score === topScore).map((s) => s.garment);
    rest = scored
      .filter((s) => s.score !== topScore)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.garment);
  }

  const renderCard = (garment: Garment) => {
    const selected = selectedGarments.includes(garment.id);
    const disabled = !selected && count >= MAX_GARMENTS;
    return (
      <GarmentCard
        key={garment.id}
        garment={garment}
        selected={selected}
        disabled={disabled}
        onToggle={onToggle}
      />
    );
  };

  return (
    <section className="motion-safe:animate-fade-up space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 pb-28 sm:p-8 sm:pb-8">
      <ProgressTrail current="garments" />

      <SectionHeading
        title="What are you considering?"
        subtitle="Pick up to 3 looks to compare."
      />

      {shortlist.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-100">
              Your {stylePreference} shortlist
            </h3>
            <p className="text-xs text-zinc-500">
              Strongest matches for your {occasion} + {stylePreference} picks.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shortlist.map(renderCard)}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-3">
          {shortlist.length > 0 && (
            <h3 className="text-sm font-medium text-zinc-400">Explore all garments</h3>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rest.map(renderCard)}
          </div>
        </div>
      )}

      {count > 0 && (
        <div className="motion-safe:animate-fade-up space-y-3 border-t border-zinc-800 pt-5">
          <h3 className="text-sm font-medium text-zinc-100">
            Your try-on lineup · {count}/{MAX_GARMENTS}
          </h3>
          <div className="flex flex-wrap gap-3">
            {selectedGarments.map((id) => {
              const garment = garments.find((item) => item.id === id);
              if (!garment) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 py-1 pl-1 pr-3"
                >
                  <img
                    src={garment.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-zinc-200">{garment.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/90 px-5 py-3 backdrop-blur pb-safe sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:pb-0 sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:mx-0 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-center text-sm text-zinc-400 sm:shrink-0 sm:text-left">
            {count} of {MAX_GARMENTS} selected
          </span>
          <button
            type="button"
            onClick={onContinue}
            disabled={count === 0 || busy}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-zinc-950 transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            See my looks
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
