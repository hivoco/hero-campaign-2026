"use client";

import { TriangleAlert } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

/**
 * App toast host — sonner restyled to the Hero glass system (dark, translucent,
 * hero-red error accents) instead of shadcn/sonner's default light theme.
 * Mounted once in the root layout so `toast()` works from any screen; it's a
 * fixed overlay, so it never reflows the page (the reason we use it over an
 * inline error). `unstyled` strips sonner's default card styling — we own the
 * whole look via `classNames` — while its positioning + enter/exit motion (and
 * reduced-motion handling) stay intact. Error accent is a `ring` (not a border),
 * so it layers over the base border with no class conflict.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={16}
      mobileOffset={16}
      gap={10}
      icons={{
        error: (
          <TriangleAlert aria-hidden className="size-5 text-hero-red-bright" />
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-2.5 rounded-pill border border-white/12 bg-white/10 px-4 py-3 text-white shadow-lift backdrop-blur-[14px]",
          title: "text-[0.9rem] leading-snug font-medium text-white",
          description: "text-[0.8rem] leading-snug text-mist",
          icon: "flex shrink-0 items-center",
          error: "ring-1 ring-hero-red/60 ring-inset",
        },
      }}
    />
  );
}
