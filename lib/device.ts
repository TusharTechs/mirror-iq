// Whether this device's browser actually honors <input capture> by opening
// a camera, rather than silently falling back to the same file picker as a
// plain upload — used to avoid showing a "Take a photo" action that would be
// indistinguishable from "Choose from gallery" and therefore misleading.
export function supportsCameraCapture(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;

  // Android, iPhone/iPod, and any UA still reporting "iPad" directly.
  if (/Android|iPhone|iPod|iPad/i.test(ua)) return true;

  // iPadOS 13+ disguises itself as "Macintosh" in the UA string, but unlike
  // a real Mac it still reports multi-touch support.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;

  // Chromium's newer, more privacy-respecting mobile signal (not available
  // in Safari/Firefox, so it's an addition to the checks above, not a
  // replacement for them).
  const uaData = (navigator as unknown as { userAgentData?: { mobile?: boolean } })
    .userAgentData;

  return uaData?.mobile === true;
}
