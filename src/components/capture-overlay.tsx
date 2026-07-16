"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowRight,
  ImageUp,
  Loader2,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DETAILS_SCROLL_ID, useScrollLock } from "@/hooks/use-scroll-lock";
import {
  CAMERA_ERROR_COPY,
  type CameraErrorKind,
  type CameraStatus,
  useCamera,
} from "@/hooks/use-camera";
import {
  localCheck,
  uploadSelfie,
  verdictMessage,
  type SelfieMeta,
  type SelfieVerdict,
} from "@/lib/selfie-check";
import {
  countWellFramedFaces,
  loadFaceModels,
  REQUIRED_FACE_COUNT,
} from "@/lib/face-gate";

/** The live two-face gate. Set false to fall back to "enabled when live". */
const FACE_GATE_ENABLED: boolean = true;

/** Camera-mode intro: the top progress bar fills over this long, then the
 *  camera opens on its own (no tap). Upload mode never auto-advances. */
const INTRO_AUTOSTART_MS = 8000;

const BASE_TIPS = [
  "Make sure your face is clearly visible.",
  "Ensure no objects covering your face or body.",
  "Use good lighting and avoid shadows or backlight.",
];
const CAMERA_TIPS = [...BASE_TIPS, "When ready, say cheers and tap “Capture”."];
const UPLOAD_TIPS = [...BASE_TIPS, "Pick a clear, recent photo of you both together."];

type Step = "intro" | "camera" | "checking" | "reject" | "accept";
type Shot = { file: File; previewUrl: string };

type Props = {
  /** "camera" runs the live capture; "upload" shows the same intro then hands
   *  off to the file picker via onUploadFallback. */
  mode?: "camera" | "upload";
  /** Called with the passing selfie + its server metadata (validation token +
   *  derived roles) on "Continue" (parent commits + advances). */
  onCommit: (file: File, meta: SelfieMeta | null) => void;
  onClose: () => void;
  /** No-camera escape hatch AND the upload-mode hand-off → parent opens picker. */
  onUploadFallback: () => void;
};

/**
 * Selfie capture — a full-screen dark overlay running the c0–c3 flow:
 * instructions → live camera → checking → wrong/correct. Mounted only while
 * open (fresh state per open), it clones verify-modal's dialog conventions
 * (focus trap, Escape, restore focus). The live preview is CSS-mirrored for
 * natural framing, and the capture canvas mirrors to match — so the saved
 * file looks the same as the live preview.
 */
