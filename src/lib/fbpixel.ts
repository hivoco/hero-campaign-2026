// Meta (Facebook) Pixel helper. The base pixel is loaded once site-wide by
// <MetaPixel/> (components/meta-pixel.tsx); this fires the per-button events.
// Override the id via NEXT_PUBLIC_FB_PIXEL_ID; falls back to the campaign's own.
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID ?? "860703767703104";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fire a Meta Pixel event. No-op if the pixel script hasn't loaded (SSR, still
 * loading, or blocked), so callers never need to guard.
 */
export function trackPixel(event: string): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event);
  }
}
