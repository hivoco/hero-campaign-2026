import Image from "next/image";

import { DetailsForm } from "@/components/details-form";

export default function DetailsPage() {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed background — the mountain world, darkened + blurred. */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/worlds/mountain-peaks.png"
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
          style={{ height: "auto" }}
          className="mx-auto w-[8.25rem] animate-rise drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
        />

        <h1 className="display mt-5 text-[2rem] leading-[0.9] text-cloud drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] animate-rise [animation-delay:100ms]">
          Every Adventure Needs Heroes
        </h1>

        <p className="mt-3 text-[0.95rem] text-center leading-[1.45] font-semibold text-cloud drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] animate-rise [animation-delay:160ms]">
          Upload or click a selfie with your little one to begin the journey.
          Fill in a few details below &amp; let&apos;s bring your story to life.
        </p>

        <DetailsForm />
      </div>
    </main>
  );
}
