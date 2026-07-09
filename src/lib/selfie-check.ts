/**
 * Selfie validation pipeline — the seam both the capture overlay and the
 * upload path run a photo through. Two gates in series:
 *
 *   localCheck(file)   → client-side, free, instant   (this file, Phase-1 mock)
 *   uploadSelfie(file) → server, authoritative        (this file, Phase-1 stub)
 *
 * Committing a selfie requires BOTH to pass. Phase 2 swaps only the two
 * function bodies (real face-api on the still + real API POST); the types,
 * REASON_COPY, and every caller stay untouched.
 */
import { countWellFramedFaces, REQUIRED_FACE_COUNT } from "@/lib/face-gate";

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
 * Server gate (authoritative). Phase 1: a stub that resolves after a short
 * delay so the "checking" state reads like a real request. Phase 2: a multipart
 * POST normalised to a SelfieVerdict.
 */
export async function uploadSelfie(file: File): Promise<SelfieVerdict> {
  void file;
  await sleep(650);
  if (mockOverride() === "api-fail") return { ok: false, reasons: ["obscured"] };
  return { ok: true, reasons: [] };
}
