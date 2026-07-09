# Code Review — Thank-You route (`/thank-you`)

**Scope:** the end / confirmation screen and everything it renders/loads.
**Files:** [`src/app/thank-you/page.tsx`](src/app/thank-you/page.tsx) (route) · [`src/app/layout.tsx`](src/app/layout.tsx) (shell) · [`src/app/globals.css`](src/app/globals.css) (tokens/motion) · assets `public/hero-bg.png` (941×1672 campaign hero) + `public/hero-logo.png` (536×197) + `public/destini-wordmark.png` (**324×61**).
**Reviewer bar:** the S-tier checklist in `CLAUDE.md`; Next.js 16 image guidance from the bundled docs.
**Status:** ✅ all findings actioned — see resolution notes below.

---

## Verdict

**Ship-ready after three fixes, all landed.** A clean static Server Component: full-bleed campaign hero with top/bottom legibility scrims, a white "Back to Home" pill with a complete state matrix, the tagline plate, confirmation copy, and the Destini wordmark. Two real defects were hiding in the wordmark and the document outline: (1) the wordmark declared `640×160` intrinsic dimensions against a file that is actually **324×61**, so the reserved box had the wrong aspect ratio and **collapsed on load (CLS)** — and it violated the repo's own "match the asset's true ratio" convention that the homepage (same asset) already follows correctly; (2) the screen had **no heading at all** — zero `<h1>`–`<h6>` — while every other screen in the flow has an `<h1>`. Both fixed, plus an alt-text consistency nit on the same wordmark.

### Build health (verified after fixes)
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean (exit 0) |
| `npm run lint` | ✅ clean (exit 0) |
| Asset dims vs `next/image` props | ✅ after fix: `hero-logo` 536×197 ✓, `hero-bg` `fill`+`sizes` ✓, **`destini-wordmark` now 324×61 (was 640×160)** — matches the true file and the homepage |
| Headless render @ 900×940 / 667 / 640 | ✅ all clean — the hero is a `fill` background and the foreground uses `mt-auto`, so nothing clips at short heights; 940 visually unchanged after fixes |
| Heading landmark present | ✅ after fix: `<h1>` now served (was **NONE**) |

---

## Findings & resolution

| # | Severity | Area | Summary | Status |
|---|----------|------|---------|--------|
| 1 | **Low–Med** | Perf / correctness (CLS) | Wordmark declared `width={640} height={160}` (4:1) but the file is 324×61 (5.31:1) → wrong reserved box → layout shift on load; violates the documented true-ratio convention | ✅ **Fixed** |
| 2 | **Low** | a11y / document structure | The end screen has **no heading** (no `<h1>`), unlike every other screen | ✅ **Fixed** |
| 3 | Nit | a11y / consistency | Wordmark `alt` differs from the homepage's alt for the *same* asset (`"Destini … &amp; …"` vs `"Hero Destini … and …"`) | ✅ **Fixed** |
| 4 | Nit | Design system | `rounded-2xl` + arbitrary values (`text-[1.95rem]`, `text-[2.6rem]`, `w-[22rem]`, `max-w-[19rem]`, `w-[9.5rem]`, …) | ⏸️ **Deferred (app-wide sweep)** |
| 5 | Low | a11y (app-wide) | Focus is not explicitly managed on route change into this screen | ⏸️ **Deferred (app-wide, not thank-you-specific)** |

---

### 1 · Wordmark intrinsic dimensions wrong → CLS — Low–Medium (perf / correctness)
[thank-you/page.tsx](src/app/thank-you/page.tsx) rendered the wordmark with `width={640} height={160}` (a 4:1 box), but `public/destini-wordmark.png` is **324×61** (5.31:1) — confirmed via `sips` and by the served HTML (`width="640" height="160"`). With `style={{height:"auto"}}` + `w-[9.5rem]`, the *displayed* image isn't distorted (the browser derives display height from the real image), but the **placeholder box reserved from the width/height attrs uses the wrong 4:1 ratio** and snaps to the true 5.31:1 when the image loads → a vertical **layout shift** of ~9 px. It also breaks the repo convention (`CLAUDE.md` gotcha: "give `next/image` `width`/`height` props that match the asset's true ratio … or Next warns") that the **homepage already follows** for the identical asset (`width={324} height={61}`, served `width="324" height="61"`).
**✅ Fixed.** Set `width={324} height={61}` to match the true file and the homepage. Served HTML now `width="324" height="61"`; the reserved box matches the loaded image → no shift. 940 baseline visually unchanged (display size is still `w-[9.5rem]`).

