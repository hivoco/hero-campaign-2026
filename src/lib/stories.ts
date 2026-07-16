export type Story = {
  slug: string;
  title: string;
  /** Wide scene art in `public/stories/`. */
  image: string;
};

/**
 * The nine stories shown in the Pick Your Story carousel — three per slide,
 * three slides. The first slide matches the reference (Great Beach Race /
 * Magical Herb / Mission Golden Crown). Titles for the other six are
 * provisional (derived from the art) until finalised; the slug + image are the
 * stable parts. On each card the LAST word is rendered large (see
 * `story-carousel.tsx`), e.g. "THE GREAT BEACH · RACE".
 */
export const stories: Story[] = [
  
  { slug: "dragon-eggs", title: "saving dragon’s Eggs", image: "/stories/dragon-eggs.png" },
  { slug: "magical-herb", title: "The Magical Herb", image: "/stories/magical-herb.png" },
  { slug: "golden-crown", title: "Mission Golden Crown", image: "/stories/golden-crown.png" },
  
  { slug: "fairy-rescue", title: "The fairy queen Rescue", image: "/stories/fairy-rescue.png" },
  { slug: "lost-kitten", title: "The Lost Kitten", image: "/stories/lost-kitten.png" },
  

  
  { slug: "tired-dragon", title: "the dragon’s way Dragon", image: "/stories/tired-dragon.png" },
  { slug: "lost-puppy", title: "The Lost Puppy", image: "/stories/lost-puppy.png" },
  { slug: "snowman", title: "The Snowman", image: "/stories/snowman.png" },
  
];
