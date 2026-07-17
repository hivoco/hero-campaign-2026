import Image from "next/image";
import { Suspense } from "react";

import { StoryCarousel } from "@/components/story-carousel";
import { BackButton } from "@/components/back-button";

export default function PickStoryPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed background — the mountain world, darkened + blurred. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/worlds/mountain-common.png"
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[10px]" />
      </div>

      <BackButton href="/" label="Back to home" />

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
          Pick your story
        </h1>

        {/* Carousel: 3 stacked story cards per slide, 3 slides (9 stories).
            StoryCarousel forwards the URL query via useSearchParams, so it must
            sit under a Suspense boundary (Next 16 requirement). */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col animate-rise [animation-delay:200ms]">
          <Suspense fallback={null}>
            <StoryCarousel />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
