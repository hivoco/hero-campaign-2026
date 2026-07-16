"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { World } from "@/lib/worlds";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

export function WorldCarousel({ worlds }: { worlds: World[] }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-110 flex-col overflow-hidden bg-ink shadow-[0_0_60px_rgba(0,0,0,0.6)]">
      {/* Full-bleed background — the active world's scene, blurred + darkened.
          Crossfades as you swipe between worlds. */}
      <div aria-hidden className="absolute inset-0">
        {worlds.map((world, i) => (
          <Image
            key={world.slug}
            src={world.image}
            alt=""
            fill
            preload={i === 0}
            sizes="440px"
            className={cn(
              "object-cover transition-opacity duration-700 ease-out-soft",
              i === selected ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[10px]" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 flex flex-1 flex-col px-4 pt-9 pb-8 [@media(max-height:850px)]:pt-2.5">
        <Image
          src="/hero-logo.png"
          alt="Hero"
          width={536}
          height={197}
          preload
          className="mx-auto h-11 w-auto animate-rise"
        />

        <h1 className="display mt-6 text-center text-[2rem] font-bold leading-none tracking-normal text-white [text-shadow:0px_4px_4px_#0000004D] animate-rise [animation-delay:100ms]">
          Where would you like to go?
        </h1>

        {/* Carousel — centered card with neighbours peeking, no dots. */}
        <div className="mt-4 flex flex-1 items-center animate-rise [animation-delay:200ms]">
          <Carousel
            setApi={setApi}
            opts={{ align: "center", loop: true }}
            className="w-full"
            aria-label="Fantasy worlds"
          >
            <CarouselContent className="-ml-3">
              {worlds.map((world, i) => (
                <CarouselItem key={world.slug} className="basis-[86%] pl-3">
                  <WorldCard world={world} active={i === selected} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
}

function WorldCard({ world, active }: { world: World; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded-sheet border border-white/10 bg-white/10 backdrop-blur-[1px] p-6 transition-all duration-500 ease-out-soft",
        active ? "scale-100 opacity-100" : "scale-[0.93] opacity-45"
      )}
    >
      {/* Image keeps its natural 3/4 portrait on tall screens, but on short
          viewports the max-height caps it so the whole card (title, copy, CTA)
          stays on-screen instead of clipping. The 26rem subtracts ALL the
          non-image chrome — screen padding + logo + heading, plus the card's
          own padding, title, description and CTA — so the full card (not just
          the image) fits on iPhone-SE-class heights (≤667). */}
      <div className="relative mx-auto aspect-3/4 max-h-[calc(100dvh-26rem)] overflow-hidden rounded-2xl bg-ink-soft ring-1 ring-white/15">
        <Image
          src={world.image}
          alt={world.imageAlt}
          fill
          sizes="400px"
          className="h-full w-auto"
        />
      </div>

      <h2 className="display mt-5 text-center text-[2.4rem] font-bold leading-none tracking-normal text-white [text-shadow:0px_4px_4px_#00000080]">
        {world.title}
      </h2>

      <p className="mx-auto mt-2.5 max-w-[15rem] text-center text-[0.82rem] font-medium leading-snug text-white/90">
        {world.description}
      </p>

      <div className="mt-5 flex justify-center">
        <Link
          href={`/pick-story?world=${world.slug}`}
          aria-label={`Choose ${world.title}`}
          tabIndex={active ? 0 : -1}
          className={cn(
            "group grid size-12 place-items-center rounded-full bg-white text-ink shadow-lift",
            "transition duration-200 ease-out-soft",
            "hover:scale-105 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          )}
        >
          <ArrowRight className="size-5 transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
