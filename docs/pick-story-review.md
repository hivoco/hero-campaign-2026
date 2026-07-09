# Code Review — Pick Story route (`/pick-story`)

**Scope:** the story-grid route and everything it renders/loads.
**Files:** [`src/app/pick-story/page.tsx`](src/app/pick-story/page.tsx) (route + inline `StoryCard`) · [`src/lib/stories.ts`](src/lib/stories.ts) (data) · [`src/app/layout.tsx`](src/app/layout.tsx) (shell) · [`src/app/globals.css`](src/app/globals.css) (tokens/motion) · assets `public/stories/{the-lost-kitten,the-tired-dragon,great-mountain-chase,big-mountain-rescue}.png` + `public/worlds/mountain-peaks.png` (background) + `public/hero-logo.png`.
**Reviewer bar:** the S-tier checklist in `CLAUDE.md`; Next.js 16 image guidance from the bundled docs.
**Status:** ✅ all findings actioned — see the resolution notes below.

---

## Verdict

**Ship-ready after one real fix.** The route is a clean Server Component with correct heading structure, a full hover/focus/active state matrix on the cards, the design-system glass/blur pattern, and staggered entrance motion. It reuses the (now-compressed) `mountain-peaks.png` for its background, so it inherited that win for free. The one genuine defect is the **short-viewport gotcha**: on 640–667px-tall phones (iPhone SE class) the bottom row of the 2×2 grid clips at the screen edge — this route never got the media-cap treatment `/world-selection` has. Secondary: the story thumbnails are lower-resolution than the slot they fill, so they soften on retina. Both addressed below.

### Build health (verified after fixes)
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean (exit 0) |
| `npm run lint` | ✅ clean (exit 0) |
| Asset dims vs `next/image` props | ✅ `hero-logo.png` 536×197 = `width/height`; background `fill`+`sizes`. ⏸️ thumbnails 160–224px source in a 132px slot stay under-resolved at DPR ≥ 2 (finding 2 — deferred, needs better art) |
| Headless render @ 900×640 / 667 / 940 | ✅ **all three clean after the clamp fix — bottom card row no longer clips at 640/667**; 940 unchanged |

---

## Findings & resolution

| # | Severity | Area | Summary | Status |
|---|----------|------|---------|--------|
| 1 | **Medium** | Robustness / layout | Short-viewport (≤667, iPhone SE) clips the bottom row of the 2×2 grid | ✅ **Fixed** |
| 2 | Low–Med | Perf / quality | Story thumbnails are 160–224px source in a 132px slot → soft on retina | ⏸️ **Deferred (by decision — needs art)** |
| 3 | Nit | a11y | Thumbnail `alt` duplicates the card's `<h2>` (link name announced twice) | ⏸️ **Deferred (by decision)** |
| 4 | Nit | Design system | `rounded-[1.25rem]` where the `rounded-panel` token is exactly 1.25rem | ✅ **Fixed** |
| 5 | Low | Correctness / product | The `?world=` param from `/world-selection` arrives but is unused and not forwarded | ✅ **Verified — no change (by design)** |
| 6 | Low | Design system | Other arbitrary values vs. tokens (`size-[8.25rem]`, `text-[2rem]`, `text-[1.1rem]`, …) | ⏸️ **Deferred (by decision)** |
| 7 | Nit | a11y | 2×2 choice grid is a bare `<div>` of links (no list/`nav` grouping) | ⏸️ **Deferred (by decision)** |

---

