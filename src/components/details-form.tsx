"use client";

import * as React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Camera, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  localCheck,
  reasonLine,
  uploadSelfie,
  verdictMessage,
  type SelfieMeta,
} from "@/lib/selfie-check";
import { submitVideo, ApiError } from "@/lib/api";
import { SelfieSourceSheet } from "@/components/selfie-source-sheet";

// Both overlays mount only on interaction, so code-split them out of the
// /details first-load bundle (face-api is already lazy inside capture-overlay).
const CaptureOverlay = dynamic(
  () => import("@/components/capture-overlay").then((m) => m.CaptureOverlay),
  { ssr: false },
);
const VerifyModal = dynamic(
  () => import("@/components/verify-modal").then((m) => m.VerifyModal),
  { ssr: false },
);

type Selfie = { file: File; url: string; meta: SelfieMeta | null };
/** A photo that failed a gate — its reason + a preview URL so the dropzone can
 *  show the shot the user just picked (not a stale committed one). */
type UploadReject = { reason: string; url: string };

/** Stable id so mashing Send OTP refreshes one toast instead of stacking. */
const SELFIE_TOAST_ID = "selfie-required";

/**
 * Details form — "Every Adventure Needs Heroes" (screen 5).
 *
 * A full-width dashed selfie dropzone plus three text fields. The text fields
 * use **native HTML validation only** (`required` / `pattern`) — the browser
 * shows its own messages on submit; there's no JS validation library and no
 * custom error copy. Tapping the dropzone opens a choice: take a selfie (the
 * guided camera overlay) or upload a photo; both run the localCheck →
 * uploadSelfie pipeline before committing, and a committed photo fills the
 * dropzone. The CTA is an **always-enabled** submit button: pressing an
 * incomplete form triggers the browser's native field warnings, and the
 * (non-native) selfie requirement is enforced in onSubmit — a missing selfie
 * reddens the dropzone and fires a toast (an overlay, so no layout shift) +
 * moves focus there, rather than a dead no-op. Only a valid form with a selfie
 * opens the OTP sheet.
 */
