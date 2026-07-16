"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Camera, ImageUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { DETAILS_SCROLL_ID, useScrollLock } from "@/hooks/use-scroll-lock";

type Props = {
  onTakeSelfie: () => void;
  onUpload: () => void;
  onClose: () => void;
};

/**
 * How do you want to add your selfie? A short dark bottom-sheet offering the
 * camera flow or a file upload. Clones verify-modal's sheet choreography
 * (backdrop fade, slide-up, focus trap, Escape, restore focus).
 */
export function SelfieSourceSheet({ onTakeSelfie, onUpload, onClose }: Props) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const firstRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();
  // While closing, the sheet plays its slide-down/fade-out exit, then unmounts.
  const [closing, setClosing] = React.useState(false);

  // Freeze the /details scroll container so it can't scroll behind the sheet.
  useScrollLock(DETAILS_SCROLL_ID);

  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Play the exit animation, then hand control back to the parent (which
  // unmounts us). Guarded so a double-dismiss can't stack two timers.
  const closeTimerRef = React.useRef<number | null>(null);
  const requestClose = React.useCallback(() => {
    if (closeTimerRef.current !== null) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => onCloseRef.current(), 280);
  }, []);

  React.useEffect(() => {
    const restore = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => firstRef.current?.focus(), 60);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
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
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      document.removeEventListener("keydown", onKeyDown);
      restore?.focus?.();
    };
  }, [requestClose]);

  // Portal to <body> so the overlay escapes the /details `#details-scroll`
  // stacking context (z-10) — otherwise the page's top-left back button (z-30)
  // paints over this sheet even though it's z-50 within that trapped context.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={requestClose}
        className={cn(
          "absolute inset-0 cursor-default bg-ink/55 backdrop-blur-md",
          closing ? "animate-fade-out" : "animate-fade",
        )}
      />

      {/* pointer-events-none so clicks in the empty space above the sheet fall
          through to the backdrop button (which dismisses); the sheet itself
          re-enables pointer events. */}
      <div className="pointer-events-none relative flex h-full w-full max-w-110 flex-col justify-end">
        <div
          className={cn(
            "pointer-events-auto rounded-t-sheet border-t border-white/10 bg-ink-soft/95 px-4 pt-3 pb-7 shadow-[0_-16px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl",
            closing ? "animate-sheet-down" : "animate-sheet-up",
          )}
        >
          <div className="mx-auto mt-1 h-1.5 w-10 rounded-full bg-white/20" />

          <h2
            id={titleId}
            className="display mt-4 text-center text-[1.75rem] text-white"
          >
            Add your selfie
          </h2>
          <p className="mt-1 text-center text-[0.85rem] text-mist">
            A photo of you and your little one together.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <SourceRow
              ref={firstRef}
              icon={<Camera aria-hidden className="size-5" />}
              title="Take a selfie"
              subtitle="Use your camera with live guidance"
              onClick={onTakeSelfie}
            />
            <SourceRow
              icon={<ImageUp aria-hidden className="size-5" />}
              title="Upload a photo"
              subtitle="Choose one from your gallery"
              onClick={onUpload}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const SourceRow = React.forwardRef<
  HTMLButtonElement,
  {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
  }
>(function SourceRow({ icon, title, subtitle, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "glass group flex w-full items-center gap-4 rounded-panel px-4 py-4 text-left transition duration-200 ease-out-soft",
        "hover:-translate-y-0.5 hover:bg-[var(--glass-fill-strong)] hover:shadow-lift active:translate-y-0",
        // Use a real outline, not `ring`: `.glass` sets its own box-shadow and
        // (being defined after the utilities) would clobber a box-shadow ring.
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red-bright",
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hero-red/15 text-hero-red-bright ring-1 ring-hero-red/30 transition-transform duration-200 group-hover:scale-105">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-[1rem] font-semibold text-white">{title}</span>
        <span className="text-[0.8rem] text-mist">{subtitle}</span>
      </span>
    </button>
  );
});
