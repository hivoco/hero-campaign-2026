import Image from "next/image";

import { HomeLanguageStart } from "@/components/home-language-start";

export default function LandingPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      
      <Image
        src="/hero-bg-2.png"
        alt="A parent and child riding the Hero Destini scooter on a mountain road as a dragon soars behind them"
        fill
        preload
        sizes="480px"
        className="object-cover object-center "
      />

     
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/70"
      />

      
      <div className="relative z-10 flex flex-1 flex-col px-4 pt-9 pb-7 [@media(max-height:850px)]:pt-2.5">
        
        <h1 className="sr-only">Welcome to the Hero Destini fantasy world</h1>

        {/* Brand */}
        <Image
          src="/hero-logo-2.png"
          alt="Hero"
          width={536}
          height={197}
          preload
          className="mx-auto h-9 w-auto animate-rise"
        />

        <h1 className="display mt-5 text-center text-2xl font-bold leading-none tracking-normal text-white [text-shadow:0px_4px_4px_#00000080] animate-rise [animation-delay:100ms]">
          Welcome to the Hero Destini world

        </h1>

        <p className="text-xs text-center leading-snug font-bold text-white animate-rise [animation-delay:160ms]">
          Create your own personalised dragon story
        </p>
        <div className="glass w-full lg:w-96 mx-auto   mt-[clamp(0.75rem,2.2vh,1.25rem)] rounded-xl   py-2 animate-rise [animation-delay:120ms] bg-black/25!">
          <p className="display mx-auto text-center text-base font-bold leading-none tracking-normal text-white">

            <span className="display mx-auto text-center text-3xl font-bold leading-none tracking-normal text-white ">5 LUCKY WINNERS</span><br />
            Get a chance to win HERO DESTINI
          </p>
          
        </div>
        <div className="flex justify-center animate-rise [animation-delay:240ms] mt-1.5">
          <Image
            src="/destini-wordmark-2.png"
            alt="Hero Destini — available in 110cc and 125cc"
            width={324}
            height={61}
            preload
            // style={{ height: "auto" }}
            className="h-5 object-contain "
          />
        </div>

        {/* Spacer — the rider + dragon live in the background image here. */}
        <div className="flex-1" />

        {/* Language chips + primary CTA. Pick a language here (no separate
            screen; not in the URL), then Start → the details form. */}
        <HomeLanguageStart />
      </div>
    </main>
  );
}
