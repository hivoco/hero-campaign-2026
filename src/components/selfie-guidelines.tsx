"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowRight, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { DETAILS_SCROLL_ID, useScrollLock } from "@/hooks/use-scroll-lock";

/** How long the do's & don'ts show before auto-advancing to the source choice. */
const DURATION_MS = 4000;

const TIPS = [
  "Make sure both faces are clearly visible.",
  "Use good lighting — avoid shadows or backlight.",
  "Nothing covering your face.",
];

const PILL =
  "flex h-14 w-full items-center justify-center gap-2 rounded-pill border border-white/80 text-[1rem] font-semibold text-white transition duration-200 ease-out-soft hover:bg-white hover:text-ink active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none";

/** Client-only `prefers-reduced-motion` (lint-clean: no setState in an effect). */
function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

type Props = {
  /** Advance to the Upload / Take-selfie choice (auto after 3s, or via Continue). */
  onDone: () => void;
  /** Dismiss without proceeding (Escape / close button). */
  onClose: () => void;
};

/**
 * Selfie guidelines — the do's & don'ts (correct/incorrect photo) popup shown
 * first when the user taps the selfie dropzone. A top progress bar fills over 3s
 * and then auto-advances to the source choice; a Continue button lets impatient
 * users skip the wait. Under prefers-reduced-motion the bar reads full at once
 * and there's no timed advance (Continue is always available).
 */
export function SelfieGuidelines({ onDone, onClose }: Props) {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = React.useState(0);
  const displayed = reduced ? 1 : progress;

  // Freeze the /details scroll container behind the overlay.
  useScrollLock(DETAILS_SCROLL_ID);

  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const continueRef = React.useRef<HTMLButtonElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();

  const onDoneRef = React.useRef(onDone);
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onDoneRef.current = onDone;
    onCloseRef.current = onClose;
  });

  // rAF-driven 3s fill → auto-advance. Skipped under reduced motion.
  React.useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION_MS);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDoneRef.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Focus the Continue button, trap focus, Escape closes, restore focus on unmount.
  React.useEffect(() => {
    const restore = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(
      () => (continueRef.current ?? closeRef.current)?.focus(),
      40,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
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
      restore?.focus?.();
    };
  }, []);

  // Portal to <body> so the overlay escapes the /details `#details-scroll`
  // stacking context (z-10) — otherwise the page's top-left back button (z-30)
  // paints over this popup even though it's z-50 within that trapped context.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="animate-fade fixed inset-0 z-50 flex justify-center bg-black/85 backdrop-blur-sm"
    >
      <div className="relative flex h-full w-full max-w-110 flex-col overflow-hidden bg-black px-6 pt-16 pb-8 text-white">
        <h2 id={titleId} className="sr-only">
          Photo do&apos;s and don&apos;ts
        </h2>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-9 right-4 z-20 flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
        >
          <X aria-hidden className="size-5" />
        </button>

        {/* Top progress bar — fills over 3s, then auto-advances. */}
        <div
          aria-hidden
          className="absolute inset-x-6 top-5 h-2.5 rounded-panel bg-[#3D3D3D]"
        >
          <div
            className="h-full rounded-panel bg-white"
            style={{ width: `${displayed * 100}%` }}
          />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="relative mx-auto aspect-square w-full max-w-76">
            <Image
              src="/dos-donts.png"
              alt="Examples: a clear, well-lit photo of an adult and child together is correct; blurry, face-covered, and dark photos are wrong."
              fill
              sizes="304px"
              preload
              className="object-contain"
            />
          </div>

          <ul className="mx-auto flex max-w-xs flex-col gap-2.5">
            {TIPS.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-2.5 text-[0.9rem] leading-snug text-white/85"
              >
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-white" strokeWidth={2.5} />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        

        <button
      type="button"
      onClick={onDone}
      className="glass group mt-2 flex h-9 w-fit mx-auto items-center justify-center rounded-pill bg-white/15! px-6 text-lg font-bold leading-none tracking-normal text-white transition duration-200 ease-out-soft animate-rise [animation-delay:340ms] hover:-translate-y-0.5 hover:bg-white/25! hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:translate-y-0 active:scale-[0.99]"
    >
      Skip & Continue
    </button>
      </div>
    </div>,
    document.body,
  );
}
