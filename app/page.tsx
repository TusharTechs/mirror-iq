/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useRef, useState } from "react";
import { garments } from "@/data/garments";
import type { Garment } from "@/data/garments";
import { matchScore } from "@/lib/scoring/matchScore";
import type { Occasion, StylePreference } from "@/lib/scoring/matchScore";
import type { TryOnResult } from "@/lib/types";
import { IMAGE_LIMITS } from "@/lib/images/limits";

const occasions: Occasion[] = ["Everyday", "Work", "Date Night", "Party"];
const styles: StylePreference[] = ["Minimal", "Street", "Classic"];

type Step =
  | "landing"
  | "upload"
  | "occasion"
  | "style"
  | "garments"
  | "tryon"
  | "results";

type LookUi = TryOnResult & {
  stage?: string;
};

type ScoredLook = LookUi & {
  garment: Garment;
  score: ReturnType<typeof matchScore>;
};

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal.addEventListener("abort", onAbort);
  });
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function checkImageDimensions(dimensions: { width: number; height: number }): string | null {
  const { width: w, height: h } = dimensions;
  if (w < IMAGE_LIMITS.minWidth || h < IMAGE_LIMITS.minHeight) {
    return `Photo must be at least ${IMAGE_LIMITS.minWidth}×${IMAGE_LIMITS.minHeight}px.`;
  }
  if (Math.max(w, h) > IMAGE_LIMITS.maxLongSide) {
    return `Photo long side must be ${IMAGE_LIMITS.maxLongSide}px or less.`;
  }
  return null;
}

