# Code Review — Language route (`/language`)

**Scope:** the language-selection route and everything it renders/loads.
**Files:** [`src/app/language/page.tsx`](src/app/language/page.tsx) (route shell) · [`src/components/language-select.tsx`](src/components/language-select.tsx) (client UI) · [`src/lib/languages.ts`](src/lib/languages.ts) (data) · [`src/app/layout.tsx`](src/app/layout.tsx) (shell) · [`src/app/globals.css`](src/app/globals.css) (tokens/motion) · assets `public/worlds/mountain-peaks.png` (background) + `public/hero-logo.png`.
**Reviewer bar:** the S-tier checklist in `CLAUDE.md`; Next.js 16 image guidance from the bundled docs.
**Status:** ✅ **No defects found — ships as-is.** Two by-design/deferred observations only.

---

## Verdict

**Clean route, nothing to fix.** This is the app's best-executed a11y screen: a real `<fieldset>`/`<legend>` radio group built on **native `<input type="radio">`**, so keyboard (arrow-key roving, focus-visible ring via `has-[:focus-visible]`) and screen-reader semantics come for free. Selection is indicated by **three** non-color-dependent signals (red fill + inset ring + font-weight), not color alone. The design-system glass/blur pattern, staggered `.animate-rise`, and the `/language` red-when-valid CTA are all on-system. Critically, the **short-viewport case is handled by construction**: the list is `flex-1 overflow-y-auto`, so on iPhone-SE-class heights the rows scroll internally while the Continue CTA stays pinned and fully visible — the exact bug that bit `/world-selection` and `/pick-story` cannot occur here.

### Build health (verified)
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean (exit 0) |
| `npm run lint` | ✅ clean (exit 0) |
| Asset dims vs `next/image` props | ✅ `hero-logo.png` 536×197 = `width/height` + `style height:auto`; background `fill`+`sizes="440px"` |
| Headless render @ 900×940 / 667 / 640 | ✅ all clean — list scrolls internally, CTA pinned & visible at every height |

---

## Findings

| # | Severity | Area | Summary | Status |
|---|----------|------|---------|--------|
| 1 | Low | Correctness / product | The `?story=` param from `/pick-story` arrives but is unused and not forwarded (only `?lang=` goes on, and `/details` ignores that too) | ✅ **Verified — no change (by design)** |
| 2 | Low | Design system | App-wide arbitrary-value cluster (`text-[1.05rem]`, `text-[1.9rem]`, `min-h-[3.5rem]`, index-based `animationDelay`, etc.) | ⏸️ **Deferred (app-wide sweep)** |

### 1 · `?story=` param is dropped — Low (correctness / product)
`/pick-story` links here as `/language?story=${slug}` ([pick-story/page.tsx:52](src/app/pick-story/page.tsx#L52)), but this screen never reads the param and forwards only `/details?lang=${selected}` ([language-select.tsx:25](src/components/language-select.tsx#L25)); `/details` in turn doesn't read `lang`. So the story (and, upstream, the world) choice is not threaded past here. This is the **same by-design posture** as the `?world=` finding in the pick-story review: the flow is linear and downstream screens don't yet theme off earlier choices. **✅ No change** — flagged so it's a conscious choice; if the story/world/language ever needs to reach the backend or theme a later screen, thread the params through `/pick-story` → `/language` → `/details` (and read them in the `/details` submit).

### 2 · Arbitrary values vs. tokens — Low (design system)
`text-[1.05rem]`, `text-[1.9rem]`, `min-h-[3.5rem]`, the `180 + i*55` inline `animationDelay`, and assorted drop-shadows. Identical posture to every other screen's deferred token finding — a cross-cutting refactor that should land as one app-wide sweep, not piecemeal on one route (piecemeal changes diverge the screens). **⏸️ Deferred.**

---

## What's done well

- **Best-in-app radio a11y** — `<fieldset>` + `sr-only <legend>` + native `<input type="radio">` in `<label>`s ([language-select.tsx:60-101](src/components/language-select.tsx#L60-L101)): free roving arrow-key navigation, native single-select semantics, and a real focus ring surfaced on the label via `has-[:focus-visible]` even though the input is visually hidden.
- **Selection is not color-only** — the chosen row gets a red fill overlay **+** an inset `ring-hero-red` **+** `font-semibold` ([:90-95](src/components/language-select.tsx#L90-L95)); meets the non-color-cue bar for color-blind users.
- **Short viewport handled by construction** — the list is `flex-1 overflow-y-auto` with hidden scrollbars ([:60](src/components/language-select.tsx#L60)); rows scroll, the CTA stays pinned. No media-cap gymnastics needed.
- **Deliberate glass choice** — the rows intentionally compose the frosted look from utilities (inner top highlight, no heavy drop shadow) rather than `.glass`, with a code comment explaining the heavy `.glass` shadow would pool into dark bands between tightly-stacked rows ([:69-73](src/components/language-select.tsx#L69-L73)). Considered, not accidental.
- **CTA state matrix** — disabled (`opacity-40 cursor-not-allowed`, not focusable) until a choice is made; hover-lift + shadow + arrow nudge + `active:scale` once enabled; focus-visible ring ([:105-131](src/components/language-select.tsx#L105-L131)). Reuses the house red-when-valid pill pattern.
- **`<main>` landmark + real `<h1>`** — the route wraps the client UI in `<main>` ([language/page.tsx:5](src/app/language/page.tsx#L5)); the screen has a proper `<h1>` "Select your language".
- **`preload` (not `priority`)** — already on the Next-16-current prop.

---

## Definition-of-done checklist (S-tier, scored)

- [x] **Looks intentional; on the design system** — glass rows, red accent, display h1; arbitrary values deferred (finding 2, app-wide).
- [x] **All states handled** — default/hover/focus/active/selected/disabled all present; empty/error N/A (static, non-empty list).
- [x] **Keyboard + labels + AA** — native radios, roving arrows, focus-visible ring, `<fieldset>`/`<legend>`; contrast legible on the darkened bg.
- [x] **360 → wide, no CLS** — list scrolls internally; CTA pinned & visible at 640/667/940.
- [x] **Dark mode deliberate** — dark-first system.
- [x] **Motion subtle + reduced-motion respected** — staggered rise + 200 ms row/CTA transitions; neutralized under reduced-motion.
- [x] **TS strict-clean, no lint errors** — both clean.
- [x] **Feels fast / real product** — yes.

**No defects. One by-design param observation (1) and the shared design-system token sweep (2) are the only notes — both consistent with the other route reviews. Nothing was changed on this route.**

---

## Follow-up — screen redesigned (this review is now partly superseded)

After this review, the user supplied a reference mock and `/language` was **redesigned**: the rows now **fill the screen and there is no Continue button** — each row is a `<Link href="/details?lang=…">`, so **tapping a language navigates straight to `/details`** (the choice *is* the action). Because selecting = navigating, the component dropped `"use client"` and is now a **pure Server Component** (native `<a>` links → free Tab/Enter + SR support; zero client JS). The red highlight is now the **hover / focus / press** affordance (a left→right `hero-red` gradient) rather than a persistent radiogroup selection.

What still holds from above: the design-system glass rows, the big left-aligned `.display` `<h1>`, AA-legible text, `preload` images, and the by-design `?story=`/`?lang=` param pass-through. What's **no longer applicable**: the `<fieldset>`/radiogroup/`<legend>` and disabled-until-selected Continue pill notes (that UI was replaced). Build health re-verified after the redesign: `npx tsc --noEmit` and `npm run lint` both clean; headless renders at 440 / 667 / 940 show the 7 rows filling the frame with no clipping and no CTA.
