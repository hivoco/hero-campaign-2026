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
    <main className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed campaign hero. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover object-center"
        />
        {/* Legibility scrims — top for the chrome, bottom for the copy. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex h-full flex-col px-5 pt-6 pb-8">
        <header className="flex items-start justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-pill border border-black/5 bg-white/95 px-4 py-2 text-[0.85rem] font-medium text-ink shadow-[0_4px_14px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_22px_rgba(0,0,0,0.3)] focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 focus-visible:outline-none active:translate-y-0"
          >
            <ArrowLeft aria-hidden className="size-4" strokeWidth={2.2} />
            Back to Home
          </Link>
          <Image
            src="/hero-logo.png"
            alt="Hero"
            width={536}
            height={197}
            preload
            style={{ height: "auto" }}
            className="w-[5.5rem] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
          />
        </header>

        {/* Campaign tagline plate — wide, centered, big italic display. This is
            the screen's primary heading (every other screen has an <h1>); the two
            lines are block spans so the plate reads as one heading to a SR. */}
        <h1 className="glass mx-auto mt-5 w-[22rem] max-w-full rounded-2xl px-5 py-4 text-center animate-rise">
          <span className="display block text-[1.95rem] leading-[0.95] text-cloud italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Hero Ka Scooter
          </span>
          <span className="display block text-[2.6rem] leading-[0.85] text-cloud italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
            Scooter Ka Hero
          </span>
        </h1>

        {/* Confirmation + wordmark. */}
        <div className="mt-auto flex flex-col items-center text-center">
          <p className="max-w-[19rem] text-[1.05rem] leading-[1.4] font-bold text-cloud drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-rise [animation-delay:120ms]">
            Your Hero Destini adventure is being created just for you. It will
            arrive on your WhatsApp soon.
          </p>
          <Image
            src="/destini-wordmark.png"
            alt="Hero Destini — available in 110cc and 125cc"
            width={324}
            height={61}
            style={{ height: "auto" }}
            className="mt-6 w-[9.5rem] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] animate-rise [animation-delay:200ms]"
          />
        </div>
      </div>
    </main>
  );
}
