"use client";

import * as React from "react";

export type CameraStatus = "idle" | "starting" | "live" | "error";

export type CameraErrorKind =
  | "denied"
  | "not-found"
  | "in-use"
  | "insecure"
  | "unsupported"
  | "unknown";

export const CAMERA_ERROR_COPY: Record<
  CameraErrorKind,
  { title: string; body: string }
> = {
  denied: {
    title: "Camera access is off",
    body: "Allow camera access in your browser, or upload a photo instead.",
  },
  "not-found": {
    title: "No camera found",
    body: "We couldn't find a camera on this device. Upload a photo instead.",
  },
  "in-use": {
    title: "Camera is busy",
    body: "Another app is using your camera. Close it and retry, or upload a photo.",
  },
  insecure: {
    title: "Camera needs a secure connection",
    body: "The camera only works over HTTPS. Upload a photo instead.",
  },
  unsupported: {
    title: "Camera not supported",
    body: "This browser can't open the camera. Upload a photo instead.",
  },
  unknown: {
    title: "Couldn't open the camera",
    body: "Something went wrong. Retry, or upload a photo instead.",
  },
};

function mapError(err: unknown): CameraErrorKind {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "not-found";
    case "NotReadableError":
    case "TrackStartError":
      return "in-use";
    case "SecurityError":
      return "insecure";
    default:
      return "unknown";
  }
}

/**
 * Owns the camera MediaStream and its deterministic teardown. The stream lives
 * in a ref (React Compiler never memoizes refs; all mutation is in handlers).
 * A monotonic start id invalidates any in-flight `getUserMedia` when `stop()`
 * runs or a newer `start()` begins — so a stream that resolves after we've
 * moved on is stopped immediately rather than binding to a dead `<video>`.
 */
export function useCamera() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const startIdRef = React.useRef(0);

  const [status, setStatus] = React.useState<CameraStatus>("idle");
  const [error, setError] = React.useState<CameraErrorKind | null>(null);

  const stop = React.useCallback(() => {
    startIdRef.current += 1; // invalidate any in-flight start()
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const start = React.useCallback(async () => {
    const myId = (startIdRef.current += 1);
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("unsupported");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("error");
      setError("insecure");
      return;
    }

    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      if (myId !== startIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // Autoplay policies may reject; the muted+playsInline video still shows.
        }
      }
      setStatus("live");
    } catch (err) {
      if (myId !== startIdRef.current) return;
      setError(mapError(err));
      setStatus("error");
    }
  }, []);

  // Belt-and-suspenders: stop the hardware if the hook unmounts mid-stream.
  React.useEffect(() => {
    return () => {
      startIdRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return { videoRef, status, error, start, stop };
}
