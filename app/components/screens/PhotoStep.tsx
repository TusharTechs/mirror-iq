/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, type ChangeEvent } from "react";
import { supportsCameraCapture } from "@/lib/device";
import { CheckItem, GhostButton, PrimaryButton, ScreenShell, SectionHeading } from "../ui";

// Original illustration (not a photo of a real person) — safe to use as a
// compact framing diagram without any rights/consent concern.
function FramingDiagram() {
  return (
    <svg
      viewBox="0 0 160 200"
      className="h-16 w-auto shrink-0 rounded-lg border border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 sm:h-20"
      role="img"
      aria-label="Example of good framing: chest-up, shoulders visible, facing forward"
    >
      <rect x="4" y="4" width="152" height="192" rx="14" fill="none" stroke="#3f3f46" strokeWidth="2" />
      <circle cx="80" cy="68" r="27" fill="#52525b" />
      <path
        d="M 33 110 Q 33 100 45 100 L 115 100 Q 127 100 127 110 L 119 190 L 41 190 Z"
        fill="#52525b"
      />
      <line x1="4" y1="100" x2="156" y2="100" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}

function FramingGuidance() {
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-3">
        <FramingDiagram />
        <div>
          <div className="text-sm font-medium text-zinc-100">Best framing</div>
          <p className="text-xs text-zinc-500">Chest-up · shoulders visible · facing forward</p>
          <p className="text-[11px] text-zinc-600">Example of good framing</p>
        </div>
      </div>

      <ul className="space-y-1.5 border-t border-zinc-800 pt-3">
        <CheckItem>Just you in the frame</CheckItem>
        <CheckItem>Chest-up with shoulders visible</CheckItem>
        <CheckItem>Face unobstructed and facing forward</CheckItem>
        <CheckItem>Good lighting and simple background</CheckItem>
      </ul>
    </div>
  );
}

function UploadActions({
  showCamera,
  onFileChange,
}: {
  showCamera: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {showCamera && (
        <label className="w-full">
          <span className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-zinc-950 transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none">
            Take a photo
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="user"
            onChange={onFileChange}
            className="sr-only"
            aria-label="Take a photo with your camera"
          />
        </label>
      )}

      <label className="w-full">
        <span
          className={
            showCamera
              ? "inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-700 px-8 text-base font-semibold text-zinc-200 transition-colors duration-150 hover:border-zinc-500 hover:text-white"
              : "inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-zinc-950 transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none"
          }
        >
          Choose from gallery
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={onFileChange}
          className="sr-only"
          aria-label="Choose a photo from your device"
        />
      </label>

      <p className="text-center text-[11px] text-zinc-600 sm:text-left">
        Try-on powered by YouCam Apparel VTO.
      </p>
    </div>
  );
}

export function PhotoStep({
  previewUrl,
  framingWarning,
  busy,
  photoFile,
  onFileChange,
  onRemove,
  onContinue,
}: {
  previewUrl: string | null;
  framingWarning: string | null;
  busy: boolean;
  photoFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onContinue: () => void;
}) {
  // Lazy-init runs once, client-side only — this component never exists in
  // server-rendered HTML (it only mounts after a client navigation), so
  // there's no hydration mismatch to worry about here.
  const [showCamera] = useState(supportsCameraCapture);

  if (previewUrl) {
    // Confirmation state. We only surface the one signal the app actually
    // infers — the aspect-ratio framing heuristic — never per-item claims
    // like "face detected" or "single person" that nothing here verifies.
    return (
      <ScreenShell step="upload">
        <div className="mx-auto max-w-lg space-y-5">
          <SectionHeading title="Your photo" />

          <div className="motion-safe:animate-pop overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <img
              src={previewUrl}
              alt="Your uploaded photo"
              className="mx-auto max-h-[28rem] w-full object-contain"
            />
          </div>

          {framingWarning ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="text-sm font-semibold text-amber-200">Almost ready</div>
                <p className="mt-1 text-sm text-amber-200/80">{framingWarning}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <GhostButton onClick={onRemove} className="sm:flex-1">
                  Replace photo
                </GhostButton>
                <PrimaryButton
                  onClick={onContinue}
                  disabled={!photoFile || busy}
                  className="sm:flex-1"
                >
                  Use anyway
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-medium text-emerald-300">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-400"
                >
                  ✓
                </span>
                Try-on ready
              </div>

              <GhostButton onClick={onRemove}>Replace photo</GhostButton>

              <p className="text-sm text-zinc-400">Ready to see yourself in it?</p>

              <PrimaryButton onClick={onContinue} disabled={!photoFile || busy}>
                Continue
                <span aria-hidden="true">→</span>
              </PrimaryButton>
            </div>
          )}
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell step="upload">
      <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
        <div className="space-y-5">
          <SectionHeading
            title="Let's see you in it."
            subtitle="One photo is all we need. Face forward, shoulders visible, and you're ready to try on."
          />

          <UploadActions showCamera={showCamera} onFileChange={onFileChange} />
        </div>

        <FramingGuidance />
      </div>
    </ScreenShell>
  );
}