### 1 · Short-viewport clips the bottom row — Medium (robustness / layout)
The frame is `h-dvh` + `overflow-hidden` ([page.tsx:9](src/app/pick-story/page.tsx#L9)) and the grid is `grid flex-1 content-center` with **fixed** `size-[8.25rem]` (132px) circular thumbnails ([page.tsx:39](src/app/pick-story/page.tsx#L39), [:62](src/app/pick-story/page.tsx#L62)). On a short screen the grid's natural height (two rows of pt-6 + 132px thumb + title + pb-7, and the two longer titles wrap to two lines) exceeds the available space; because it's centered in `overflow-hidden`, the excess is clipped top **and** bottom. **Verified** at window heights **640 and 667**: the bottom row's card padding and rounded corners are cut off at the viewport edge (the titles stay readable, but the cards look sheared and their touch targets clip). This is the exact gotcha `CLAUDE.md` documents; `/world-selection` handles it (`max-h-[calc(100dvh-23rem)]` on its media) and this route doesn't.
**✅ Fixed.** Changed the thumbnail from the fixed `size-[8.25rem]` to `size-[clamp(5.5rem,15vh,8.25rem)]` ([page.tsx:62](src/app/pick-story/page.tsx#L62)) — the house "cap the media" pattern applied to a circular thumb: it stays the full 8.25rem on tall screens and shrinks on short ones so both grid rows fit. **Verified** via headless screenshots at 640, 667, and 940: the bottom row now renders fully (card padding + rounded corners intact) at every height; 940 is visually unchanged.

### 2 · Thumbnails under-resolved for retina — Low–Medium (perf / quality)
The thumbnail slot is `size-[8.25rem]` = **132px** with `sizes="132px"` ([page.tsx:62-68](src/app/pick-story/page.tsx#L62-L68)), but the sources are only **160×160** (`the-lost-kitten`, `the-tired-dragon`, `big-mountain-rescue`) and **224×224** (`great-mountain-chase`). A 132px CSS slot needs 264px at DPR 2 and 396px at DPR 3; `next/image` never upscales past the source, so on virtually every modern phone the browser gets a ≤224px image stretched into a larger slot → visibly soft. `CLAUDE.md` already notes these were cropped from a full-page mockup and to replace them if clean art arrives. Upscaling with a filter would add bytes without adding detail. **⏸️ Deferred (by decision).** Kept the sources as-is — upscaling would add bytes, not detail. Flagged in `CLAUDE.md` for the user to drop in clean **≥400px square** standalone story PNGs (same filenames, no reference churn) when available; the short-viewport clamp (finding 1) also shrinks the slot on small screens, narrowing the gap. (Also noted: `great-mountain-chase` at 224 is inconsistent with the other three at 160.)

### 3 · Thumbnail `alt` duplicates the heading — Nit (a11y)
[page.tsx:65](src/app/pick-story/page.tsx#L65) sets `alt={story.title}` and the `<h2>` inside the same `<Link>` ([:72-74](src/app/pick-story/page.tsx#L72-L74)) states the same title. A link's accessible name is composed from its descendants, so each card announces e.g. "The Lost Kitten The Lost Kitten". The image is a functional image *with an adjacent text label*, so per WCAG it should be decorative. **⏸️ Deferred (by decision).** You opted not to apply the decorative-alt change this pass, so `alt={story.title}` stays. (For reference, the WCAG-preferred value here is `alt=""` since the `<h2>` inside the link already names it; the current double-announce is a minor nit, not a blocker.)

### 4 · `rounded-[1.25rem]` vs the `rounded-panel` token — Nit (design system)
[page.tsx:54](src/app/pick-story/page.tsx#L54) uses `rounded-[1.25rem]`, but `--radius-panel: 1.25rem` is defined in `@theme` ([globals.css:26](src/app/globals.css#L26)) and generates `rounded-panel`. This is a token that exists being written as an arbitrary value. **✅ Fixed.** Swapped `rounded-[1.25rem]` → `rounded-panel` ([page.tsx:54](src/app/pick-story/page.tsx#L54)) — exact-match token, zero visual change (confirmed `rounded-panel` present in the served HTML). The broader arbitrary-value cluster (finding 6) stays deferred; this was the one exact-token swap worth doing inline.

### 5 · `?world=` param is dropped — Low (correctness / product)
`/world-selection` links here as `/pick-story?world=${slug}` ([world-carousel.tsx:122](src/components/world-carousel.tsx#L122)), but this page ignores the param — it hardcodes `mountain-peaks.png` as the background ([page.tsx:13](src/app/pick-story/page.tsx#L13)) and forwards only `?story=` onward to `/language` ([page.tsx:52](src/app/pick-story/page.tsx#L52)). So the user's world choice is silently lost here. Per `CLAUDE.md` the fixed `mountain-peaks` background is intentional, so this is a **product observation**, not a defect: if downstream screens are ever meant to reflect the chosen world, the param needs threading through. **✅ Verified — no change (by design).** Left as-is per `CLAUDE.md`'s fixed-`mountain-peaks` decision; flagged here so it's a conscious choice — if the world theme should ever carry downstream, the `?world=` param needs threading through this page and onto `/language`.

### 6 · Other arbitrary values vs. tokens — Low (design system)
`size-[8.25rem]` (now `clamp(…)`), `text-[2rem]`, `text-[1.1rem]`, `w-[8.25rem]`, `gap-3.5`, several `drop-shadow-[…]`, index-based `animationDelay`, and the repeated `ease-[var(--ease-out-soft)]` (the IDE flags this can be the canonical `ease-out-soft` token). Same posture as the homepage/world-selection deferred token findings — a cross-cutting refactor used identically across every screen, so changing it piecemeal here would diverge. **⏸️ Deferred (by decision).** Left for a dedicated app-wide token sweep (the exact-match `rounded-panel` in finding 4 was the one inline exception).

### 7 · Choice grid is a bare `<div>` — Nit (a11y)
The four story links sit in a plain `grid` div ([page.tsx:39-43](src/app/pick-story/page.tsx#L39-L43)). A screen-reader user gets four links with no grouping or count. Semantically this is a list of choices. **⏸️ Deferred (by decision).** Left as-is this pass — the `<h1>` + `<main>` landmarks already frame the section, and adding a list/`nav` only here would diverge from the other screens; fold it into a consistent a11y pass if desired.

---

## What's done well

- **Clean Server Component** — no `"use client"`, zero client JS for this route.
- **Correct heading structure** — a real `<h1>` "Pick your story" ([page.tsx:35](src/app/pick-story/page.tsx#L35)) and an `<h2>` per card.
- **Full card state matrix** — `hover:-translate-y-0.5` + `hover:bg-[var(--glass-fill-strong)]` + `hover:shadow-lift`, a real `focus-visible` ring with offset, `active:scale-[0.99]`, and a `group-hover` thumbnail zoom ([page.tsx:53-62](src/app/pick-story/page.tsx#L53-L62)); GPU-friendly transforms, ~200 ms ease.
- **Staggered entrance** — per-card `animationDelay` ([page.tsx:60](src/app/pick-story/page.tsx#L60)) on `.animate-rise`; neutralized under `prefers-reduced-motion`.
- **`text-wrap:balance`** on titles ([page.tsx:72](src/app/pick-story/page.tsx#L72)) — even two-line wraps, a nice craft detail.
- **Design-system background** — un-blurred `next/image` + `bg-black/45 backdrop-blur-[10px]` overlay ([page.tsx:11-21](src/app/pick-story/page.tsx#L11-L21)), reusing the already-compressed `mountain-peaks.png`; decorative, so `alt="" aria-hidden`.
- **`preload` (not `priority`)** — already on the Next-16-current prop after the app-wide migration.
- **Real `<Link>` navigation** — not divs; keyboard- and screen-reader-navigable.

---

## Definition-of-done checklist (S-tier, scored)

- [x] **Looks intentional; on the design system** — glass cards, display type, balanced titles; `rounded-panel` token restored; remaining arbitrary values deferred (finding 6).
- [x] **All states handled** — hover/focus/active ✅; empty/error N/A (static, non-empty data).
- [x] **Keyboard + labels + AA** — focus rings ✅, `<h1>`/`<h2>` ✅; contrast verified legible. Alt duplication (3) deferred by decision — a minor nit, not a blocker.
- [x] **360 → wide, no CLS** — ✅ **fixed**: short viewport (640/667) now fits both grid rows via the thumbnail clamp (finding 1).
- [x] **Dark mode deliberate** — dark-first system.
- [x] **Motion subtle + reduced-motion respected** — 200 ms card transitions, staggered rise, neutralized under reduced-motion.
- [x] **TS strict-clean, no lint errors** — both clean.
- [~] **Feels fast / real product** — yes; the one remaining gap is soft thumbnails on retina (finding 2), which needs higher-res source art.

**The Medium defect (short-viewport clipping) is fixed and verified, plus the `rounded-panel` token swap. The `?world=` param is verified no-change (by design); the rest are polish deferred by your decision (thumbnail art, decorative alt, token sweep, list grouping).**
