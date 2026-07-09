import Image from "next/image";
import Link from "next/link";

import { languages } from "@/lib/languages";

/**
 * Language Selection — a full-height list of glass rows over the blurred
 * mountain scene. There is no separate CTA: the choice *is* the action, so
 * tapping a language navigates straight to `/details`. The red gradient is the
 * hover / focus / press affordance — it reads like the reference's "selected"
 * row and lingers through the (brief) client navigation.
 *
 * Because selecting = navigating, this is a pure Server Component (just links),
 * so `/language` ships zero client JS. Native `<a>` links give free keyboard
 * (Tab + Enter) and screen-reader support; the `<h1>` names the list.
 */
export function LanguageSelect() {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed background — mountain valley, blurred + darkened for legibility. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/worlds/mountain-peaks.png"
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[9px]" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex flex-1 flex-col px-5 pt-9 pb-8">
        <Image
          src="/hero-logo.png"
          alt="Hero"
          width={536}
          height={197}
          preload
          style={{ height: "auto" }}
          className="mx-auto w-[8.5rem] animate-rise drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
        />

        <h1 className="display mt-7 text-[2.55rem] leading-[0.92] text-cloud drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] animate-rise [animation-delay:100ms]">
          Select your language
        </h1>

        {/* Choice list — grows to fill the remaining height (rows expand up to a
            cap, then the group centers). Each row is a link to `/details`. */}
        <ul className="mt-6 flex flex-1 flex-col justify-center gap-3">
          {languages.map((lang, i) => (
            <li
              key={lang.code}
              className="flex max-h-[4.75rem] flex-1 animate-rise"
              style={{ animationDelay: `${180 + i * 55}ms` }}
            >
              <Link
                href={`/details?lang=${lang.code}`}
                className="group relative flex min-h-[3.5rem] w-full items-center overflow-hidden rounded-panel border border-white/25 bg-white/[0.08] px-6 text-cloud shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] backdrop-blur-[14px] backdrop-saturate-150 transition duration-200 ease-out-soft hover:border-hero-red/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:scale-[0.99]"
              >
                {/* Red gradient — the "selected" look, revealed where you point / press. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-panel bg-gradient-to-r from-hero-red/70 via-hero-red/35 to-hero-red/5 opacity-0 ring-1 ring-inset ring-hero-red/60 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100"
                />
                <span className="relative z-10 text-[1.1rem] tracking-wide text-cloud transition-colors duration-200 group-hover:text-white group-focus-visible:text-white">
                  {lang.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
