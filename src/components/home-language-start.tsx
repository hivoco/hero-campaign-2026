"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { languages } from "@/lib/languages";
import { patchWizard } from "@/lib/wizard";
import { trackPixel } from "@/lib/fbpixel";

/**
 * Home CTA — language chips + the "Start Your Adventure" button.
 *
 * Language is chosen here (not on a separate screen and never from the URL):
 * the user must tap a chip, which enables the button; Start then remembers the
 * language in the wizard store and moves to the details form. Any incoming
 * campaign query (utm_*) is carried forward; the language is not put in the URL.
 */
export function HomeLanguageStart() {
  const router = useRouter();
  // Hindi is pre-selected by default so the CTA is enabled on load; the user
  // can still switch to any other language.
  const [selected, setSelected] = React.useState<string | null>("hindi");

  const start = () => {
    if (!selected) return;
    // Meta Pixel: user began the journey from the landing CTA.
    trackPixel("Start_Journey_DestiniTech");
    patchWizard({ lang: selected });
    // Straight to the details form (no story screen — the story is assigned at
    // random by the backend). Read the query at click time so the landing page
    // stays a Server Component; utm_* is carried forward.
    router.push(`/details${window.location.search}`);
  };

  return (
    <div className="animate-rise [animation-delay:300ms]">
      {/* Language chips — pick one to unlock the CTA. */}
      <ul className="mb-3 flex flex-wrap justify-center gap-1" aria-label="Choose your language">
        {languages.map((lang) => {
          const active = lang.code === selected;
          return (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => setSelected(lang.code)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg glass bg-black/25! border-[0.5px] border-white px-3 py-2 text-xs font-normal transition duration-200 ease-out-soft active:scale-[0.98]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red-bright focus-visible:outline-none",
                  active
                    ? "border-hero-red-bright bg-[#E9506399]! text-white shadow-lift"
                    : "text-cloud hover:border-white/60",
                )}
              >
                {lang.label}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Relative wrapper so the travelling-border ring sits around the button. */}
      <div className="relative">
        {/* The glow that runs around the border — decorative, behind the button. */}
        <span aria-hidden className="cta-glow" />
        <button
          type="button"
          onClick={start}
          disabled={!selected}
          aria-disabled={!selected}
          title={selected ? undefined : "Select a language first"}
          className={cn(
            // Stronger backdrop blur (override --glass-blur locally) so the
            // scene behind the button is muted; slightly more fill helps too.
            "glass group relative z-10 flex h-12.25 w-full items-center justify-center rounded-pill bg-white/15! px-6 text-lg font-bold leading-none tracking-normal text-white transition duration-200 ease-out-soft [--glass-blur:16px]",
            "hover:-translate-y-0.5 hover:bg-white/25! hover:shadow-lift active:translate-y-0 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-white/15! disabled:hover:shadow-none",
          )}
        >
          START YOUR ADVENTURE
        </button>
      </div>
    </div>
  );
}
