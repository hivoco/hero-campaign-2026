"use client";

import { useRouter } from "next/navigation";

/**
 * Landing primary CTA — a real <button> element that navigates to Pick Your
 * Story on click (the landing page stays a Server Component; only this button
 * is client-side for the router).
 */
export function StartButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      // Carry any incoming deep-link / campaign query (e.g. `?lang=english`,
      // utm_*) forward to the next screen. Read at click time so the landing
      // page can stay a Server Component with no Suspense boundary.
      onClick={() => router.push(`/pick-story${window.location.search}`)}
      className="glass group mt-2 flex h-12.25 w-full items-center justify-center rounded-pill bg-[ #FFFFFF26] px-6 text-lg font-bold leading-none tracking-normal text-white transition duration-200 ease-out-soft animate-rise [animation-delay:340ms] hover:-translate-y-0.5 hover:bg-white/25! hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:translate-y-0 active:scale-[0.99]"
    >
      Start Your Adventure
    </button>
  );
}
