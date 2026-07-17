"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { languages } from "@/lib/languages";
import { getWizard, patchWizard } from "@/lib/wizard";
import { useForwardQuery } from "@/lib/use-forward-query";
import { BackButton } from "@/components/back-button";

/** Read the remembered wizard state (client-only; SSR-safe via useSyncExternalStore). */
function useWizard() {
  const json = React.useSyncExternalStore(
    () => () => {},
    () => JSON.stringify(getWizard()),
    () => "{}",
  );
  return React.useMemo(
    () => JSON.parse(json) as ReturnType<typeof getWizard>,
    [json],
  );
}

/**
 * Language Selection — a full-height list of glass rows over the blurred
 * mountain scene. Tapping a language remembers it (wizard store) and navigates
 * to `/details`, carrying the chosen story forward. Returning here highlights
 * the previously-chosen language. The red gradient is the hover/focus/press
 * affordance and the persistent "selected" look.
 */
export function LanguageSelect() {
  const { story, lang: storedLang } = useWizard();
  const searchParams = useSearchParams();
  const forward = useForwardQuery();

  // Deep-link support (e.g. a QR that opens `?lang=telugu`): if the URL names a
  // valid language, float that card to the top AND pre-select it. An absent or
  // unrecognised value leaves the list in its default order.
  const langParam = searchParams.get("lang")?.trim().toLowerCase();
  const deepLinkIdx = langParam
    ? languages.findIndex((l) => l.code.toLowerCase() === langParam)
    : -1;
  const orderedLanguages = React.useMemo(() => {
    if (deepLinkIdx <= 0) return languages; // not found (or already first) → default order
    return [languages[deepLinkIdx], ...languages.filter((_, i) => i !== deepLinkIdx)];
  }, [deepLinkIdx]);

  // The URL language (if valid) is the selected one; otherwise fall back to the
  // language remembered from a previous visit.
  const activeLang = deepLinkIdx >= 0 ? languages[deepLinkIdx].code : storedLang;

  const detailsHref = (langCode: string) => {
    const query = new URLSearchParams({ lang: langCode });
    if (story) query.set("story", story);
    // Merge any other incoming params (utm_*, etc.); the row's own lang/story win.
    return forward(`/details?${query.toString()}`);
  };

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed background — mountain valley, blurred + darkened for legibility. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/worlds/mountain-common.png"
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      </div>

      <BackButton href="/pick-story" label="Back to stories" />

      {/* Foreground */}
      <div className="relative z-10 flex flex-1 flex-col px-4 pt-9 pb-8 [@media(max-height:850px)]:pt-2.5">
        <Image
                 src="/hero-logo.png"
                 alt="Hero"
                 width={536}
                 height={197}
                 preload
                 // style={{ height: "auto" }}
                 className="mx-auto h-9 w-auto animate-rise"
               />
       

        <h1 className="display-bold mt-7 text-center text-3xl leading-none tracking-normal text-cloud drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-rise [animation-delay:100ms]">
          Select your language
        </h1>

        {/* Choice list — grows to fill the remaining height (rows expand up to a
            cap, then the group centers). Each row is a link to `/details`. */}
        <ul className="mt-6 flex flex-1 flex-col  gap-3">
          {orderedLanguages.map((lang, i) => {
            const selected = lang.code === activeLang;
            return (
              <li
                key={lang.code}
                className="flex max-h-16 flex-1 animate-rise"
                style={{ animationDelay: `${180 + i * 55}ms` }}
              >
                <Link
                  href={detailsHref(lang.code)}
                  onClick={() => patchWizard({ lang: lang.code })}
                  aria-current={selected}
                  className={cn(
                    "group relative flex w-full items-center overflow-hidden rounded-xl border bg-white/8 px-6 text-cloud shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] backdrop-blur-[14px] backdrop-saturate-150 transition duration-200 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:scale-[0.99]",
                    selected ? "border-hero-red/60" : "border-white/25 hover:border-hero-red/50",
                  )}
                >
                  {/* Selected row → solid #E9506380 fill; otherwise a red
                      gradient revealed where you point / press. */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-hero-red/60 transition-opacity duration-200",
                      selected
                        ? "bg-[#E9506380] opacity-100"
                        : "bg-linear-to-r from-hero-red/70 via-hero-red/35 to-hero-red/5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100",
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-[1.1rem] tracking-wide transition-colors duration-200 group-hover:text-white group-focus-visible:text-white",
                      selected ? "text-white" : "text-cloud",
                    )}
                  >
                    {lang.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
