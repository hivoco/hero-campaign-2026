import Image from "next/image";
import { Suspense } from "react";

import { DetailsForm } from "@/components/details-form";
import { BackButton } from "@/components/back-button";

export default function DetailsPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed background — shared mountain scene, darkened + blurred. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/worlds/mountain-common.png"
          alt=""
          fill
          preload
          sizes="440px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[10px]" />
      </div>

      <BackButton href="/language" label="Back to language" />

      {/* Foreground — a flex column sized to fit the viewport: the selfie
          dropzone (flex-1) grows/shrinks to absorb the slack so the whole form
          stays on one screen (h-dvh), down to iPhone-SE heights. It scrolls only
          as a fallback if the content still overflows (very short / keyboard
          open). `id` lets an open overlay freeze this scroll container. */}
      <div
        id="details-scroll"
        className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pt-6 pb-6 scrollbar-none [&::-webkit-scrollbar]:hidden [@media(max-height:850px)]:pt-2.5"
      >
        <Image
                 src="/hero-logo.png"
                 alt="Hero"
                 width={536}
                 height={197}
                 preload
                 // style={{ height: "auto" }}
                 className="mx-auto h-11 w-auto animate-rise"
               />

        {/* Heading + subtitle live inside DetailsForm so their copy can react to
            the selfie state (they swap once a selfie is verified). DetailsForm
            also reads the flow's query params via useSearchParams, so it must sit
            under a Suspense boundary (Next 16 requirement). */}
        <Suspense fallback={null}>
          <DetailsForm />
        </Suspense>
      </div>
    </main>
  );
}
