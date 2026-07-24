import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { STORIES } from "@/lib/stories";

/**
 * Thank-you / end screen (screen 8).
 *
 * The full-bleed campaign hero carries the payoff. The top scrim seats the
 * "Back to Home" pill + Hero logo and the "Hero Ka Scooter / Scooter Ka Hero"
 * confirmation plate; below it a 2×4 showcase grid of the Destini story
 * catalogue (each card links back into the flow at /details); the bottom holds
 * the Destini wordmark and the "Create Another Story" CTA.
 *
 * The whole screen fits one viewport with no scroll: the story grid is the
 * flex-1 region, so it absorbs leftover height — cards grow on tall phones and
 * shrink on short ones (down to iPhone-SE heights) while every card, the
 * wordmark and the CTA stay on screen. Server component — static, zero client JS.
 */
export default function ThankYouPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed campaign hero. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/hero-bg-2.png"
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover object-center"
        />
        {/* Legibility scrims — an even wash plus a heavier top + bottom so the
            frosted cards and CTA read cleanly over the busy hero. */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex h-full min-h-0 flex-col px-4 pt-5 pb-6 [@media(max-height:750px)]:pt-3 [@media(max-height:750px)]:pb-4">
        <header className="flex shrink-0 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-0.5 rounded-pill border border-black/5 bg-white/95 px-2 py-1.5 text-[10px] font-bold leading-none text-ink shadow-[0_4px_14px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_22px_rgba(0,0,0,0.3)] focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 focus-visible:outline-none active:translate-y-0"
          >
            <ArrowLeft aria-hidden className="size-3" strokeWidth={3} />
            Back to Home
          </Link>
          <Image
            src="/hero-logo-2.png"
            alt="Hero"
            width={536}
            height={197}
            preload
            style={{ height: "auto" }}
            className="w-20"
          />
        </header>

        {/* Confirmation plate — the screen's single <h1>. Block spans keep it a
            single heading to a screen reader. */}
        <h1 className="mx-auto mt-4 w-88 max-w-full shrink-0 rounded-xl border border-white/25 bg-black/25 px-4 py-3 text-center backdrop-blur-xs backdrop-saturate-[1.4] animate-rise [@media(max-height:750px)]:mt-2.5 [@media(max-height:750px)]:py-2.5">
          <span className="display block text-[1.6rem] leading-[0.95] text-white italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Hero Ka Scooter
          </span>
          <span className="display block text-[2.15rem] leading-[0.85] text-white italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Scooter Ka Hero
          </span>
          <span className="display mt-2 block text-[1.35rem] leading-[0.9] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Thank You For Your Submission
          </span>
          <span className="mt-1.5 block text-xs font-normal leading-snug text-white/90 [text-shadow:0_2px_4px_#00000099]">
            Your Hero Destini adventure is being created just for you. It will
            arrive on your WhatsApp soon.
          </span>
        </h1>

        {/* Story catalogue — one tap target back into the flow (the whole
            gallery is a single link). flex-1 so it soaks up leftover height and
            the screen fits without scrolling. */}
        <Link
          href="/details"
          aria-label="Create another story"
          className="group mt-4 grid min-h-0 flex-1 grid-cols-2  grid-rows-4 gap-2 rounded-xl transition duration-200 ease-out-soft hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hero-red-bright [@media(max-height:750px)]:mt-2.5"
        >
          {STORIES.map((story, i) => (
            <div
              key={story.slug}
              style={{ animationDelay: `${120 + i * 45}ms` }}
              // When the story count is odd, the final card is both `:last-child`
              // and at an odd position — `last:odd:*` then spans both columns and
              // centers it at one-column width (gap-2 = 0.5rem → half-gap 0.25rem).
              className="glass-story-small-card relative min-h-0 overflow-hidden rounded-2xl  border border-white/35 p-1.5 animate-rise last:odd:col-span-2 last:odd:w-[calc(50%-0.25rem)] last:odd:justify-self-center"
            >
              {/* Full-bleed story photo fills the card; the frosted title tile
                  floats over its right side (its backdrop-blur softens the
                  photo behind the text). */}
              <div className="relative size-full overflow-hidden rounded-md ">
                <Image
                  src={story.image}
                  alt={story.imageAlt}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
                <div className="absolute inset-y-1 right-1 flex w-[48%] items-center justify-center rounded-md  bg-black/35 px-1.5 backdrop-blur-[2px]">
                  <span className="display-bold text-center text-[clamp(0.85rem,3.4vw,1.1rem)] leading-[1.05] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)]">
                    {story.title}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </Link>

        {/* Wordmark + Create-another-story CTA. */}
        <div className="mt-4 flex shrink-0 flex-col items-center gap-2.5 [@media(max-height:750px)]:mt-2.5">
          <Image
            src="/destini-wordmark-2.png"
            alt="Hero Destini — available in 110cc and 125cc"
            width={324}
            height={61}
            className="h-5 w-auto animate-rise [animation-delay:520ms]"
          />
          <div className="relative w-full animate-rise [animation-delay:560ms]">
            <span aria-hidden className="cta-glow" />
            <Link
              href="/details"
              className="glass group relative z-10 flex h-12.5 w-full items-center justify-center rounded-pill bg-white/15! px-6 text-base font-bold leading-none tracking-normal text-white transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:bg-white/25! hover:shadow-lift active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 [--glass-blur:16px]"
            >
              CREATE ANOTHER STORY
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
