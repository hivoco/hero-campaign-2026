export type World = {
  slug: string;
  title: string;
  description: string;
  image: string;
  /** Scene description for the card image's alt text (the title is already an <h2>). */
  imageAlt: string;
};

/** The three fantasy worlds shown in the World Selection carousel. */
export const worlds: World[] = [
  {
    slug: "mountain-peaks",
    title: "Mountain Peaks",
    description: "A mountain of magic and dragon tales is waiting for you.",
    image: "/worlds/mountain-peaks.png",
    imageAlt:
      "A red dragon soaring over a sunlit mountain valley with a river winding through wildflower meadows",
  },
  {
    slug: "jungle-valley",
    title: "Jungle Valley",
    description: "A jungle of secrets and dragon adventures is waiting for you.",
    image: "/worlds/jungle-valley.png",
    imageAlt:
      "A red dragon gliding through a sunlit rainforest with macaws and a toucan among lush green foliage",
  },
  {
    slug: "coastal-kingdom",
    title: "Coastal Kingdom",
    description: "A beach of wonder and dragon stories is waiting for you.",
    image: "/worlds/coastal-kingdom.png",
    imageAlt:
      "A red dragon flying over a sunny tropical beach with turquoise water, palm trees and seashells",
  },
];

/**
 * Resolve the world chosen in the carousel (carried through the flow as the
 * `?world=` query param) into its record. Falls back to the first world
 * (Mountain Peaks) when the slug is missing or unknown, so a deep-link or a
 * mid-flow refresh still renders a valid background instead of breaking.
 */
export function getWorldBySlug(slug?: string): World {
  return worlds.find((world) => world.slug === slug) ?? worlds[0];
}
