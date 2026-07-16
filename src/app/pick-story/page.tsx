import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { stories, type Story } from "@/lib/stories";

export default async function PickStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ world?: string }>;
}) {
  // Carry the world chosen on the previous screen forward with the story pick.
  const { world } = await searchParams;
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

      {/* Foreground */}
      <div className="relative z-10 flex flex-1 flex-col px-5 pt-9 pb-8">
        <Image
          src="/hero-logo.png"
          alt="Hero"
          width={536}
          height={197}
          preload
          style={{ height: "auto" }}
          className="mx-auto w-[8.25rem] animate-rise drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
        />

        <h1 className="display mt-7 text-center text-[2rem] leading-none text-cloud drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] animate-rise [animation-delay:100ms]">
          Pick your story
        </h1>

        <div className="mt-8 grid flex-1 content-center grid-cols-2 gap-3.5">
          {stories.map((story, i) => (
            <StoryCard key={story.slug} story={story} index={i} world={world} />
          ))}
        </div>
      </div>
    </main>
  );
}

function StoryCard({
  story,
  index,
  world,
}: {
  story: Story;
  index: number;
  world?: string;
}) {
  const query = new URLSearchParams({ story: story.slug });
  if (world) query.set("world", world);
  return (
    <Link
      href={`/language?${query.toString()}`}
      className={cn(
        "glass group flex flex-col items-center rounded-panel px-4 pt-6 pb-7 animate-rise",
        "transition duration-200 ease-out-soft",
        "hover:-translate-y-0.5 hover:bg-[var(--glass-fill-strong)] hover:shadow-lift",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
        "active:translate-y-0 active:scale-[0.99]"
      )}
      style={{ animationDelay: `${180 + index * 90}ms` }}
    >
      <div className="relative size-[clamp(5.5rem,15vh,8.25rem)] overflow-hidden rounded-full ring-1 ring-white/20 transition-transform duration-200 ease-out-soft group-hover:scale-[1.03]">
        <Image
          src={story.image}
          alt={story.title}
          fill
          sizes="132px"
          className="object-cover"
        />
      </div>

      <h2 className="display mt-4 text-center text-[1.1rem] leading-tight text-cloud [text-wrap:balance] drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]">
        {story.title}
      </h2>
    </Link>
  );
}