export function DetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selfie, setSelfie] = React.useState<Selfie | null>(null);
  const [choiceOpen, setChoiceOpen] = React.useState(false);
  const [captureMode, setCaptureMode] = React.useState<
    null | "camera" | "upload"
  >(null);
  const [otpOpen, setOtpOpen] = React.useState(false);
  // Phone + job id from a successful submit, handed to the OTP sheet.
  const [otpCtx, setOtpCtx] = React.useState<{ mobile: string; jobId?: number } | null>(
    null,
  );
  const [checking, setChecking] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<UploadReject | null>(null);
  // The selfie isn't a native form field, so native validation can't require
  // it. This flips true when the user submits without one (see onSubmit).
  const [selfieRequired, setSelfieRequired] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const selfieButtonRef = React.useRef<HTMLButtonElement | null>(null);

  // Release the preview object URL when it's replaced or the screen unmounts.
  React.useEffect(() => {
    if (!selfie) return;
    return () => URL.revokeObjectURL(selfie.url);
  }, [selfie]);

  // Same for the rejected-photo preview URL.
  React.useEffect(() => {
    const url = uploadError?.url;
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [uploadError]);

  const commitSelfie = (file: File, meta: SelfieMeta | null) => {
    setUploadError(null);
    setSelfieRequired(false);
    toast.dismiss(SELFIE_TOAST_ID);
    // Create the URL here, not inside the updater — updaters must be pure and
    // run twice under StrictMode (which would leak a blob). The [selfie] effect
    // revokes the previous URL when this replaces it.
    setSelfie({ file, url: URL.createObjectURL(file), meta });
  };

  const openPicker = () => fileInputRef.current?.click();

  // A rejected shot replaces whatever the dropzone was showing (the photo the
  // user just picked, plus its banner) and drops any prior committed selfie —
  // so what's shown and what's submittable stay in sync.
  const rejectSelfie = (file: File, reason: string) => {
    setSelfie(null);
    setUploadError({ reason, url: URL.createObjectURL(file) });
  };

  // Upload path: run the same two gates inline (spinner on the dropzone, reject
  // banner on fail) before committing.
  const onSelectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (!file) return;

    setUploadError(null);
    setChecking(true);
    try {
      const local = await localCheck(file);
      if (!local.ok) {
        rejectSelfie(file, reasonLine(local.reasons));
        return;
      }
      const server = await uploadSelfie(file);
      if (!server.ok) {
        rejectSelfie(file, verdictMessage(server));
        return;
      }
      commitSelfie(file, server.meta ?? null);
    } finally {
      setChecking(false);
    }
  };

  // Send OTP → POST /video/submit. The browser has already run native
  // validation on the text fields (the button is a submit), so this fires only
  // once they're valid; the selfie is the one non-native requirement, enforced
  // here. Submit sends the WhatsApp OTP and creates the job; on "otp_sent" we
  // open the verify sheet, and a returning verified user skips straight to
  // thank-you. Read the form values synchronously before any await (React
  // nulls event.currentTarget after the handler returns).
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A selfie may be mid-validation (checking): selfie is still null but one is
    // in flight — don't flash a false "missing selfie" error.
    if (checking || submitting) return;
    if (!selfie) {
      selfieButtonRef.current?.focus();
      // A rejected photo already shows its own banner ("choose another") — don't
      // stack a redundant toast/red border; only nudge when empty.
      if (!uploadError) {
        setSelfieRequired(true);
        toast.error("Add a selfie to continue.", { id: SELFIE_TOAST_ID });
      }
      return;
    }

    const data = new FormData(event.currentTarget);
    const parentName = String(data.get("name") ?? "").trim();
    const childName = String(data.get("childName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();

    setSubmitting(true);
    try {
      const res = await submitVideo({
        mobileNumber: phone,
        childName,
        parentName,
        parentRole: selfie.meta?.parentRole,
        childRole: selfie.meta?.childRole,
        worldSlug: searchParams.get("world") ?? "",
        storySlug: searchParams.get("story") ?? "",
        langCode: searchParams.get("lang") ?? "",
        consentAccepted: true,
        photo: selfie.file,
        validationToken: selfie.meta?.validationToken,
        utm: {
          source: searchParams.get("utm_source") ?? undefined,
          medium: searchParams.get("utm_medium") ?? undefined,
          campaign: searchParams.get("utm_campaign") ?? undefined,
        },
      });

      if (res.status === "otp_sent") {
        setOtpCtx({ mobile: phone, jobId: res.job_id });
        setOtpOpen(true);
      } else if (res.status === "video_created" || res.status === "verified") {
        // Already-verified returning user — no OTP step.
        router.push("/thank-you");
      } else if (res.status === "pending") {
        toast(res.message ?? "Your previous video is still being processed.");
      } else {
        toast(res.message ?? "Request received.");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const overlayOpen = choiceOpen || captureMode !== null || otpOpen;

  return (
    <>
      <form
        // The button is always enabled: native validation runs on the required
        // text fields first (the browser shows its own warnings), so this only
        // fires once they pass. The selfie is the one non-native requirement,
        // enforced inside handleSubmit, which then POSTs to /video/submit.
        onSubmit={handleSubmit}
        inert={overlayOpen}
        className="animate-rise mt-5 flex min-h-0 flex-1 flex-col [animation-delay:220ms]"
      >
        {/* Selfie — a dashed dropzone that opens the source choice. A rejected
            upload floats as a blurred banner over the TOP of the box (tap =
            re-pick); being a sibling (not nested in the dropzone) its tap can't
            trigger the source sheet or the change badge, and being absolute it
            never reflows the form. */}
        <div className="relative flex min-h-0 w-full flex-1 flex-col">
          <button
            ref={selfieButtonRef}
            type="button"
            onClick={() => setChoiceOpen(true)}
            disabled={checking}
            aria-label={selfie ? "Change your selfie" : "Add your selfie"}
            className="group relative flex min-h-24 w-full flex-1 items-center justify-center overflow-hidden rounded-panel transition duration-200 ease-out-soft focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 focus-visible:outline-none"
          >
            {uploadError ? (
              <>
                {/* The shot the user just picked (it failed a gate) — so they see
                    what was wrong. The banner sits over the top of it. */}
                <Image
                  src={uploadError.url}
                  alt="The photo you just selected, which needs another try"
                  fill
                  sizes="400px"
                  unoptimized
                  className="object-cover"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-panel bg-black/25 ring-1 ring-white/40 ring-inset"
                />
              </>
            ) : selfie ? (
              <>
                <Image
                  src={selfie.url}
                  alt="Your selected selfie"
                  fill
                  sizes="400px"
                  unoptimized
                  className="object-cover"
                />
                {/* Legibility scrim so the change badge reads over any photo. */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-panel bg-gradient-to-t from-black/45 to-transparent ring-1 ring-white/40 ring-inset"
                />
                <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-hero-red shadow-[0_4px_12px_rgba(0,0,0,0.4)] ring-2 ring-white transition-transform duration-200 ease-out-soft group-hover:scale-105">
                  <Camera aria-hidden className="size-4 text-white" strokeWidth={2.2} />
                </span>
              </>
            ) : (
              <span
                className={cn(
                  "flex size-full flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[10px] transition duration-200 ease-out-soft",
                  selfieRequired
                    ? "border-hero-red bg-hero-red/12"
                    : "border-white/45 bg-white/[0.07] group-hover:border-white/70 group-hover:bg-white/11",
                )}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out-soft group-hover:scale-105">
                  <Camera aria-hidden className="size-5" strokeWidth={2} />
                </span>
                <span className="text-[0.78rem] font-medium tracking-[0.14em] text-cloud uppercase">
                  Upload or click selfie
                </span>
              </span>
            )}

            {checking && (
              <span className="absolute inset-0 grid place-items-center rounded-panel bg-black/55">
                <Loader2 aria-hidden className="size-8 animate-spin text-white" />
              </span>
            )}
          </button>

          {/* Rejected-photo banner — pinned over the top of the box, backdrop-
              blurred for legibility over any photo. role="alert" announces the
              reason; the whole banner is a button that re-opens the file picker
              directly (its own onClick; nothing bubbles to the dropzone). */}
          {uploadError && (
            <div role="alert" className="absolute inset-x-2 top-2 z-10">
              <button
                type="button"
                onClick={openPicker}
                className="group/err flex w-full items-center gap-3 rounded-chip border border-hero-red/55 bg-black/55 px-3.5 py-2.5 text-left shadow-lift backdrop-blur-md transition duration-200 ease-out-soft hover:bg-black/65 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 focus-visible:outline-none"
              >
                <TriangleAlert
                  aria-hidden
                  className="size-5 shrink-0 text-hero-red-bright"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.82rem] leading-snug text-cloud">
                    {uploadError.reason}
                  </span>
                  <span className="mt-0.5 block text-[0.8rem] font-semibold text-hero-red-bright">
                    Choose another photo
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-hero-red-bright transition-transform duration-200 ease-out-soft group-hover/err:translate-x-0.5"
                />
              </button>
            </div>
          )}
        </div>

        {/* Both selfie errors avoid layout shift: the missing-selfie nudge is a
            toast (see onSubmit) + the red dropzone border, and a rejected upload
            is the blurred banner pinned over the box top (above). */}

        {/* Details — validation is native HTML only (required / pattern); the
            browser shows its own messages on submit. */}
        <div className="mt-5 flex shrink-0 flex-col gap-3">
          <Field
            label="Your name"
            name="name"
            placeholder="*Enter your name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={50}
          />
          <Field
            label="Your child's name"
            name="childName"
            placeholder="*Enter your child's name"
            required
            minLength={2}
            maxLength={50}
          />
          <Field
            label="Your phone number"
            name="phone"
            placeholder="*Enter your Phone number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            pattern="[0-9]{10}"
            minLength={10}
            maxLength={10}
          />
        </div>

        {/* WhatsApp helper */}
        <p className="mt-2.5 flex items-center gap-1.5 px-1 text-[0.8rem] text-mist">
          <span>*Your verification code will be sent on</span>
          <Image
            src="/whatsapp.png"
            alt=""
            width={20}
            height={20}
            className="inline-block size-[1.05rem]"
          />
          <span>Whatsapp.</span>
        </p>

        {/* Primary CTA — enabled so a press on an incomplete form triggers
            native field warnings (and the missing-selfie error above), never a
            dead no-op. Disabled only while the submit request is in flight to
            block a double-send. Hero red at all times. */}
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className={cn(
            "glass group relative mt-4 mb-1 flex h-14 shrink-0 items-center justify-center overflow-hidden rounded-pill px-6 text-[1.05rem] font-semibold tracking-wide text-cloud transition duration-200 ease-out-soft",
            "hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
            // `.glass` sets its own box-shadow and, being defined after the
            // utilities, clobbers a box-shadow `ring`, so the focus ring never
            // paints — use an `outline` instead (matches selfie-source-sheet).
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red-bright",
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-pill bg-hero-red/90 ring-1 ring-hero-red-bright ring-inset transition-colors duration-200 group-hover:bg-hero-red"
          />
          <span className="relative z-10 flex items-center">
            {submitting ? (
              <>
                Sending
                <Loader2 aria-hidden className="ml-2 size-5 animate-spin" />
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight
                  aria-hidden
                  className="ml-2 size-5 transition-transform duration-200 ease-out-soft group-hover:translate-x-1"
                />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Hidden upload input — kept OUTSIDE the form so it stays clickable while
          the form is `inert` behind an open overlay (triggered from the sheet). */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSelectFile}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      {choiceOpen && (
        <SelfieSourceSheet
          onTakeSelfie={() => {
            setChoiceOpen(false);
            setCaptureMode("camera");
          }}
          onUpload={() => {
            setChoiceOpen(false);
            setCaptureMode("upload");
          }}
          onClose={() => setChoiceOpen(false)}
        />
      )}

      {captureMode && (
        <CaptureOverlay
          mode={captureMode}
          onCommit={(file, meta) => {
            setCaptureMode(null);
            commitSelfie(file, meta);
          }}
          onClose={() => setCaptureMode(null)}
          onUploadFallback={() => {
            setCaptureMode(null);
            openPicker();
          }}
        />
      )}

      {otpOpen && (
        <VerifyModal
          mobile={otpCtx?.mobile ?? ""}
          onClose={() => setOtpOpen(false)}
        />
      )}
    </>
  );
}

type FieldProps = React.ComponentPropsWithoutRef<"input"> & {
  label: string;
};

/** Glass text input with an sr-only label; validation is native (HTML only). */
function Field({ label, className, ...props }: FieldProps) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "glass h-14 w-full rounded-input px-5 text-[1rem] text-cloud transition duration-200 ease-out-soft outline-none placeholder:text-mist",
          // Outline, not `ring`: `.glass`'s own box-shadow clobbers a box-shadow
          // ring (see selfie-source-sheet), so the ring would never paint.
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red-bright",
          className,
        )}
        {...props}
      />
    </div>
  );
}
