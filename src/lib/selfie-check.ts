/**
 * Selfie validation pipeline — the seam both the capture overlay and the
 * upload path run a photo through. Two gates in series:
 *
 *   localCheck(file)   → client-side, free, instant   (this file)
 *   uploadSelfie(file) → server, authoritative        (POST /photo-validation/check_photo)
 *
 * Committing a selfie requires BOTH to pass. The server gate additionally
 * returns the derived roles + a validation_token (carried on `meta`) that
 * /video/submit needs, so a passing check hands that metadata back to the
 * caller to store alongside the committed selfie.
 */
import { countWellFramedFaces, REQUIRED_FACE_COUNT } from "@/lib/face-gate";
import { checkPhoto, getPhotoValidationEnabled, ApiError } from "@/lib/api";

export type SelfieReason =
  | "no-face"
  | "need-two-faces"
  | "too-dark"
  | "too-bright"
  | "off-center"
  | "face-too-small"
  | "blurry"
  | "obscured";

export type SelfieVerdict = { ok: boolean; reasons: SelfieReason[] };

/** Data the server gate derives from a valid selfie — needed by /video/submit. */
export type SelfieMeta = {
  validationToken?: string;
  parentRole?: "father" | "mother";
  childRole?: "son" | "daughter";
};

/** Server verdict: a base verdict plus a ready-to-show `message` (the backend's
 *  human reason) on failure, and `meta` (token + roles) on success. */
export type ServerVerdict = SelfieVerdict & {
  message?: string;
  meta?: SelfieMeta;
};

/** The line to show for a failed verdict — the server's own message wins,
 *  otherwise the local reason copy. */
export function verdictMessage(v: SelfieVerdict & { message?: string }): string {
  return v.message ?? reasonLine(v.reasons);
}

/** Human, specific lines — drive the c2 subhead and the upload reject card. */
export const REASON_COPY: Record<SelfieReason, string> = {
  "no-face": "We couldn't spot a face. Center yourselves in the oval and try again.",
  "need-two-faces":
    "We need to see the grown-up and the little one together — get both faces in the oval.",
  "too-dark": "It's a little dark. Find brighter, even light and take another photo.",
  "too-bright": "That's a bit overexposed. Turn away from the strong light and try again.",
  "off-center": "Move so both faces sit inside the oval.",
  "face-too-small": "Come a little closer so your faces fill the oval.",
  blurry: "That came out blurry. Hold steady and take another.",
  obscured: "Something's covering a face. Clear it and try again.",
};

/** First reason as a sentence, with a friendly fallback. */
export function reasonLine(reasons: SelfieReason[]): string {
  return reasons.length > 0
    ? REASON_COPY[reasons[0]]
    : "That didn't quite work — let's try again.";
}

type MockOverride = "pass" | "fail" | "api-fail" | null;

/**
 * QA override so both branches are demoable without the face-detection weights:
 * `?selfie=pass|fail|api-fail` on the URL, or NEXT_PUBLIC_SELFIE_MOCK.
 * `fail` fails the local gate; `api-fail` passes local then fails the server.
 */
function mockOverride(): MockOverride {
  const fromEnv = process.env.NEXT_PUBLIC_SELFIE_MOCK;
  let value: string | null | undefined = fromEnv;
  if (typeof window !== "undefined") {
    value = new URLSearchParams(window.location.search).get("selfie") ?? fromEnv;
  }
  return value === "pass" || value === "fail" || value === "api-fail" ? value : null;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Decode a file to a canvas, downscaled to fit `maxDim` (for detection + luma). */
async function canvasFromFile(
  file: File,
  maxDim: number,
): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas;
}

/** Mean relative luminance (0–1), sampling every 16th pixel of the canvas. */
function meanLuminance(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.5;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 64) {
    sum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    n += 1;
  }
  return n ? sum / n : 0.5;
}

/**
 * Client-side gate on the captured/uploaded still: lighting, then a grown-up +
 * child (≥2 well-framed faces via lazily-loaded face-api). Never throws — on any
 * error it passes, so a browser quirk can't dead-end the flow (the server still
 * gates). The `?selfie=` override short-circuits it for QA.
 */
export async function localCheck(file: File): Promise<SelfieVerdict> {
  const override = mockOverride();
  if (override === "pass" || override === "api-fail") return { ok: true, reasons: [] };
  if (override === "fail") return { ok: false, reasons: ["need-two-faces"] };

  try {
    const canvas = await canvasFromFile(file, 640);
    const luma = meanLuminance(canvas);
    if (luma < 0.14) return { ok: false, reasons: ["too-dark"] };
    if (luma > 0.88) return { ok: false, reasons: ["too-bright"] };

    const faces = await countWellFramedFaces(canvas);
    if (faces === 0) return { ok: false, reasons: ["no-face"] };
    if (faces < REQUIRED_FACE_COUNT) return { ok: false, reasons: ["need-two-faces"] };
    return { ok: true, reasons: [] };
  } catch {
    return { ok: true, reasons: [] };
  }
}

/**
 * Server gate (authoritative) — POSTs the still to /photo-validation/check_photo.
 * A valid photo returns the derived roles + a validation_token on `meta` (which
 * /video/submit requires); a rejected one returns the backend's human `message`.
 * A network/service error is surfaced as a rejection so an unvalidated selfie is
 * never committed (the flow stays retryable). The `?selfie=` QA override still
 * short-circuits it so both branches are demoable without a backend.
 */
export async function uploadSelfie(file: File): Promise<ServerVerdict> {
  const override = mockOverride();
  if (override === "api-fail")
    return { ok: false, reasons: ["obscured"], message: REASON_COPY.obscured };
  if (override === "pass" || override === "fail") {
    await sleep(400);
    return { ok: true, reasons: [], meta: {} };
  }

  // Admin turned photo validation off → skip the server gate entirely. The
  // selfie commits with no token/roles, so /video/submit stores NULL roles —
  // which marks it an unverified photo. The client face gate (localCheck) still ran.
  if (!(await getPhotoValidationEnabled())) {
    return { ok: true, reasons: [], meta: {} };
  }

  try {
    const result = await checkPhoto(file);
    if (!result.valid) {
      return {
        ok: false,
        reasons: [],
        message: result.reason || result.message || reasonLine([]),
      };
    }
    return {
      ok: true,
      reasons: [],
      meta: {
        validationToken: result.validationToken,
        parentRole: result.parentRole,
        childRole: result.childRole,
      },
    };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "We couldn't check that photo just now. Please try again.";
    return { ok: false, reasons: [], message };
  }
}
