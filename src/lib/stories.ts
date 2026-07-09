export type Story = {
  slug: string;
  title: string;
  /** Circular thumbnail in `public/stories/`. */
  image: string;
};

/** The four stories shown in the Pick Your Story grid. */
export const stories: Story[] = [
  {
    slug: "the-lost-kitten",
    title: "The Lost Kitten",
    image: "/stories/the-lost-kitten.png",
  },
  {
    slug: "the-tired-dragon",
    title: "The Tired Dragon",
    image: "/stories/the-tired-dragon.png",
  },
  {
    slug: "great-mountain-chase",
    title: "Great Mountain Chase",
    image: "/stories/great-mountain-chase.png",
  },
  {
    slug: "big-mountain-rescue",
    title: "Big Mountain Rescue",
    image: "/stories/big-mountain-rescue.png",
  },
];
