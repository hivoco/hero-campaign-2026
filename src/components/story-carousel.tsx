"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { stories, type Story } from "@/lib/stories";
import { getWizard, patchWizard } from "@/lib/wizard";
import { useForwardQuery } from "@/lib/use-forward-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

/** Read the remembered story (client-only; SSR-safe via useSyncExternalStore). */
function useStoredStory() {
  return React.useSyncExternalStore(
    () => () => {},
    () => getWizard().story,
    () => undefined,
  );
}

/** Group the nine stories into slides of three (→ 3 slides). */
const SLIDES: Story[][] = Array.from(
  { length: Math.ceil(stories.length / 3) },
  (_, i) => stories.slice(i * 3, i * 3 + 3),
);

/**
 * Pick Your Story — a horizontal carousel. Each slide stacks three wide story
 * cards; swiping pages through the three slides (nine stories). Dots below show
 * position and jump between slides. Tapping a card navigates to `/language`
 * with the chosen story (the choice *is* the action).
 */
export function StoryCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selected, setSelected] = React.useState(0);
  const storedStory = useStoredStory();

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

  // Coming back to this screen: jump to the slide holding the remembered story.
  React.useEffect(() => {
    if (!api || !storedStory) return;
    const idx = SLIDES.findIndex((g) => g.some((s) => s.slug === storedStory));
    if (idx >= 0) api.scrollTo(idx, true);
  }, [api, storedStory]);

  return (
    <div className="flex  min-h-0 flex-1 flex-col">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        // Make the viewport + track fill the available height so the three
        // stacked cards share it (and shrink on short screens).
        className="flex min-h-0 flex-1 [&>div]:h-full"
        aria-label="Stories"
      >
        <CarouselContent className="h-full">
          {SLIDES.map((group, i) => (
            <CarouselItem key={i} className="h-full">
              <div className="flex h-full flex-col items-center   gap-[clamp(0.5rem,2vh,1rem)]">
                {group.map((story, j) => (
                  <StoryCard
                    key={story.slug}
                    story={story}
                    index={i * 3 + j}
                    active={i === selected}
                    selected={story.slug === storedStory}
                  />
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Pagination dots — active slide is a wider hero-red pill. */}
      <div className="mt-4 flex shrink-0 items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={`Go to stories ${i * 3 + 1}–${i * 3 + 3}`}
            aria-current={i === selected}
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red-bright",
              i === selected ? "w-6 bg-hero-red" : "w-2 bg-white/40 hover:bg-white/60",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** One wide story card: full-bleed scene art + a glass title plate on the right
 *  whose LAST word is rendered large (per the reference). Tapping it navigates
 *  to `/language?story=…`. `active` gates tab focus to the visible slide. */
function StoryCard({
  story,
  index,
  active,
  selected,
}: {
  story: Story;
  index: number;
  active: boolean;
  /** The story remembered from a previous visit — highlighted with a red frame. */
  selected: boolean;
}) {
  const forward = useForwardQuery();

  // Split the title so the last word can be emphasised: "The Great Beach" + "Race".
  const words = story.title.split(" ");
  const tail = words.pop() ?? story.title;
  const head = words.join(" ");

  return (
    <Link
      href={forward("/language")}
      onClick={() => patchWizard({ story: story.slug })}
      tabIndex={active ? 0 : -1}
      aria-label={`Choose ${story.title}`}
      aria-current={selected}
      // 305-wide frame (per design): 12px radius, 2px border, 10px padding — the
      // scene art shows inside that padding. Height is 180px on tall screens but
      // shrinks on short ones (flex-1 + max-h + min-h-0), so 3 cards + gaps never
      // overflow and a bottom gap is always kept. max-w-full guards narrow phones.
      className={cn(
        "group animate-rise relative mx-auto block max-h-45 min-h-0 min-w-80 max-w-full flex-1 rounded-xl border-[0.5px] bg-white/15 p-2.5 shadow-lift backdrop-blur-[6px]",
        "transition duration-200 ease-out-soft hover:border-white/80 active:translate-y-0 active:scale-[0.99]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red-bright focus-visible:outline-none",
        selected ? "border-2 border-[#E9506380]" : "border-white/50",
      )}
      style={{ animationDelay: `${120 + (index % 3) * 80}ms` }}
    >
      {/* Inner image area, inset by the 10px padding. */}
      <span className="relative block h-full w-full overflow-hidden rounded-md">
        <Image
          src={story.image}
          alt={story.title}
          fill
          sizes="305px"
          className="object-cover transition-transform duration-300 ease-out-soft group-hover:scale-[1.04]"
        />
        {/* Legibility gradient behind the plate (right side). */}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-l from-black/55 via-black/10 to-transparent"
        />
        {/* Title plate — glass, bottom-right; 118×63, corners 8px (bottom-right 8.62px). */}
        <span className="glass-story-small-card absolute right-2 bottom-2 z-10 flex w-fit min-w-29.5 min-h-15.75 flex-col items-center justify-center gap-0.5 rounded-lg rounded-br-[8.62px] p-1.5 text-center">
          {head && (
            <span className="display-bold block whitespace-nowrap text-[20.54px] leading-none tracking-normal text-cloud uppercase drop-shadow-[0_3.42px_3.42px_rgba(0,0,0,0.25)]">
              {head}
            </span>
          )}
          <span className="display-bold block whitespace-nowrap text-[28px] leading-none tracking-normal text-cloud uppercase drop-shadow-[0_3.42px_3.42px_rgba(0,0,0,0.25)]">
            {tail}
          </span>
        </span>
      </span>
    </Link>
  );
}
