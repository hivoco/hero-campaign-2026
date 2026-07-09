# Code Review — World Selection route (`/world-selection`)

**Scope:** the world-carousel route and everything it renders/loads.
**Files:** [`src/app/world-selection/page.tsx`](src/app/world-selection/page.tsx) (route) · [`src/components/world-carousel.tsx`](src/components/world-carousel.tsx) (client) · [`src/components/ui/carousel.tsx`](src/components/ui/carousel.tsx) (shadcn/embla primitive) · [`src/lib/worlds.ts`](src/lib/worlds.ts) (data) · [`src/app/layout.tsx`](src/app/layout.tsx) (shell) · [`src/app/globals.css`](src/app/globals.css) (tokens/motion) · assets `public/worlds/{mountain-peaks,jungle-valley,coastal-kingdom}.png`, `public/hero-logo.png`.
**Reviewer bar:** the S-tier checklist in `CLAUDE.md`; Next.js 16 image guidance from `node_modules/next/dist/docs/…/image.md`.
**Status:** ✅ all findings actioned — see the resolution notes below.

---

## Verdict

**Ship-ready.** The route is a lean Server page delegating to one focused client carousel. It already does the hard things right: a real `<h1>` landmark + `<h2>` per card, the documented short-viewport cap so the CTA never clips, a full hover/focus/active state matrix on the CTA, correct crossfade-background pattern, and inactive-slide CTAs pulled out of the tab order. No correctness bugs of consequence. Findings were image weight, a Next 16 deprecation, and a handful of a11y/cleanup polish items — all resolved, deferred by explicit decision, or verified as non-issues below.

### Build health (verified after fixes)
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean (exit 0) |
| `npm run lint` | ✅ clean (exit 0) |
| Asset dims vs `next/image` props | ✅ `hero-logo.png` 536×197 = `width/height`; world PNGs 941×1672 rendered via `fill` (+ `sizes`) so no intrinsic props needed |
| Headless render @ 900×640 / 667 / 940 (before **and** after) | ✅ CTA visible at every height; title/description legible over glass; no gradient banding after recompression |
| World source PNGs | ✅ recompressed **8.96 MB → 2.68 MB** (70% smaller), same 941×1672, still PNG |
| `next/image` output (dev) | ✅ served as ~290 KB (w=828) / ~346 KB (w=1080) WebP (unchanged — the win is source/repo weight) |

---

## Findings & resolution

| # | Severity | Area | Summary | Status |
|---|----------|------|---------|--------|
| 1 | Low–Med | Perf | Three world PNGs total **8.8 MB** of source (2.8–3.2 MB each), committed to the repo | ✅ **Fixed** |
| 2 | Low | Next 16 / deprecation | `priority` prop is deprecated in favor of `preload` in Next 16 | ✅ **Fixed (app-wide)** |
| 3 | Low | a11y | Carousel `role="region"` has no accessible name (unnamed landmark) | ✅ **Fixed** |
| 4 | Low | Correctness / cleanup | `useEffect` registers a `reInit` listener it never removes on cleanup | ✅ **Fixed** |
| 5 | Nit | a11y / SEO | Card image `alt` duplicates the visible `<h2>` title (read twice by AT) | ✅ **Fixed** |
| 6 | Nit | a11y | Peeking (inactive) slides are still announced by screen readers | ✅ **Verified — no change** |
| 7 | Low | Design system | Cluster of arbitrary values vs. tokens (`rounded-[1.75rem]`, `text-[1.9rem]`, `basis-[86%]`, …) | ⏸️ **Deferred (by decision)** |
| 8 | Nit | Perf (app-wide) | AVIF not enabled in `next.config.ts` (`formats` defaults to WebP-only) | ⏸️ **Deferred (by decision)** |

---

