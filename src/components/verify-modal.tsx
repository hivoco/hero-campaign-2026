"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { verifyOtp, resendOtp, ApiError } from "@/lib/api";
import { DETAILS_SCROLL_ID, useScrollLock } from "@/hooks/use-scroll-lock";

const OTP_LENGTH = 6;

type Props = {
  onClose: () => void;
  /** The phone number the OTP was sent to (from the submit response context). */
  mobile: string;
};

/**
 * Verify Your Number — the OTP + consent sheet (screen 7).
 *
 * Mounted only while open (fresh state each time), it rises as a light
 * bottom-sheet over the blurred /details screen (the reference "pop-up"). Dense
 * legal consent text reads far better dark-on-white, so this is the one
 * deliberately-light surface in the otherwise dark campaign. The "Submit &
 * Generate" pill unlocks once all six digits are entered (consent is captured
 * earlier, on the details form), then routes to the thank-you screen.
 */
export function VerifyModal({ onClose, mobile }: Props) {
  const router = useRouter();
  const [digits, setDigits] = React.useState<string[]>(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [resending, setResending] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();
  const submitHintId = React.useId();

  // Freeze the /details scroll container so it can't scroll behind the sheet.
  useScrollLock(DETAILS_SCROLL_ID);

  const otp = digits.join("");

  // Keep the latest onClose without re-running the mount-only focus effect.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  // On mount: focus the first box, keep focus inside the dialog, Escape closes,
  // and focus returns to the trigger on unmount.
  React.useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => inputsRef.current[0]?.focus(), 60);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, [href], [tabindex]:not([tabindex="-1"])',
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
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(index, OTP_LENGTH - 1));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  const handleChange = (index: number, value: string) => {
    const raw = value.replace(/\D/g, "");
    setDigits((prev) => {
      const next = [...prev];
      if (raw === "") {
        next[index] = "";
        return next;
      }
      for (let k = 0; k < raw.length && index + k < OTP_LENGTH; k += 1) {
        next[index + k] = raw[k];
      }
      return next;
    });
    if (raw !== "") focusBox(index + raw.length);
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const emptyHere = digits[index] === "";
      setDigits((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
        }
        return next;
      });
      // Focus outside the updater (updaters must stay pure; StrictMode runs them twice).
      if (emptyHere && index > 0) focusBox(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!text) return;
    event.preventDefault();
    setDigits(() => {
      const next = Array(OTP_LENGTH).fill("");
      for (let k = 0; k < text.length; k += 1) next[k] = text[k];
      return next;
    });
    focusBox(text.length);
  };

  const canSubmit = /^\d{6}$/.test(otp) && !submitting;

  // What's blocking submit — announced so the disabled pill isn't a dead end.
  const submitHint = !/^\d{6}$/.test(otp) ? "Enter all 6 digits to continue." : "";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await verifyOtp(mobile, otp);
      if (res.status === "verified") {
        // Navigating away unmounts this modal — leave `submitting` true so the
        // button stays busy through the transition.
        router.push("/thank-you");
        return;
      }
      toast.error(res.message ?? "Couldn't verify that code. Please try again.");
      setSubmitting(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Couldn't verify that code. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      const res = await resendOtp(mobile);
      toast.success(res.message ?? "A new code is on its way.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Couldn't resend the code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      ref={dialogRef}
    >
      {/* Backdrop — blurs and dims the details screen behind the sheet. */}
      <button
        type="button"
        aria-label="Close verification"
        tabIndex={-1}
        onClick={onClose}
        className="animate-fade absolute inset-0 cursor-default bg-ink/55 backdrop-blur-md"
      />

      <div className="relative flex h-full w-full max-w-110 flex-col justify-end">
        <form
          onSubmit={onSubmit}
          className="animate-sheet-up relative flex max-h-[92dvh] flex-col overflow-hidden rounded-t-sheet bg-white text-ink shadow-[0_-16px_50px_rgba(0,0,0,0.55)]"
        >
          {/* Tappable close — the backdrop tap / Esc aren't discoverable on a
              phone, so give an explicit control back to /details. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to details"
            className="absolute top-3 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-ink/5 text-ink/60 transition duration-200 hover:bg-ink/10 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:outline-none active:scale-95"
          >
            <X aria-hidden className="size-5" strokeWidth={2.2} />
          </button>

          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-ink/15" />

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-3">
            <h2
              id={titleId}
              className="display text-center text-[2rem] leading-none text-ink"
            >
              Verify Your Number
            </h2>
            <p id={descId} className="mt-2 text-center text-[0.95rem] text-ink/70">
              Enter the code we sent to your WhatsApp.
            </p>

            {/* Six-digit code */}
            <div className="mt-6 flex justify-center gap-2.5">
              {digits.map((digit, index) => (
                <input
                  // Fixed-length, positional inputs — index is a stable key here.
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  value={digit}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  onFocus={(event) => event.target.select()}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  placeholder="-"
                  aria-label={`Verification code digit ${index + 1}`}
                  className="h-14 w-12 rounded-chip border border-ink/20 bg-white text-center text-[1.5rem] font-semibold text-ink tabular-nums shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition duration-150 placeholder:text-ink/25 focus:border-hero-red focus:ring-2 focus:ring-hero-red/30"
                />
              ))}
            </div>

            {/* Resend — the OTP is sent by the submit that opened this sheet; a
                resend re-requests one (backend rate-limits to 3 / 10 min). */}
            <p className="mt-4 text-center text-[0.85rem] text-ink/60">
              Didn&apos;t get the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-hero-red underline-offset-2 transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red"
              >
                {resending ? "Sending…" : "Resend"}
              </button>
            </p>
          </div>

          {/* Pinned submit */}
          <div className="shrink-0 border-t border-ink/10 px-6 pt-3 pb-5">
            {!canSubmit && submitHint && (
              <p
                id={submitHintId}
                aria-live="polite"
                className="mb-2 text-center text-[0.78rem] text-ink/60"
              >
                {submitHint}
              </p>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              aria-describedby={!canSubmit && submitHint ? submitHintId : undefined}
              className={cn(
                "group flex h-14 w-full items-center justify-center rounded-pill text-[1.05rem] font-semibold text-white transition duration-200 ease-out-soft",
                "focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none",
                canSubmit
                  ? "bg-[#E95063] shadow-[0_10px_24px_rgba(233,80,99,0.35)] hover:bg-[#ED6475] hover:shadow-[0_12px_28px_rgba(233,80,99,0.45)] active:scale-[0.99]"
                  : "cursor-not-allowed bg-[#E95063]/35",
              )}
            >
              {submitting ? (
                <>
                  Verifying
                  <Loader2 aria-hidden className="ml-2 size-5 animate-spin" />
                </>
              ) : (
                <>
                  Submit &amp; Generate
                  <ArrowRight
                    aria-hidden
                    className="ml-2 size-5 transition-transform duration-200 ease-out-soft group-enabled:group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
