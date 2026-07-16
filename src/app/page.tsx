import Image from "next/image";

import { StartButton } from "@/components/start-button";

export default function LandingPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
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
        className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/70"
      />

      {/* Foreground content */}
      <div className="relative z-10 flex flex-1 flex-col px-4 pt-9 pb-7 [@media(max-height:850px)]:pt-2.5">
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
          className="mx-auto h-[clamp(3rem,7vh,4rem)] w-auto animate-rise"
        />

        {/* Welcome message — padding + text scale down on short screens
            (clamp on vh) so the card stays compact and never overlaps the dragon. */}
        <div className="glass border mt-[clamp(0.75rem,2.2vh,1.25rem)] rounded-xl   py-[clamp(0.5rem,1.6vh,1rem)] animate-rise [animation-delay:120ms] bg-black/25!">
          <p className="display mx-auto text-center text-[clamp(0.8rem,2vh,1rem)] font-bold leading-none tracking-normal text-white [text-shadow:0px_3.78px_3.78px_#00000080]">
            Welcome to the Hero Destini world.<br/>
Create your very own personalised dragon story. <br/><br/>
<span className="display mx-auto text-center text-[clamp(0.95rem,2.6vh,1.2375rem)] font-bold leading-none tracking-normal text-white [text-shadow:0px_3.78px_3.78px_#00000080]">“5 Lucky Winners Ride Home the All-New Destini.”</span>
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
            // style={{ height: "auto" }}
            className="h-5 object-contain "
          />
        </div>

        {/* Primary call to action → straight to Pick Your Story (world screen removed) */}
        <StartButton />
      </div>
    </main>
  );
}