### 1 · Three heavy source PNGs — Low–Medium (perf)
`public/worlds/mountain-peaks.png` (3.16 MB), `jungle-valley.png` (2.83 MB), and `coastal-kingdom.png` (2.97 MB) are **941×1672** and total **8.8 MB** of source. Each is used twice on this screen — once as the full-bleed crossfading background ([world-carousel.tsx:38-49](src/components/world-carousel.tsx#L38-L49)) and once as the card image ([world-carousel.tsx:103-109](src/components/world-carousel.tsx#L103-L109)) — and all three background layers mount at once for the crossfade, so several large decodes happen on load.

`next/image` already re-encodes these to WebP at serve time (measured: ~290 KB at `w=828`, ~346 KB at `w=1080`), so the *served* bytes are reasonable; the real cost is **repo weight, optimizer work, and disk-cache size** from 8.8 MB of committed source. This is the same call the homepage made for `hero-bg.png` (2.48 MB → 0.74 MB, same resolution).
**✅ Fixed.** Recompressed all three **in place** (a Pillow script: adaptive 256-colour palette + Floyd–Steinberg dithering → optimised PNG8), keeping the **full 941×1672 resolution** and staying **PNG** (no AVIF/WebP conversion of the source, per your instruction): **8.96 MB → 2.68 MB (70% smaller)** — `coastal-kingdom` 2.97→0.71 MB, `mountain-peaks` 3.16→0.93 MB, `jungle-valley` 2.83→1.04 MB. Lossless originals backed up to the session scratchpad (`scratchpad/originals/worlds/`), out of `public/`. **Verified** via headless screenshots at 640/667/940 and direct reads of the compressed files: the sky/sea gradients show no banding and the result is indistinguishable from the originals at display scale.

### 2 · `priority` deprecated in Next 16 — Low (deprecation)
[world-carousel.tsx:43](src/components/world-carousel.tsx#L43) (`priority={i === 0}`) and [:61](src/components/world-carousel.tsx#L61) (`priority`) use the `priority` prop. Per the bundled Next 16 docs (`components/image.md`, *"Starting with Next.js 16, the `priority` property has been deprecated in favor of the `preload` property"*, v16.0.0 changelog). In the installed **16.2.10** it still works — `get-img-props.js` maps `preload: preload || priority` and emits **no** runtime warning — so this is a forward-looking deprecation, not a live bug.
Note: `priority` is used **identically in all 8 route files** (`page`, `thank-you`, `details`, `pick-story`, `language-select`, `capture-overlay`, and here), so migrating only this route would make the codebase inconsistent. **✅ Fixed (app-wide, per decision).** Renamed all **13 uses** of `priority` → `preload` across the 8 files (a word-boundary rename, so `fetchPriority` etc. is untouched); behaviour is unchanged (`get-img-props.js` maps `preload: preload || priority`). tsc + lint clean; route still 200 and renders identically. The whole codebase is now Next-16-current and consistent.

### 3 · Carousel region has no accessible name — Low (a11y)
The shadcn primitive renders `role="region" aria-roledescription="carousel"` ([carousel.tsx:122-128](src/components/ui/carousel.tsx#L122-L128)) but the `<Carousel>` instance ([world-carousel.tsx:72-76](src/components/world-carousel.tsx#L72-L76)) passes no `aria-label`, so it becomes a **landmark with no name** (an ARIA best-practice violation). **✅ Fixed.** Added `aria-label="Fantasy worlds"` on the `<Carousel>`; it flows through `...props` onto the `role="region"` element, giving the carousel landmark an accessible name.

### 4 · `reInit` listener leaks on cleanup — Low (correctness / cleanup)
[world-carousel.tsx:21-30](src/components/world-carousel.tsx#L21-L30): the effect subscribes to both `select` and `reInit` but the cleanup only calls `api.off("select", onSelect)` — the `reInit` handler is never removed. Because `onSelect` is recreated each effect run, an old closure lingers on the embla instance across re-subscribes/unmount. Low impact (the api usually outlives the component), but it's a real leak and trivially fixed. **✅ Fixed.** Added `api.off("reInit", onSelect)` to the cleanup so both listeners are symmetrically removed.

### 5 · Card image `alt` duplicates the heading — Nit (a11y / SEO)
[world-carousel.tsx:106](src/components/world-carousel.tsx#L106) sets `alt={world.title}` while the `<h2>` immediately below ([:112-114](src/components/world-carousel.tsx#L112-L114)) states the same title, so assistive tech announces e.g. "Mountain Peaks" twice. **✅ Fixed.** Added a typed `imageAlt` field to the `World` type ([worlds.ts](src/lib/worlds.ts)) with an accurate, distinct scene description per world (written after viewing each image — e.g. *"A red dragon soaring over a sunlit mountain valley with a river winding through wildflower meadows"*), and the card now renders `alt={world.imageAlt}`. AT gets the scene *and* the title, no duplication.

### 6 · Inactive slides are announced by AT — Nit (a11y)
The peeking neighbour cards are visually de-emphasized (`scale-[0.93] opacity-45`, [world-carousel.tsx:96](src/components/world-carousel.tsx#L96)) but their `<h2>`/`<p>` are still in the accessibility tree, so a screen-reader user hears all three worlds with no "current" cue. The CTA link is correctly removed from the tab order when inactive (`tabIndex={active ? 0 : -1}`, [:124](src/components/world-carousel.tsx#L124)), so this is announcement-only, not a keyboard trap. This is a standard carousel trade-off (embla keeps all slides mounted for looping). **✅ Verified — no change (by decision).** Left as-is: `aria-hidden`-ing inactive slides would hide a still-focusable link (an axe violation of its own) and reading all three world names up front is reasonable, benign carousel behaviour. The named region (finding 3) already frames them as a carousel.

### 7 · Arbitrary values vs. tokens — Low (design system)
One-off values on this route: `rounded-[1.75rem]` (the card — not `rounded-panel`), `text-[1.6rem]`/`text-[1.9rem]`/`text-[0.82rem]`, `basis-[86%]`, `w-[8.25rem]`, `scale-[0.93]`, `opacity-45`, `max-h-[calc(100dvh-23rem)]`, several `drop-shadow-[…]`. Most are pixel-matched to the reference, and the recurring ones (display sizes, entrance stagger) are shared with `/` and other screens. Same posture as the homepage's deferred finding #6: promoting these to tokens is a **cross-cutting** refactor better done in one deliberate pass. **⏸️ Deferred (by decision).** Left untouched this pass to keep it scoped; revisit in a dedicated token sweep across all screens.

### 8 · AVIF not enabled — Nit (perf, app-wide)
`next.config.ts` only sets `reactCompiler: true`, so `images.formats` uses the default `['image/webp']` — the optimizer never emits AVIF (verified: an `Accept: image/avif` request returns WebP). AVIF is ~20% smaller than WebP for these photographic scenes. Enabling `['image/avif','image/webp']` is a one-line **app-wide** config change affecting every route's images. **⏸️ Deferred (by decision).** Explicitly out of scope — you asked for PNG-only source compression and no AVIF/WebP conversion; the app-wide `next.config` format change is left for a separate call.

---

## What's done well

- **Correct heading structure** — a real `<h1>` "Where would you like to go?" ([world-carousel.tsx:66](src/components/world-carousel.tsx#L66)) plus an `<h2>` per card. (Stronger than the homepage, which needed an `sr-only` `<h1>` added.)
- **Short-viewport gotcha handled** — the card image is `aspect-[3/4] max-h-[calc(100dvh-23rem)]` ([world-carousel.tsx:102](src/components/world-carousel.tsx#L102)) so it keeps its natural portrait on tall screens but shrinks on short ones; **verified** at 640/667/940 that the CTA never clips.
- **Full CTA state matrix** — `hover:scale-105 active:scale-95` + a real `focus-visible` ring with offset ([world-carousel.tsx:125-132](src/components/world-carousel.tsx#L125-L132)); animates `transform`/`opacity` only (GPU-friendly), ~200 ms ease.
- **Inactive CTAs removed from tab order** — `tabIndex={active ? 0 : -1}` ([world-carousel.tsx:124](src/components/world-carousel.tsx#L124)) so keyboard users only reach the focused card's action.
- **Crossfade-background pattern per the system** — un-blurred `next/image` + an overlay `bg-black/45 backdrop-blur-[10px]` ([world-carousel.tsx:51](src/components/world-carousel.tsx#L51)), not a `blur-*` filter on the image; crossfades with `transition-opacity duration-700`.
- **LCP prioritized** — first background layer + the logo carry `priority`; decorative background is `alt="" aria-hidden`, and `fill` images pass `sizes`.
- **Clean RSC boundary** — the page is a Server Component; only the interactive carousel is `"use client"`.
- **Keyboard + drag** — embla handles pointer drag and the primitive maps ArrowLeft/ArrowRight to prev/next; motion is globally neutralized under `prefers-reduced-motion`.

---

## Definition-of-done checklist (S-tier, scored)

- [x] **Looks intentional; on the design system** — glass card, display type, red accent; a few arbitrary values remain (finding 7, deferred).
- [~] **All states handled** — CTA hover/focus/active ✅; empty/error N/A (static, non-empty data). Inactive-slide AT announcement is the one soft spot (finding 6).
- [x] **Keyboard + labels + AA** — focus ring ✅, arrow-key nav ✅, `<h1>`/`<h2>` ✅; region name added (finding 3); contrast verified legible in screenshots.
- [x] **360 → wide, no CLS** — phone frame centered with `ink` surround; short-viewport (640/667) verified, CTA never clips.
- [x] **Dark mode deliberate** — dark-first system throughout.
- [x] **Motion subtle + reduced-motion respected** — 700 ms crossfade / 500 ms card scale / 200 ms CTA; neutralized under reduced-motion.
- [x] **TS strict-clean, no lint errors** — both clean.
- [~] **Feels fast / real product** — yes; source-image weight (finding 1) is the one hygiene item.

**Six findings fixed, one verified-no-change (6), two intentionally deferred (7 design-system tokens, 8 AVIF — both cross-cutting and out of a single-route pass).** No defect remains open. Verified after fixes: `npx tsc --noEmit` clean, `npm run lint` clean, headless renders at 640/667/940 show the CTA never clips and the recompressed images show no banding.

---

## Follow-up (re-review) — short-viewport clip reopened & properly fixed

**Reported by the user with a screenshot at iPhone SE (375×667):** the world card's **CTA arrow and the card's bottom rounded corners were still clipped** off the bottom of the frame. The original pass (finding 1) marked this fixed via `max-h-[calc(100dvh-23rem)]` on the card *image*, and its verification was **wrong** — capping the image alone was insufficient.

**Root cause.** `23rem` only reserved the *screen* chrome (pt-9/pb-8 + logo + h1 + the carousel's mt-4). It did **not** reserve the **card's own** vertical chrome that sits *below* the image: the card `p-6` top+bottom, the `<h2>` title (mt-5), the description (mt-2.5, two lines) and the CTA (mt-5 + a 48 px circle). That's another ~200 px. So the image shrank to fit `100dvh−23rem`, but the *card* (image + all that) still overflowed the centered, `overflow-hidden` region by ~26 px at 667 — clipping the CTA and bottom corners. Worse at 640.

**Fix.** [`world-carousel.tsx:104`](src/components/world-carousel.tsx#L104) — bumped the cap to `max-h-[calc(100dvh-26rem)]`. The `26rem` reserves **all** non-image chrome (screen + card), computed against the shortest target (640) with a comfortable margin. Only kicks in below ~779 px tall, so tall screens (the 940 baseline) keep the natural-size image and are visually unchanged. Also swapped the card's `rounded-[1.75rem]` → the exact `rounded-sheet` token (1.75rem) the IDE flagged ([:97](src/components/world-carousel.tsx#L97)).

**Verified (this time by actually looking at the whole card).** Headless screenshots at **390×667** and **390×640**: the full card — image, title, description, and the CTA circle with its bottom padding and rounded corners — now sits inside the frame with margin. **900×940** baseline unchanged (image still natural size). `npx tsc --noEmit` and `npm run lint` clean. Lesson banked in `CLAUDE.md`: the media-cap subtraction must count the card's own chrome, not just the screen's.
