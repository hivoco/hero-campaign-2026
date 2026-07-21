/**
 * The Destini story catalogue.
 *
 * Rendered as the showcase grid on the /thank-you screen ("here's what else you
 * can create"). Each card links back into the flow at /details. Titles + order
 * are load-bearing for the campaign — keep them verbatim. Art lives in
 * `public/stories/` (landscape ~16:9 PNGs); `imageAlt` is a scene description
 * for screen readers.
 */
export type Story = {
  slug: string;
  title: string;
  image: string;
  imageAlt: string;
};

export const STORIES: Story[] = [
  {
    slug: "saving-dragons-egg",
    title: "Saving Dragon's Egg",
    image: "/stories/dragon-eggs.png",
    imageAlt: "A nest of jewelled dragon eggs on a volcanic mountain ridge at sunset",
  },
  {
    slug: "mission-golden-crown",
    title: "Mission Golden Crown",
    image: "/stories/golden-crown.png",
    imageAlt:
      "A parent and child riding the Hero Destini scooter on a mountain road as a dragon soars behind them",
  },
  {
    slug: "the-magical-herb",
    title: "The Magical Herb",
    image: "/stories/magical-herb.png",
    imageAlt: "A glowing blue flower in a sunlit forest, watched over by a red dragon",
  },
  {
    slug: "the-fairy-queen-rescue",
    title: "The Fairy Queen Rescue",
    image: "/stories/fairy-rescue.png",
    imageAlt: "A winged fairy queen locked in a golden cage beside a curious red dragon",
  },
  {
    slug: "the-lost-kitten",
    title: "The Lost Kitten",
    image: "/stories/lost-kitten.png",
    imageAlt: "A wide-eyed tabby kitten on a glowing forest path at golden hour",
  },
  {
    slug: "the-dragons-way-home",
    title: "The Dragon's Way Home",
    image: "/stories/tired-dragon.png",
    imageAlt: "A young red dragon gazing over a moonlit mountain valley dotted with village lights",
  },
  {
    slug: "the-snowman-attack",
    title: "The Snowman Attack",
    image: "/stories/snowman.png",
    imageAlt: "A cheerful top-hatted snowman in a frozen, icicle-filled forest",
  },
  {
    slug: "save-that-puppy",
    title: "Save That Puppy",
    image: "/stories/lost-puppy.png",
    imageAlt: "A golden puppy carrying a seashell on a sunny beach below a lighthouse",
  },
];
