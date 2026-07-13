/**
 * Shared press/tap feedback for interactive links & buttons.
 *
 * Touch devices have no `:hover`, so a tap needs its own obvious cue. This:
 *  - kills the default mobile tap-highlight (the grey/blue flash iOS + Android
 *    paint over links, which reads as "broken" rather than intentional), and
 *  - on `:active` (finger down) scales the element down a touch and brightens
 *    it, so it's clear *which* control you pressed.
 *
 * It's just Tailwind utilities, so compose it with `cn()` and layer on any
 * surface-specific accent (e.g. a red border/tint) per element:
 *
 *   className={cn(pressable, "…", "active:border-hero-red-bright")}
 *
 * `scale`/`brightness` are their own CSS properties (not the `transform`
 * shorthand) in Tailwind v4, so this won't clobber a `hover:-translate-*` lift.
 * Motion is neutralised under `prefers-reduced-motion` by the global reset.
 */
export const pressable =
  "[-webkit-tap-highlight-color:transparent] transition duration-150 ease-out-soft active:scale-[0.97] active:brightness-110";
