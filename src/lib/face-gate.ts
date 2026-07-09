/**
 * Face detection gate — the client half of the hybrid selfie check.
 *
 * `@vladmandic/face-api` + its old tiny weights are loaded **lazily** (dynamic
 * import, models fetched from `/models`) the first time we need them, so none of
 * this lands in the `/details` bundle. Used two ways:
 *   • live — counting well-framed faces on the camera each tick (Capture gate)
 *   • still — the same count inside `localCheck` on the captured/uploaded photo
 *
 * The campaign needs a grown-up AND a child, so the bar is TWO well-framed faces.
 */
type FaceApi = typeof import("@vladmandic/face-api");

/** Single cached load attempt — a rejection sticks (→ self-healing fallback). */
let loadPromise: Promise<FaceApi> | null = null;

export function loadFaceModels(): Promise<FaceApi> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      // Only the detector is needed — we count boxes, never landmarks.
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      return faceapi;
    })();
  }
  return loadPromise;
}

/** Two faces (adult + child), both reasonably sized and inside the frame. */
export const REQUIRED_FACE_COUNT = 2;

/** How many detected faces are well-framed enough to count. */
export async function countWellFramedFaces(
  input: HTMLVideoElement | HTMLCanvasElement,
): Promise<number> {
  const faceapi = await loadFaceModels();

  const width =
    input instanceof HTMLVideoElement ? input.videoWidth : input.width;
  const height =
    input instanceof HTMLVideoElement ? input.videoHeight : input.height;
  if (!width || !height) return 0;

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.4,
  });
  const detections = await faceapi.detectAllFaces(input, options);

  let good = 0;
  for (const detection of detections) {
    const box = detection.box;
    const widthRatio = box.width / width;
    const heightRatio = box.height / height;
    // Two side-by-side faces are each off-centre, so we only require that a
    // face is a sensible size and not clipped by the frame edge.
    const inFrame =
      box.x >= -width * 0.02 &&
      box.y >= -height * 0.02 &&
      box.x + box.width <= width * 1.02 &&
      box.y + box.height <= height * 1.02;
    const sizeOk =
      widthRatio > 0.1 && widthRatio < 0.75 && heightRatio > 0.1 && heightRatio < 0.85;
    if (inFrame && sizeOk && detection.score > 0.4) good += 1;
  }
  return good;
}
