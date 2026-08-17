"use client";

import { useEffect, useRef, useState } from "react";

// YouCam JS Camera Kit — does real-time face position / lighting / angle
// validation in-browser so captures already satisfy the skin-analysis API's
// "face width > 60% of image width" requirement instead of failing after
// a slow round trip to the provider. Docs: docs.perfectcorp.com/reference/ai_skin_analysis
const CAMERA_KIT_SRC = "https://plugins-media.makeupar.com/v2.5-camera-kit/sdk.js";
const MOUNT_ID = "YMK-module";

type YmkCapturedImage = { image: string | Blob };
type YmkCapturedResult = { images: YmkCapturedImage[] };

declare global {
  interface Window {
    YMK?: {
      init: (args: Record<string, unknown>) => void;
      openCameraKit: () => void;
      close: () => void;
      addEventListener: (
        event: string,
        callback: (payload: unknown) => void
      ) => string;
      removeEventListener: (id: string) => void;
    };
    YMKAsyncInit?: () => void;
  }
}

function loadCameraKitScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.YMK) {
      resolve();
      return;
    }

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      resolve();
    };

    // The docs' YMKAsyncInit callback pattern doesn't reliably fire when the
    // script is injected after initial page load (observed: window.YMK
    // becomes available, but the callback never runs) — poll as the primary
    // signal and keep the callback as a fallback in case it does fire.
    window.YMKAsyncInit = settle;
    const poll = setInterval(() => {
      if (window.YMK) settle();
    }, 100);

    if (document.querySelector(`script[src="${CAMERA_KIT_SRC}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = CAMERA_KIT_SRC;
    script.async = true;
    script.onerror = () => {
      clearInterval(poll);
      reject(new Error("Could not load the camera. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
}

export function CameraCapture({
  open,
  onCapture,
  onClose,
}: {
  open: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listenerIdRef = useRef<string | null>(null);
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  useEffect(() => {
    if (!open) return;

    // The SDK reports camera-permission/device failures (e.g. "error.no.camera")
    // as an uncaught rejection from its own internals rather than through a
    // callback we register, so catch it here instead of leaving the modal stuck.
    function handleRejection(event: PromiseRejectionEvent) {
      const message = String(
        (event.reason && (event.reason.message ?? event.reason)) || ""
      );

      if (message.toLowerCase().includes("camera")) {
        setLoadError(
          "Camera access was blocked or unavailable. Allow camera permission and retry, or upload a photo instead."
        );
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", handleRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleRejection);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadError(null);

      try {
        await loadCameraKitScript();
        if (cancelled) return;

        const ymk = window.YMK;
        if (!ymk) throw new Error("Camera Kit failed to load.");

        ymk.init({
          faceDetectionMode: "skincare",
          imageFormat: "base64",
          // RELAXED's 0.55 minimum sits below the analysis API's hard 60%
          // requirement; MODERATE (0.65) clears it with margin.
          qualityLevel: "moderate",
        });

        listenerIdRef.current = ymk.addEventListener(
          "faceDetectionCaptured",
          (payload) => {
            const first = (payload as YmkCapturedResult).images?.[0];
            if (!first) return;

            if (first.image instanceof Blob) {
              onCaptureRef.current(
                new File([first.image], "selfie.jpg", {
                  type: first.image.type || "image/jpeg",
                })
              );
              return;
            }

            fetch(first.image)
              .then((res) => res.blob())
              .then((blob) => {
                onCaptureRef.current(
                  new File([blob], "selfie.jpg", {
                    type: blob.type || "image/jpeg",
                  })
                );
              });
          }
        );

        ymk.openCameraKit();
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setLoadError(
          err instanceof Error ? err.message : "Could not load the camera."
        );
      }
    }

    run();

    return () => {
      cancelled = true;
      const ymk = window.YMK;
      if (!ymk) return;

      if (listenerIdRef.current) {
        ymk.removeEventListener(listenerIdRef.current);
        listenerIdRef.current = null;
      }

      ymk.close();
    };
  }, [open]);

  // Keep the mount point in the DOM even while closed (visibility toggled via
  // CSS) instead of unmounting it. The SDK's own cleanup in ymk.close() reads
  // DOM nodes inside it; unmounting first makes that throw on a null ref.
  return (
    <div
      className={
        open
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          : "hidden"
      }
    >
      <div className="w-full max-w-md space-y-3 rounded-xl bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-100">Take a selfie</h3>
          <button
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Close
          </button>
        </div>

        {loadError && (
          <div className="rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">
            {loadError}
          </div>
        )}

        {loading && (
          <div className="text-xs text-zinc-400">Loading camera…</div>
        )}

        <div id={MOUNT_ID} className="overflow-hidden rounded-lg" />
      </div>
    </div>
  );
}