export function CaptureOverlay({
  mode = "camera",
  onCommit,
  onClose,
  onUploadFallback,
}: Props) {
  const [step, setStep] = React.useState<Step>("intro");
  const [shot, setShot] = React.useState<Shot | null>(null);
  const [verdict, setVerdict] = React.useState<
    (SelfieVerdict & { message?: string }) | null
  >(null);
  // Server metadata (validation token + roles) from a passing check_photo,
  // handed to onCommit so the details form can submit with it.
  const [meta, setMeta] = React.useState<SelfieMeta | null>(null);
  const [faceReady, setFaceReady] = React.useState(false);
  const [gateReady, setGateReady] = React.useState(false); // models loaded
  const [gateFailed, setGateFailed] = React.useState(false); // → fall back to live
  const [startNonce, setStartNonce] = React.useState(0);

  const { videoRef, status, error, start, stop } = useCamera();

  // Freeze the /details scroll container so it can't scroll behind the overlay.
  useScrollLock(DETAILS_SCROLL_ID);

  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const primaryRef = React.useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();

  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  const onUploadFallbackRef = React.useRef(onUploadFallback);
  React.useEffect(() => {
    onUploadFallbackRef.current = onUploadFallback;
  });

  // Focus trap + Escape + restore focus to the trigger on unmount.
  React.useEffect(() => {
    const restore = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restore?.focus?.();
    };
  }, []);

  // Single-owner camera lifecycle: live iff step === "camera". Teardown fires on
  // capture, any step change, retake (startNonce), close, and unmount. While
  // live, a detection loop counts well-framed faces to gate the Capture button.
  React.useEffect(() => {
    if (step !== "camera") return;
    start();
    if (!FACE_GATE_ENABLED) return () => stop();

    let cancelled = false;
    let detecting = false;
    let failures = 0;

    // Give up on the live gate: fall back to "enabled when live" and stop the
    // loop (so a broken model load doesn't spin a failing task forever).
    const abandonGate = () => {
      if (cancelled) return;
      setGateFailed(true);
      window.clearInterval(interval);
    };

    loadFaceModels()
      .then(() => {
        if (!cancelled) setGateReady(true);
      })
      .catch(abandonGate);

    const interval = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || detecting) {
        return;
      }
      detecting = true;
      try {
        const count = await countWellFramedFaces(video);
        failures = 0;
        if (!cancelled) setFaceReady(count >= REQUIRED_FACE_COUNT);
      } catch {
        // Tolerate isolated glitches; only abandon after several in a row.
        failures += 1;
        if (failures >= 3) abandonGate();
      } finally {
        detecting = false;
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      setFaceReady(false);
      stop();
    };
  }, [step, startNonce, start, stop, videoRef]);

  // Release the captured preview URL when it's replaced or the overlay closes.
  React.useEffect(() => {
    if (!shot) return;
    return () => URL.revokeObjectURL(shot.previewUrl);
  }, [shot]);

  // Run the two-gate pipeline whenever we enter "checking".
  React.useEffect(() => {
    if (step !== "checking" || !shot) return;
    let alive = true;
    (async () => {
      const local = await localCheck(shot.file);
      if (!alive) return;
      if (!local.ok) {
        setVerdict(local);
        setStep("reject");
        return;
      }
      const server = await uploadSelfie(shot.file);
      if (!alive) return;
      if (!server.ok) {
        setVerdict(server);
        setStep("reject");
        return;
      }
      setMeta(server.meta ?? null);
      setVerdict({ ok: true, reasons: [] });
      setStep("accept");
    })();
    return () => {
      alive = false;
    };
  }, [step, shot]);

  // Move focus to each step's primary control as it appears. When there isn't a
  // focusable one yet (camera intro auto-advances with no button; the Capture
  // button starts disabled), fall back to the close button so focus always
  // enters the dialog rather than stranding on the inert background trigger.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const primary = primaryRef.current;
      if (primary && !primary.disabled) primary.focus();
      else closeButtonRef.current?.focus();
    }, 40);
    return () => window.clearTimeout(id);
  }, [step]);

  // Intro → live camera (capture mode), or straight to the file picker (upload
  // mode). The user taps to proceed — no auto-advance timer.
  const introProceed = React.useCallback(() => {
    if (mode === "upload") onUploadFallbackRef.current();
    else setStep("camera");
  }, [mode]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || status !== "live") return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror horizontally so the saved photo matches the mirrored live preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setShot({ file, previewUrl: URL.createObjectURL(blob) });
        setStep("checking");
      },
      "image/jpeg",
      0.92,
    );
  };

  const retake = () => {
    setShot(null);
    setVerdict(null);
    setMeta(null);
    setStartNonce((n) => n + 1);
    setStep("camera");
  };

  const gated = FACE_GATE_ENABLED && !gateFailed;
  const captureEnabled = gated ? faceReady : status === "live";
  const cameraHint =
    status !== "live"
      ? "Starting camera…"
      : gated
        ? !gateReady
          ? "Getting ready…"
          : faceReady
            ? "Looking good — say cheers and tap Capture."
            : "Fit the grown-up and child inside the oval."
        : "Fit the grown-up and child inside the oval, then tap Capture.";

  // Live viewfinder colour: only once the gate is actively running.
  const ovalRing: OvalRing =
    gated && status === "live" && gateReady
      ? faceReady
        ? "live-good"
        : "live-bad"
      : "dashed";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="animate-fade fixed inset-0 z-50 flex justify-center bg-black/85 backdrop-blur-sm"
    >
      <h2 id={titleId} className="sr-only">
        {mode === "upload" ? "Add your selfie" : "Take a selfie with your child"}
      </h2>

      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-black text-white">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="absolute top-9 right-4 z-20 flex size-11 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
        >
          <X aria-hidden className="size-5" />
        </button>

        {step === "intro" && (
          <IntroStep
            mode={mode}
            onOpen={introProceed}
            tips={mode === "upload" ? UPLOAD_TIPS : CAMERA_TIPS}
            primaryRef={primaryRef}
          />
        )}

        {step === "camera" &&
          (error ? (
            <CameraErrorPanel
              kind={error}
              onRetry={() => setStartNonce((n) => n + 1)}
              onUpload={onUploadFallback}
              primaryRef={primaryRef}
            />
          ) : (
            <CameraStep
              videoRef={videoRef}
              status={status}
              captureEnabled={captureEnabled}
              hint={cameraHint}
              ovalRing={ovalRing}
              onCapture={capture}
              primaryRef={primaryRef}
            />
          ))}

        {(step === "checking" || step === "reject" || step === "accept") && (
          <ResultStep
            step={step}
            shot={shot}
            verdict={verdict}
            onRetake={retake}
            onContinue={() => shot && onCommit(shot.file, meta)}
            primaryRef={primaryRef}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const PILL =
  "flex h-14 w-full items-center justify-center gap-2 rounded-pill border border-white/80 text-[1rem] font-semibold text-white transition duration-200 ease-out-soft hover:bg-white hover:text-ink active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-white";

const PILL_GHOST =
  "flex h-12 w-full items-center justify-center gap-2 rounded-pill text-[0.95rem] font-medium text-white/70 transition duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none";

type OvalRing = "dashed" | "live-bad" | "live-good" | "red" | "green";

function Oval({
  ring,
  children,
}: {
  ring: OvalRing;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-[74%] max-w-[17.5rem] overflow-hidden rounded-[50%] bg-white/[0.04] transition-[border-color,box-shadow] duration-300 ease-out-soft",
        ring === "dashed" && "border-[3px] border-dashed border-white/70",
        // Live framing feedback: red = not two well-framed faces yet, green = good.
        ring === "live-bad" &&
          "border-[3px] border-dashed border-hero-red shadow-[0_0_26px_rgba(237,28,36,0.3)]",
        ring === "live-good" &&
          "border-[3px] border-dashed border-success shadow-[0_0_26px_rgba(34,197,94,0.42)]",
        ring === "red" && "border-4 border-hero-red",
        ring === "green" && "border-4 border-success",
      )}
    >
      {children}
    </div>
  );
}

