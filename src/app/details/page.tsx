import Image from "next/image";
import { Suspense } from "react";

import { DetailsForm } from "@/components/details-form";
import { getWorldBySlug } from "@/lib/worlds";

export default async function DetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ world?: string }>;
}) {
  const { world: worldSlug } = await searchParams;
  const world = getWorldBySlug(worldSlug);

  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed background — the chosen world scene, darkened + blurred. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src={world.image}
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[10px]" />
      </div>

      {/* Foreground — a flex column sized to fit the viewport: the selfie
          dropzone (flex-1) grows/shrinks to absorb the slack so the whole form
          stays on one screen (h-dvh), down to iPhone-SE heights. It scrolls only
          as a fallback if the content still overflows (very short / keyboard
          open). `id` lets an open overlay freeze this scroll container. */}
      <div
        id="details-scroll"
        className="relative z-10 flex flex-1 flex-col overflow-y-auto px-5 pt-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Image
          src="/hero-logo.png"
          alt="Hero"
          width={536}
          height={197}
          preload
          className="mx-auto h-11 w-auto animate-rise "
        />

        <h1 className="display mt-5 text-center text-[1.85rem] font-bold leading-none tracking-normal text-white [text-shadow:0px_4px_4px_#00000080] animate-rise [animation-delay:100ms]">
          Every Adventure Needs Heroes
        </h1>

        <p className="mt-1.5 text-[13px] text-center leading-snug font-bold text-white [text-shadow:0px_3px_6px_#00000080] animate-rise [animation-delay:160ms]">
          Upload or click a selfie with your little one to begin the journey.
          Fill in a few details below &amp; let&apos;s bring your story to life.
        </p>

        {/* DetailsForm reads the flow's query params via useSearchParams, so it
            must sit under a Suspense boundary (Next 16 requirement). */}
        <Suspense fallback={null}>
          <DetailsForm />
        </Suspense>
      </div>
    </main>
  );
}