// Soft heuristic only — we can't actually detect pose/framing client-side.
// Flags shapes that are very unlikely to be a proper chest-up, shoulders-
// visible photo (YouCam's error_pose requirement), without hard-blocking.
function checkFramingHeuristic(dimensions: { width: number; height: number }): string | null {
  const ratio = dimensions.height / dimensions.width;

  if (ratio < 1.05) {
    return "This photo looks square or wide. VTO works best with an upright, upper-body photo with your shoulders visible — a tight face close-up or a landscape photo is likely to fail.";
  }

  if (ratio > 2.2) {
    return "This photo is unusually tall and narrow. Make sure it's a chest-up crop showing your shoulders, not a full-body or cropped strip photo.";
  }

  return null;
}

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [framingWarning, setFramingWarning] = useState<string | null>(null);

  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [stylePreference, setStylePreference] = useState<StylePreference | null>(null);

  const [selectedGarments, setSelectedGarments] = useState<string[]>([]);
  const [results, setResults] = useState<LookUi[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const scoredLooks = useMemo<ScoredLook[]>(() => {
    if (!occasion || !stylePreference) return [];
    return results
      .filter((item) => item.status === "completed")
      .flatMap((item) => {
        const garment = garments.find((g) => g.id === item.garmentId);
        if (!garment) return [];
        const score = matchScore(garment, { occasion, style: stylePreference });
        return [{ ...item, garment, score }];
      });
  }, [results, occasion, stylePreference]);

  const bestLook = useMemo(() => {
    return scoredLooks.reduce<ScoredLook | null>((acc, current) => {
      if (!acc) return current;
      return current.score.overall > acc.score.overall ? current : acc;
    }, null);
  }, [scoredLooks]);

  const failedLooks = results.filter((item) => item.status === "failed");

  function validatePhoto(file: File): string | null {
    if (!(IMAGE_LIMITS.acceptedTypes as readonly string[]).includes(file.type)) {
      return "Please choose a JPG or PNG photo.";
    }
    if (file.size > IMAGE_LIMITS.maxBytes) {
      return `Photo must be under ${IMAGE_LIMITS.maxBytes / 1024 / 1024}MB.`;
    }
    return null;
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = validatePhoto(file);
    if (validation) { setError(validation); return; }

    const dimensions = await readImageDimensions(file);
    if (!dimensions) { setError("Could not read image dimensions."); return; }

    const dimensionError = checkImageDimensions(dimensions);
    if (dimensionError) { setError(dimensionError); return; }

    setError(null);
    setFramingWarning(checkFramingHeuristic(dimensions));
    setPhotoFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    abortRef.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhotoFile(null);
    setPreviewUrl(null);
    setFramingWarning(null);
    setResults([]);
    setError(null);
    setStep("upload");
  }

  // PIVOT: No longer calls Skin API. Just moves to next step.
  function handleContinueToOccasion() {
    if (!photoFile) return;
    setStep("occasion");
  }

  function toggleGarment(id: string) {
    setSelectedGarments((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function patchResult(garmentId: string, patch: Partial<LookUi>) {
    setResults((prev) =>
      prev.map((item) =>
        item.garmentId === garmentId ? { ...item, ...patch } : item
      )
    );
  }

  async function pollVtoResult(garmentId: string, jobId: string, signal: AbortSignal) {
    const maxAttempts = 20;
    const intervalMs = 2000;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      await abortableSleep(intervalMs, signal);
      patchResult(garmentId, { stage: attempt > 12 ? "Finishing your preview" : "Generating your look" });
      const res = await fetch(`/api/vto/status?jobId=${encodeURIComponent(jobId)}&garmentId=${encodeURIComponent(garmentId)}`, { signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Status check failed.");
      const result: TryOnResult = data.result;
      if (result.status !== "processing") {
        patchResult(garmentId, { ...result, stage: result.status === "completed" ? "Completed" : "Failed" });
        return;
      }
    }
    patchResult(garmentId, { status: "failed", error: "Timed out waiting for try-on result.", stage: "Failed" });
  }

  async function runVtoForGarment(garmentId: string, signal: AbortSignal) {
    const garment = garments.find((item) => item.id === garmentId);
    if (!garment || !photoFile) throw new Error("Missing data.");

    patchResult(garmentId, { status: "processing", error: undefined, stage: "Preparing garment" });

    const garmentResponse = await fetch(garment.image, { signal });
    if (!garmentResponse.ok) throw new Error(`Garment image missing for ${garment.name}.`);
    const garmentBlob = await garmentResponse.blob();
    const extension = garmentBlob.type.includes("png") ? "png" : garmentBlob.type.includes("jpeg") ? "jpg" : "asset";

    const formData = new FormData();
    formData.append("personImage", photoFile);
    formData.append("garmentId", garmentId);
    formData.append("garmentImage", garmentBlob, `${garment.id}.${extension}`);

    patchResult(garmentId, { stage: "Submitting try-on" });
    const res = await fetch("/api/vto", { method: "POST", body: formData, signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? "Try-on failed.");
    
    setDemo(Boolean(data.demo));
    const result: TryOnResult = data.result;

    if (result.status === "processing" && result.providerJobId) {
      patchResult(garmentId, { stage: "Generating your look", providerJobId: result.providerJobId });
      await pollVtoResult(garmentId, result.providerJobId, signal);
    } else {
      patchResult(garmentId, { ...result, stage: result.status === "completed" ? "Completed" : "Failed" });
    }
  }

  async function handleGenerate() {
    if (!photoFile || selectedGarments.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setStep("tryon");

    const controller = new AbortController();
    abortRef.current = controller;

    setResults(selectedGarments.map((garmentId) => ({ id: makeId(), garmentId, status: "processing", stage: "Preparing garment" })));

    for (const garmentId of selectedGarments) {
      if (controller.signal.aborted) break;
      try {
        await runVtoForGarment(garmentId, controller.signal);
      } catch (err) {
        if ((err as Error).name === "AbortError") break;
        patchResult(garmentId, { status: "failed", error: err instanceof Error ? err.message : "Try-on failed.", stage: "Failed" });
      }
    }
    if (!controller.signal.aborted) setStep("results");
    setBusy(false);
    abortRef.current = null;
  }

  async function retryGarment(garmentId: string) {
    if (!photoFile || busy) return;
    setBusy(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await runVtoForGarment(garmentId, controller.signal);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        patchResult(garmentId, { status: "failed", error: err instanceof Error ? err.message : "Retry failed.", stage: "Failed" });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setBusy(false);
    setStep(selectedGarments.length > 0 ? "garments" : "upload");
  }

  function resetAll() {
    abortRef.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep("landing");
    setPhotoFile(null);
    setPreviewUrl(null);
    setFramingWarning(null);
    setOccasion(null);
    setStylePreference(null);
    setSelectedGarments([]);
    setResults([]);
    setError(null);
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MirrorIQ</h1>
            <p className="text-sm text-zinc-400">Stop guessing. See what works.</p>
          </div>
          {demo && (
            <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-200">
              DEMO_MODE active
            </span>
          )}
        </header>

        {error && (
          <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        )}

        {step === "landing" && (
          <section className="space-y-4 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-xl font-medium">Compare the looks you&apos;re considering before you buy.</h2>
            <p className="text-sm text-zinc-400">
              Upload one photo, select your top choices, and see them on yourself instantly.
            </p>
            <button
              className="rounded bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
              onClick={() => setStep("upload")}
            >
              Try MirrorIQ
            </button>
          </section>
        )}

        {step === "upload" && (
          <section className="space-y-4 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-medium">Show us your look</h2>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="mx-auto w-36 shrink-0 sm:mx-0">
                <svg
                  viewBox="0 0 160 200"
                  className="w-36 rounded-lg border border-zinc-700 bg-zinc-900"
                  role="img"
                  aria-label="Example: upper body photo, facing forward, shoulders visible"
                >
                  <rect x="4" y="4" width="152" height="192" rx="8" fill="none" stroke="#3f3f46" strokeWidth="2" />
                  <circle cx="80" cy="68" r="26" fill="#52525b" />
                  <path
                    d="M 35 108 Q 35 100 45 100 L 115 100 Q 125 100 125 108 L 118 190 L 42 190 Z"
                    fill="#52525b"
                  />
                  <line x1="4" y1="100" x2="156" y2="100" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" />
                  <text x="80" y="115" textAnchor="middle" fontSize="9" fill="#34d399">
                    shoulders visible
                  </text>
                </svg>
                <p className="mt-2 text-center text-xs text-zinc-500">Example framing</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-zinc-400">
                  For the best try-on results, your photo should be:
                </p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-300">
                  <li>Just you — no one else in frame</li>
                  <li>Upper body from the chest up, with your shoulders visible (not a tight face close-up)</li>
                  <li>Face fully visible, nothing covering it</li>
                  <li>Standing and facing the camera directly</li>
                  <li>Taken against a plain, uncluttered background</li>
                  <li>Well-lit, without harsh shadows</li>
                </ul>
              </div>
            </div>

            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={onFileChange}
              className="block text-sm text-zinc-300"
            />
            {previewUrl && (
              <div className="space-y-3">
                <img src={previewUrl} alt="Uploaded preview" className="max-h-80 rounded-lg border border-zinc-800 object-contain" />

                {framingWarning && (
                  <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                    {framingWarning} You can still continue, but it may fail try-on.
                  </div>
                )}

                <button onClick={removePhoto} className="rounded border border-zinc-700 px-3 py-1 text-sm">
                  Remove photo
                </button>
              </div>
            )}
            <button
              onClick={handleContinueToOccasion}
              disabled={!photoFile || busy}
              className="rounded bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
            >
              Continue
            </button>
          </section>
        )}

        {step === "occasion" && (
          <section className="space-y-6 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-medium">What are you dressing for?</h2>
            <div className="flex flex-wrap gap-2">
              {occasions.map((item) => (
                <button
                  key={item}
                  onClick={() => setOccasion(item)}
                  className={`rounded border px-3 py-2 text-sm ${
                    occasion === item ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("style")}
              disabled={!occasion}
              className="rounded bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
            >
              Continue
            </button>
          </section>
        )}

        {step === "style" && (
          <section className="space-y-6 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-medium">What feels most like you?</h2>
            <div className="flex flex-wrap gap-2">
              {styles.map((item) => (
                <button
                  key={item}
                  onClick={() => setStylePreference(item)}
                  className={`rounded border px-3 py-2 text-sm ${
                    stylePreference === item ? "border-white bg-white text-black" : "border-zinc-700 text-zinc-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("garments")}
              disabled={!stylePreference}
              className="rounded bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
            >
              Continue
            </button>
          </section>
        )}

        {step === "garments" && (
          <section className="space-y-4 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-medium">What are you considering?</h2>
            <p className="text-sm text-zinc-400">Select up to 3 garments to compare.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {garments.map((garment) => {
                const selected = selectedGarments.includes(garment.id);
                return (
                  <button
                    key={garment.id}
                    onClick={() => toggleGarment(garment.id)}
                    className={`space-y-2 rounded-xl border p-3 text-left ${
                      selected ? "border-white" : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <img src={garment.image} alt={garment.name} className="h-32 w-full rounded-lg object-cover" />
                    <div>
                      <div className="font-medium">{garment.name}</div>
                      <div className="text-xs text-zinc-500">{garment.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleGenerate}
              disabled={selectedGarments.length === 0 || busy}
              className="rounded bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
            >
              See My Looks
            </button>
          </section>
        )}

        {step === "tryon" && (
          <section className="space-y-4 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-medium">Preparing your looks…</h2>
            <div className="space-y-3">
              {results.map((result) => {
                const garment = garments.find((item) => item.id === result.garmentId);
                return (
                  <div key={result.garmentId} className="rounded-lg border border-zinc-800 p-3">
                    <div className="font-medium">{garment?.name ?? result.garmentId}</div>
                    <div className="text-sm text-zinc-400">{result.stage ?? result.status}</div>
                    {result.error && <div className="mt-1 text-sm text-red-300">{result.error}</div>}
                  </div>
                );
              })}
            </div>
            <button onClick={handleCancel} disabled={!busy} className="rounded border border-zinc-700 px-4 py-2 disabled:opacity-50">
              Cancel
            </button>
          </section>
        )}

        {step === "results" && (
          <section className="space-y-6 rounded-xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Look Lab</h2>
              <button onClick={resetAll} className="rounded border border-zinc-700 px-3 py-1 text-sm">
                Start over
              </button>
            </div>

            {bestLook && (
              <div className="rounded-xl border border-emerald-400 bg-emerald-400/5 p-4 space-y-2">
                <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">MirrorIQ Recommends</div>
                <div className="text-xl font-bold">{bestLook.garment.name}</div>
                <div className="text-sm text-zinc-300">
                  Best match for your <span className="font-medium">{occasion}</span> + <span className="font-medium">{stylePreference}</span> intent.
                </div>
                <div className="text-3xl font-bold text-emerald-400 mt-2">{bestLook.score.overall} MATCH</div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scoredLooks.map((look) => (
                <div key={look.garment.id} className="space-y-3 rounded-xl border border-zinc-800 p-3">
                  {look.imageUrl && (
                    <img src={look.imageUrl} alt={`Generated look with ${look.garment.name}`} className="h-64 w-full rounded-lg object-cover" />
                  )}
                  <div>
                    <div className="font-medium">{look.garment.name}</div>
                    <div className="text-xs text-zinc-500">MirrorIQ Match Score: {look.score.overall}</div>
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
                    {look.score.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {failedLooks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-red-200">Failed looks</h3>
                {failedLooks.map((look) => {
                  const garment = garments.find((item) => item.id === look.garmentId);
                  return (
                    <div key={look.garmentId} className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                      <div className="font-medium">{garment?.name ?? look.garmentId}</div>
                      <div className="text-sm text-red-200">{look.error ?? "Try-on failed."}</div>
                      <button
                        onClick={() => retryGarment(look.garmentId)}
                        disabled={busy}
                        className="mt-2 rounded border border-red-300/40 px-3 py-1 text-sm disabled:opacity-50"
                      >
                        Retry
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}