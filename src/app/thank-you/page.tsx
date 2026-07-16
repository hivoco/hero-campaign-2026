import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Thank-you / end screen (screen 8).
 *
 * The full-bleed campaign hero (family on the Destini, dragon soaring behind)
 * carries the payoff. Top scrim seats the "Back to Home" pill, Hero logo, and
 * the "Hero Ka Scooter / Scooter Ka Hero" tagline plate; the bottom scrim holds
 * the confirmation copy and the Destini wordmark. Server component — static.
 */
export default function ThankYouPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed campaign hero. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover object-center h-10 w-auto"
        />
        {/* Legibility scrims — top for the chrome, bottom for the copy. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-black/85 via-black/45 to-transparent" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex h-full flex-col px-4 pt-6 pb-8 [@media(max-height:850px)]:pt-2.5">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-0.5 rounded-pill border border-black/5 bg-white/95 px-2 py-1.5 text-[10px] font-bold leading-none text-ink shadow-[0_4px_14px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_22px_rgba(0,0,0,0.3)] focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 focus-visible:outline-none active:translate-y-0"
          >
            <ArrowLeft aria-hidden className="size-3" strokeWidth={3} />
            Back to Home
          </Link>
          <Image
            src="/hero-logo.png"
            alt="Hero"
            width={536}
            height={197}
            preload
            style={{ height: "auto" }}
            className="w-22"
          />
        </header>

        {/* Campaign tagline plate — wide, centered, big italic display. This is
            the screen's primary heading (every other screen has an <h1>); the two
            lines are block spans so the plate reads as one heading to a SR. */}
        <h1 className="mx-auto mt-5 w-88 max-w-full rounded-xl border border-white/25 bg-black/20 px-4 py-4 text-center backdrop-blur-xs backdrop-saturate-[1.4] animate-rise [@media(max-height:700px)]:mt-3 [@media(max-height:700px)]:py-2.5">
          <span className="display block text-[1.95rem] leading-[0.95] text-white italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] [@media(max-height:700px)]:text-[1.5rem]">
            Hero Ka Scooter
          </span>
          <span className="display block text-[2.6rem] leading-[0.85] text-white italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] [@media(max-height:700px)]:text-[2rem]">
            Scooter Ka Hero
          </span>
        </h1>

        {/* Confirmation + wordmark. */}
        <div className="mt-auto flex flex-col items-center text-center">
          <p className="w-full text-base text-center leading-none font-bold text-white [text-shadow:0px_4px_4px_#00000099] animate-rise [animation-delay:120ms]">
            Your Hero Destini adventure is being created just for you. It will
            arrive on your WhatsApp soon.
          </p>
          <Image
            src="/destini-wordmark.png"
            alt="Hero Destini — available in 110cc and 125cc"
            width={324}
            height={61}
            
            className="mt-4 h-5 w-auto animate-rise [animation-delay:200ms]"
          />
        </div>
      </div>
    </main>
  );
}