function TipList({ tips }: { tips: string[] }) {
  return (
    <ul className="mx-auto max-w-[19rem] space-y-1.5 text-[0.82rem] leading-snug text-white/75">
      {tips.map((tip) => (
        <li key={tip} className="flex gap-2">
          <span
            aria-hidden
            className="mt-[0.42rem] size-1 shrink-0 rounded-full bg-white/45"
          />
          {tip}
        </li>
      ))}
    </ul>
  );
}

/** Tracks the user's `prefers-reduced-motion` setting (client-only). */
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function IntroStep({
  mode,
  onOpen,
  tips,
  primaryRef,
}: {
  mode: "camera" | "upload";
  onOpen: () => void;
  tips: string[];
  primaryRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const isCamera = mode === "camera";
  const reduced = usePrefersReducedMotion();
  // Under reduced motion the bar reads as full at once (no timed advance);
  // otherwise it fills off the rAF loop below.
  const [rafProgress, setRafProgress] = React.useState(0);
  const progress = reduced ? 1 : rafProgress;
  const done = progress >= 1;

  // Latest onOpen without re-arming the timer if the parent re-renders.
  const onOpenRef = React.useRef(onOpen);
  React.useEffect(() => {
    onOpenRef.current = onOpen;
  });

  // The top bar fills off elapsed time via an rAF loop (so the visual matches the
  // hand-off). On completion camera mode opens the camera on its own; upload mode
  // can't auto-open a file dialog (browsers need a user gesture), so it reveals
  // the "Choose a photo" button instead. Under prefers-reduced-motion we skip the
  // timed auto-advance entirely and let the user tap to proceed (an "Open camera"
  // button in camera mode too) — honouring the motion preference and giving
  // slow readers an untimed path (WCAG 2.2.1 Timing Adjustable).
  React.useEffect(() => {
    if (reduced) return; // no timed auto-advance under reduced motion
    let raf = 0;
    let startedAt = 0;
    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const p = Math.min(1, (now - startedAt) / INTRO_AUTOSTART_MS);
      setRafProgress(p);
      if (p >= 1) {
        if (isCamera) onOpenRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isCamera, reduced]);

  // A tap button is shown for upload mode always, and for camera mode only under
  // reduced motion (where it replaces the auto-advance). Focus it as it appears.
  const showTapButton = !isCamera || reduced;
  React.useEffect(() => {
    if (showTapButton && done) primaryRef.current?.focus();
  }, [showTapButton, done, primaryRef]);

  return (
    <div className="flex h-full flex-col px-6 pt-16 pb-8">
      {/* Top progress bar — present in both modes. Inset from the top + sides,
          20px-rounded with a solid #3D3D3D (empty) track and a rounded white fill
          (design ref). Width-driven (not scaleX) so the fill keeps a clean cap. */}
      <div
        aria-hidden
        className="absolute inset-x-6 top-5 h-2.5 rounded-panel bg-[#3D3D3D]"
      >
        <div
          className="h-full rounded-panel bg-white"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-8">
        <div className="relative mx-auto aspect-square w-full max-w-[19rem]">
          <Image
            src="/dos-donts.png"
            alt="Examples: a clear, well-lit photo of an adult and child together is correct; blurry, face-covered, and dark photos are wrong."
            fill
            sizes="304px"
            preload
            className="object-contain"
          />
        </div>
        <TipList tips={tips} />
      </div>

      {/* Camera mode auto-advances when the bar fills (no button). Upload mode
          can't auto-open a file dialog, so it reveals a tap button once the bar
          ends — that tap is the gesture that opens the picker. Under reduced
          motion neither mode auto-advances, so camera mode gets a tap button
          too. The h-14 slot is reserved so the button appearing doesn't shift
          the layout. */}
      {showTapButton && (
        <div className="h-14">
          {done && (
            <button
              ref={primaryRef}
              type="button"
              onClick={onOpen}
              className={cn(PILL, "animate-rise")}
            >
              {isCamera ? "Open camera" : "Choose a photo"}
            </button>
          )}
        </div>
      )}

      {/* TODO(remove before launch): testing-only shortcut that zeroes the 8s
          countdown — advances to the next step (camera / picker) right away via
          onOpen, exactly like the bar reaching 100%. Keeps the real capture
          flow; it doesn't skip capture. Left on prod preview links for now. */}
      <button
        type="button"
        onClick={onOpen}
        className="mx-auto mt-3 flex items-center gap-1.5 rounded-pill border border-dashed border-white/35 px-4 py-1.5 text-[0.75rem] font-medium tracking-wide text-white/55 transition duration-200 hover:border-white/60 hover:text-white/90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        Skip the wait
        <ArrowRight aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}

function CameraStep({
  videoRef,
  status,
  captureEnabled,
  hint,
  ovalRing,
  onCapture,
  primaryRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  captureEnabled: boolean;
  hint: string;
  ovalRing: OvalRing;
  onCapture: () => void;
  primaryRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="flex h-full flex-col px-6 pt-16 pb-8">
      <div className="flex flex-1 items-center justify-center">
        <Oval ring={ovalRing}>
          {/* Preview is CSS-mirrored so it feels like a mirror (left hand on
              the left). The capture canvas mirrors to match, so the saved file
              looks the same as this preview. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover"
          />
          {status !== "live" && (
            <div className="absolute inset-0 grid place-items-center bg-black/50 text-[0.85rem] text-white/70">
              Starting camera…
            </div>
          )}
        </Oval>
      </div>

      <p
        aria-live="polite"
        className="mx-auto mb-5 max-w-[19rem] text-center text-[0.85rem] text-white/70"
      >
        {hint}
      </p>

      <TipList tips={CAMERA_TIPS} />

      <button
        ref={primaryRef}
        type="button"
        onClick={onCapture}
        disabled={!captureEnabled}
        className={cn(PILL, "mt-6")}
      >
        Capture
      </button>
    </div>
  );
}

function ResultStep({
  step,
  shot,
  verdict,
  onRetake,
  onContinue,
  primaryRef,
}: {
  step: "checking" | "reject" | "accept";
  shot: Shot | null;
  verdict: (SelfieVerdict & { message?: string }) | null;
  onRetake: () => void;
  onContinue: () => void;
  primaryRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const ring = step === "accept" ? "green" : step === "reject" ? "red" : "dashed";

  return (
    <div className="flex h-full flex-col px-6 pt-16 pb-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <Oval ring={ring}>
          {shot && (
            <Image
              src={shot.previewUrl}
              alt="Your selfie"
              fill
              sizes="280px"
              unoptimized
              className="object-cover"
            />
          )}
          {step === "checking" && (
            <div className="absolute inset-0 grid place-items-center bg-black/45">
              <Loader2 aria-hidden className="size-8 animate-spin text-white" />
            </div>
          )}
        </Oval>

        <div aria-live="assertive" className="min-h-[4rem] px-2 text-center">
          {step === "checking" && (
            <p className="text-[0.95rem] text-white/75">Checking your photo…</p>
          )}
          {step === "reject" && (
            <>
              <h3 className="display text-[1.7rem] text-white">
                Oops! Let&apos;s Try Again
              </h3>
              <p className="mx-auto mt-2 max-w-[19rem] text-[0.9rem] leading-snug text-white/75">
                {verdictMessage(verdict ?? { ok: false, reasons: [] })}
              </p>
            </>
          )}
          {step === "accept" && (
            <>
              <h3 className="display text-[1.7rem] text-white">Perfect!</h3>
              <p className="mt-2 text-[0.9rem] text-white/75">
                You&apos;re ready to enter the world.
              </p>
            </>
          )}
        </div>
      </div>

      {step === "checking" && <div className="h-14" aria-hidden />}
      {step === "reject" && (
        <button ref={primaryRef} type="button" onClick={onRetake} className={PILL}>
          <RotateCcw aria-hidden className="size-5" />
          Retake
        </button>
      )}
      {step === "accept" && (
        <button
          ref={primaryRef}
          type="button"
          onClick={onContinue}
          className={PILL}
        >
          Continue
          <ArrowRight aria-hidden className="size-5" />
        </button>
      )}
    </div>
  );
}

function CameraErrorPanel({
  kind,
  onRetry,
  onUpload,
  primaryRef,
}: {
  kind: CameraErrorKind;
  onRetry: () => void;
  onUpload: () => void;
  primaryRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const copy = CAMERA_ERROR_COPY[kind];
  const canRetry = kind !== "insecure" && kind !== "unsupported";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-white/10">
        <TriangleAlert aria-hidden className="size-7 text-white/80" />
      </div>
      <div>
        <h3 className="display text-[1.6rem] text-white">{copy.title}</h3>
        <p className="mx-auto mt-2 max-w-[18rem] text-[0.9rem] leading-snug text-white/70">
          {copy.body}
        </p>
      </div>
      <div className="mt-1 flex w-full max-w-[18rem] flex-col gap-3">
        <button ref={primaryRef} type="button" onClick={onUpload} className={PILL}>
          <ImageUp aria-hidden className="size-5" />
          Upload a photo instead
        </button>
        {canRetry && (
          <button type="button" onClick={onRetry} className={PILL_GHOST}>
            <RefreshCw aria-hidden className="size-4" />
            Retry camera
          </button>
        )}
      </div>
    </div>
  );
}