### 2 · No heading landmark on the screen — Low (a11y / document structure)
`curl … | grep '<h[1-6]'` returned **NONE** — the confirmation screen had zero headings. The campaign tagline "Hero Ka Scooter / Scooter Ka Hero" (the largest, most prominent text, and the page's title-level message) was two plain `<p>`s inside a `<div>`. Every other screen exposes an `<h1>` ("Select your language", "Pick your story", "Almost There", …), so a screen-reader user landing here after submit got no page title and no outline entry.
**✅ Fixed.** Promoted the tagline plate to an `<h1>`, with the two lines as block `<span>`s so it reads as a single heading (`display` class + sizes unchanged → **pixel-identical** render). Served HTML now includes `<h1 …>`; the confirmation copy stays a `<p>`.

### 3 · Wordmark alt inconsistent with the homepage — Nit (a11y / consistency)
The same asset was announced two different ways: homepage `alt="Hero Destini — available in 110cc and 125cc"` vs thank-you `alt="Destini — available in 110cc &amp; 125cc"`. (The `&amp;` is harmless — JSX decodes it to `&` — but it's needless, and "Destini" alone drops the brand.)
**✅ Fixed.** Aligned thank-you's alt to the homepage's exact string. Same asset, same accessible name across the app.

### 4 · `rounded-2xl` + arbitrary values — Nit (design system)
The tagline plate uses `rounded-2xl` (1rem, not an exact token — nearest is `rounded-panel` 1.25rem, so a swap would change the visual and isn't a clean exact-match), plus the usual `text-[1.95rem]` / `text-[2.6rem]` / `w-[22rem]` / `max-w-[19rem]` / `w-[9.5rem]` cluster the IDE flags as canonical-class candidates.
**⏸️ Deferred (app-wide sweep).** Same posture as every other route review — fold into one design-system pass rather than diverging this screen. (The exact-match `rounded-sheet` swap on `/world-selection` this session was the kind of change worth doing inline; `rounded-2xl` here has no exact token, so it waits.)

### 5 · Focus not managed on route change — Low (a11y, app-wide)
`verify-modal.tsx` does `router.push("/thank-you")`; Next doesn't move focus to the new screen's heading on client navigation, so focus can rest on the (now-unmounted) trigger's position. This is **not specific to thank-you** — no screen in the flow manages route-change focus — so fixing it only here would be inconsistent.
**⏸️ Deferred (app-wide).** Flag for a single focus-management pass (e.g. focus the new `<h1>` — now that thank-you has one — or a route-announcer) across all client navigations.

---

## What's done well

- **Static Server Component** — no `"use client"`, zero client JS.
- **"Back to Home" state matrix** — a deliberate white/light pill (like the intentional light OTP sheet) with hover-lift + shadow growth, `focus-visible` ring with offset, and `active` reset ([thank-you/page.tsx:34-40](src/app/thank-you/page.tsx#L34-L40)); first in DOM, so keyboard users hit the one action immediately.
- **Full-bleed hero done right** — `next/image fill` + `object-cover` with `preload`, and **two** legibility scrims (top for the chrome, bottom for the copy) ([:16-29](src/app/thank-you/page.tsx#L16-L29)); the decorative image is `alt="" aria-hidden`.
- **Short viewport is a non-issue** — the hero is a background layer, and the foreground column uses `mt-auto` to seat the confirmation + wordmark; verified no clipping at 640/667.
- **Staggered entrance** — tagline / copy / wordmark rise with `[animation-delay:*]`; neutralized under `prefers-reduced-motion`.
- **`preload` (not `priority`)** — on the Next-16-current prop after the app-wide migration.

---

## Definition-of-done checklist (S-tier, scored)

- [x] **Looks intentional; on the design system** — hero + glass tagline plate + wordmark; arbitrary values deferred (finding 4, app-wide).
- [x] **All states handled** — the single CTA has hover/focus/active; empty/error/loading N/A (static end screen).
- [x] **Keyboard + labels + AA** — CTA reachable & ringed; **now has an `<h1>`** (finding 2); logo/wordmark labeled; copy is high-contrast cloud-on-dark-scrim.
- [x] **360 → wide, no CLS** — **fixed**: wordmark box now matches the file, so no load-time shift (finding 1); no clipping at short heights.
- [x] **Dark mode deliberate** — dark-first system.
- [x] **Motion subtle + reduced-motion respected** — staggered rise; neutralized under reduced-motion.
- [x] **TS strict-clean, no lint errors** — both clean.
- [x] **Feels fast / real product** — yes.

**Two real defects fixed (wordmark CLS + missing `<h1>`) plus an alt-consistency nit; the design-system token cluster (4) and app-wide route-focus (5) are deferred by the same policy as the other reviews.**

---

## Re-review — 2026-07-08 (verify prior fixes + hunt new)

A second pass (5-dimension multi-agent review + adversarial verification of every finding) re-checked this
screen against the current code. **The three prior fixes are all genuinely present:** wordmark `324×61`
(matches the true file + the homepage), the tagline `<h1>` landmark, and the wordmark `alt` matching the
homepage's exact string. `tsc --noEmit` + `eslint` clean; `/thank-you` re-screenshotted at 900×940 — renders
intact.

**One new finding (Nit), resolved:**

| # | Severity | Area | Summary | Status |
|---|----------|------|---------|--------|
| R1 | Nit | Design-fidelity / doc drift | CLAUDE.md documented the tagline **line 1 as "outlined via `-webkit-text-stroke`"**, but the code renders both lines flat (solid `cloud` italic + drop-shadow) — no stroke anywhere in `src/`. | ✅ **Reconciled (doc)** |

### R1 · Tagline line-1 stroke — doc vs. code divergence (Nit)
Adversarially CONFIRMED: `page.tsx:56-61` styles both tagline spans identically (`display block … text-cloud
italic drop-shadow-[…]`); a repo-wide grep for `text-stroke`/`WebkitTextStroke` returns nothing, yet
CLAUDE.md's `/thank-you` row claimed a `-webkit-text-stroke` outline on line 1. Not a functional defect
(renders legibly) — purely a design-fidelity/handoff mismatch the prior review didn't flag.
**✅ Resolved:** the user confirmed **the flat look is the intended design** ("keep it same as before"), so
**CLAUDE.md was updated** to drop the stale stroke note (the `/thank-you` row now records the flat treatment
explicitly). **No code change** — `page.tsx` is unchanged and correct.

**Net: no code defects on `/thank-you`; the only issue was a stale doc line, now reconciled.**
