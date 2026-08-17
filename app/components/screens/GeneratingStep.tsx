"use client";

import type { Garment } from "@/data/garments";
import type { TryOnResult } from "@/lib/types";
import { GhostButton, ScreenShell, SectionHeading } from "../ui";

type LookUi = TryOnResult & { stage?: string };

function StatusDot({ status }: { status: TryOnResult["status"] }) {
  if (status === "completed") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-zinc-950">
        ✓
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-300">
        !
      </span>
    );
  }

  return (
    <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
      <span className="motion-safe:animate-ping motion-reduce:hidden absolute h-4 w-4 rounded-full bg-emerald-400/40" />
      <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}

export function GeneratingStep({
  results,
  garments,
  busy,
  onCancel,
}: {
  results: LookUi[];
  garments: Garment[];
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <ScreenShell step="tryon">
      <SectionHeading
        title="Preparing your looks…"
        subtitle="YouCam is rendering each garment on your photo. This usually takes 10–30 seconds per look."
      />

      <ul aria-live="polite" className="space-y-3">
        {results.map((result) => {
          const garment = garments.find((item) => item.id === result.garmentId);

          return (
            <li
              key={result.garmentId}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5"
            >
              <StatusDot status={result.status} />

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-100">
                  {garment?.name ?? result.garmentId}
                </div>
                <div className="truncate text-sm text-zinc-400">
                  {result.stage ?? result.status}
                </div>
                {result.error && (
                  <div className="mt-0.5 truncate text-sm text-red-300">{result.error}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <GhostButton onClick={onCancel} disabled={!busy}>
        Cancel
      </GhostButton>
    </ScreenShell>
  );
}
