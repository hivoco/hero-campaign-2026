import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Top-left back link — takes the user to the previous step (their choices are
 * remembered via the wizard store, so the earlier screen reflects them). Shifts
 * up with the logo on short screens (matching the responsive top padding).
 */
export function BackButton({
  href,
  label = "Go back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="absolute left-4 top-9 z-30 flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition duration-200 ease-out-soft hover:bg-white/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hero-red-bright focus-visible:outline-none [@media(max-height:850px)]:top-4"
    >
      <ArrowLeft aria-hidden className="size-4" strokeWidth={2.5} />
    </Link>
  );
}
