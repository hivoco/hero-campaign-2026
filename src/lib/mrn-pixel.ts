// MRN Digital tracking pixel — fired on demand (on the Send OTP action), not
// site-wide. We request the 1×1 image via `new Image()` so no DOM node is needed.
const MRN_PIXEL_URL = "https://trk.mrndigital.in/pixel?av=65438668f136ac49a726861c";

/**
 * Fire the MRN pixel. The cache-buster guarantees the request actually goes out
 * on each call (a plain repeated GET could be served from cache). No-op on the
 * server.
 */
export function fireMrnPixel(): void {
  if (typeof window === "undefined") return;
  const img = new Image(1, 1);
  img.src = `${MRN_PIXEL_URL}&_=${Date.now()}`;
}
