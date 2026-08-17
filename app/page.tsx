"use client";

import { useMemo, useRef, useState } from "react";
import { garments } from "@/data/garments";
import type { Garment } from "@/data/garments";
import { matchScore } from "@/lib/scoring/matchScore";
import type { Occasion, StylePreference } from "@/lib/scoring/matchScore";
import type { TryOnResult } from "@/lib/types";
import { IMAGE_LIMITS } from "@/lib/images/limits";
import { Landing } from "./components/screens/Landing";
import { PhotoStep } from "./components/screens/PhotoStep";
import { ChoiceStep } from "./components/screens/ChoiceStep";
import { GarmentStep } from "./components/screens/GarmentStep";
import { GeneratingStep } from "./components/screens/GeneratingStep";
import { LookLabStep } from "./components/screens/LookLabStep";

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
      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-safe pb-10 sm:p-6">
        <header className="flex items-center justify-between py-3">
          <button
            onClick={resetAll}
            className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
          >
            MirrorIQ
          </button>
          {demo && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
              DEMO_MODE
            </span>
          )}
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-sm text-red-200">
            {error}
          </div>
        )}

        {step === "landing" && <Landing onStart={() => setStep("upload")} />}

        {step === "upload" && (
          <PhotoStep
            previewUrl={previewUrl}
            framingWarning={framingWarning}
            busy={busy}
            photoFile={photoFile}
            onFileChange={onFileChange}
            onRemove={removePhoto}
            onContinue={handleContinueToOccasion}
          />
        )}

        {step === "occasion" && (
          <ChoiceStep
            step="occasion"
            title="What are you dressing for?"
            options={occasions}
            selected={occasion}
            onSelect={setOccasion}
            onContinue={() => setStep("style")}
          />
        )}

        {step === "style" && (
          <ChoiceStep
            step="style"
            title="What's your style?"
            options={styles}
            selected={stylePreference}
            onSelect={setStylePreference}
            onContinue={() => setStep("garments")}
          />
        )}

        {step === "garments" && (
          <GarmentStep
            garments={garments}
            selectedGarments={selectedGarments}
            onToggle={toggleGarment}
            onContinue={handleGenerate}
            busy={busy}
          />
        )}

        {step === "tryon" && (
          <GeneratingStep
            results={results}
            garments={garments}
            busy={busy}
            onCancel={handleCancel}
          />
        )}

        {step === "results" && (
          <LookLabStep
            demo={demo}
            garments={garments}
            scoredLooks={scoredLooks}
            bestLook={bestLook}
            failedLooks={failedLooks}
            occasion={occasion}
            stylePreference={stylePreference}
            busy={busy}
            onRetry={retryGarment}
            onReset={resetAll}
          />
        )}
      </div>
    </main>
  );
}
