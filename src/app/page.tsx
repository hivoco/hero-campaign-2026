import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed campaign background: father + child riding the Destini,
          the dragon soaring behind them on a mountain road at sunset. */}
      <Image
        src="/hero-bg.png"
        alt="A parent and child riding the Hero Destini scooter on a mountain road as a dragon soars behind them"
        fill
        preload
        sizes="480px"
        className="object-cover object-center "
      />

      {/* Legibility scrims — dark at the very top and bottom, clear in the
          middle so the hero imagery stays vivid. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70"
      />

      {/* Foreground content */}
      <div className="relative z-10 flex flex-1 flex-col px-5 pt-9 pb-7">
        {/* Accessible page heading — the visible welcome copy is set in the
            condensed display face, so a plain-text h1 carries the landmark
            for screen readers and SEO without altering the layout. */}
        <h1 className="sr-only">Welcome to the Hero Destini fantasy world</h1>

        {/* Brand */}
        <Image
          src="/hero-logo.png"
          alt="Hero"
          width={536}
          height={197}
          preload
          className="mx-auto h-17 w-auto animate-rise"
        />

        {/* Welcome message */}
        <div className="glass mt-5 rounded-panel px-2.5 py-4 animate-rise [animation-delay:120ms] bg-black/25!">
          <p className="display mx-auto text-center text-[1.2375rem] font-bold leading-none tracking-normal text-white [text-shadow:0px_3.78px_3.78px_#00000080]">
            Welcome to the Hero Destini fantasy world. Create your very own
            personalised dragon story with your child.
          </p>
        </div>

        {/* Spacer — the rider + dragon live in the background image here. */}
        <div className="flex-1" />

        {/* Product wordmark (includes the "Available in 110cc & 125cc" caption). */}
        <div className="flex justify-center animate-rise [animation-delay:240ms]">
          <Image
            src="/destini-wordmark.png"
            alt="Hero Destini — available in 110cc and 125cc"
            width={324}
            height={61}
            preload
            style={{ height: "auto" }}
            className="h-7.5 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Primary call to action */}
        <Link
          href="/world-selection"
          className="glass group mt-2 flex h-14 items-center justify-center rounded-pill px-6 text-[1.05rem] font-semibold tracking-wide text-white transition duration-200 ease-out-soft animate-rise [animation-delay:340ms] hover:-translate-y-0.5 hover:bg-[var(--glass-fill-strong)] hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:translate-y-0 active:scale-[0.99]"
        >
          <span>Start Your Adventure</span>
          <ArrowRight
            aria-hidden
            strokeWidth={2.2}
            className="ml-2 h-5 w-5 transition-transform duration-200 ease-out-soft group-hover:translate-x-1"
          />
        </Link>
      </div>
    </main>
  );
}
