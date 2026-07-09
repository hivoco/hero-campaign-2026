# Code Review — Homepage route (`/`)

**Scope:** the landing route and everything it renders/loads.
**Files:** [`src/app/page.tsx`](src/app/page.tsx) (route) · [`src/app/layout.tsx`](src/app/layout.tsx) (shell) · [`src/app/globals.css`](src/app/globals.css) (tokens/motion it consumes) · assets `hero-bg.png`, `hero-logo.png`, `destini-wordmark.png`.
**Reviewer bar:** the S-tier checklist in `CLAUDE.md`.
**Status:** ✅ all findings actioned — see the resolution notes below.

---

## Verdict

**Ship-ready.** The route is a clean Server Component, prioritizes its LCP, handles hover/focus/active/reduced-motion, and matches the design system. No correctness bugs. Every finding below has been resolved, deferred by an explicit product decision, or verified as a non-issue.

### Build health (verified after fixes)
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean (exit 0) |
| `npm run lint` | ✅ clean |
| Headless render @ 640 / 667 / 940 | ✅ CTA visible, text legible, hero renders clean |

---

## Findings & resolution

| # | Severity | Area | Summary | Status |
|---|----------|------|---------|--------|
| 1 | Medium | a11y / SEO | Page had no `<h1>` / heading landmark | ✅ **Fixed** |
| 2 | Medium | Readability | Full sentence set in condensed all-caps (`.display`) | ⏸️ **Deferred (by decision)** |
| 3 | Low–Med | Perf | `hero-bg.png` source was 2.5 MB (it's the LCP) | ✅ **Fixed** |
| 4 | Low | Contrast | Welcome-text contrast depends on the underlying photo | ✅ **Verified — no change** |
| 5 | Low | Robustness | Short-viewport (SE-class) could crowd the CTA | ✅ **Verified — no change** |
| 6 | Low | Design system | Cluster of arbitrary values vs. tokens | ⏸️ **Deferred (by decision)** |
| 7 | Nit | Cleanup | `overflow-x-hidden overflow-y-hidden` redundancy | ✅ **Fixed** |

---

### 1 · No heading landmark — Medium (a11y / SEO) → ✅ Fixed
The visible welcome copy is set in the condensed display face, so a screen reader / crawler got no document heading. **Fix applied:** added a visually-hidden `<h1 className="sr-only">Welcome to the Hero Destini fantasy world</h1>` as the first foreground element ([page.tsx:30-32](src/app/page.tsx#L30-L32)). Carries the landmark for AT and SEO with zero visual change.

### 2 · Long-form condensed all-caps — Medium (readability) → ⏸️ Deferred
The welcome sentence uses `.display` (Bebas Neue, uppercase, `line-height: 0.98`) at `0.84rem` ([page.tsx:47](src/app/page.tsx#L47)); all-caps hurts word-shape recognition for a full sentence. **Decision:** keep the current look intentionally — the visible design is unchanged. The a11y half of this concern is already covered by the `sr-only` `<h1>` from finding 1. Revisit only if a copy pass reopens the panel.

### 3 · Heavy LCP source image — Low–Medium (perf) → ✅ Fixed
`public/hero-bg.png` was **2.48 MB (941×1672)** and is the `priority` full-bleed LCP. **Fix applied:** recompressed **in place** with a Python/Pillow + libimagequant (pngquant-quality) script → **0.74 MB, ~70% smaller**, at the **same 941×1672** resolution (deliberately not downscaled, so high-DPI phones stay crisp; `next/image` still generates a per-device AVIF/WebP srcset from it). Verified visually: the sunset gradient shows no banding (Floyd–Steinberg dithering). Lossless original backed up to the session scratchpad, out of `public/`. Same asset also backs `/thank-you`, which benefits for free.

### 4 · Text-over-photo contrast — Low (contrast) → ✅ Verified, no change
`text-cloud` welcome copy sits on `.glass` over the hero photo where the mid-screen scrim is transparent ([page.tsx:22](src/app/page.tsx#L22)). **Verified** via headless screenshots at 640/940: the panel sits over the upper sky region and the white text reads clearly through the glass blur. No weak spots found, so no change made.

### 5 · Short-viewport check — Low (robustness) → ✅ Verified, no change
Frame is `h-dvh` + `overflow-hidden` ([page.tsx:6](src/app/page.tsx#L6)) with a `flex-1` spacer ([page.tsx:54](src/app/page.tsx#L54)). **Verified** at window heights **640** and **667**: the spacer absorbs the slack and the "Start Your Adventure" CTA stays fully on-screen — nothing clips. No change needed.

### 6 · Arbitrary values vs. tokens — Low (design system) → ⏸️ Deferred
One-off values remain (`text-[0.84rem]`, `leading-[1.22]`, `w-[9.25rem]`, `text-[1.05rem]`, `[animation-delay:*ms]`). **Decision:** leave as-is for now — these are pixel-matched to the reference and the recurring ones (CTA sizing, stagger delays) are shared with `/language` and `/details`, so promoting them to tokens is a cross-cutting refactor better done in one deliberate pass, not piecemeal on this route.

### 7 · Redundant overflow classes — Nit → ✅ Fixed
[page.tsx:6](src/app/page.tsx#L6): `overflow-x-hidden overflow-y-hidden` collapsed to `overflow-hidden`.

---

## What's done well (unchanged, still true)

- **Correct Server Component** — no `"use client"`, zero client JS shipped for this route.
- **LCP prioritized** — both `hero-bg` and `hero-logo` carry `priority`; the background gets `fill` + `sizes`.
- **Full state matrix on the CTA** — hover lift, `active:scale`, and a real `focus-visible` ring ([page.tsx:71](src/app/page.tsx#L71)); transitions animate `transform`/`opacity` only (GPU-friendly), ~200ms ease-out.
- **Reduced motion** globally neutralized ([globals.css:115](src/app/globals.css#L115)); the `.animate-rise` stagger degrades cleanly.
- **Semantics** — real `<Link>` for navigation (not a div), decorative SVG + scrim marked `aria-hidden`, meaningful `alt` on the background image.
- **Image hygiene** — `width`/`height` match true asset ratios (536×197, 324×61) with `style={{height:"auto"}}`, per the repo gotcha.
- **Metadata/viewport** set in the layout (`themeColor`, `colorScheme: dark`, title/description).

---

## Definition-of-done checklist (post-fix)

- [x] Looks intentional; on the design system
- [x] All states handled — CTA states ✅; heading landmark now present
- [x] Keyboard + labels + AA — focus ring ✅; contrast verified; `<h1>` added
- [x] 360→wide, no CLS — short viewport (640/667) verified, CTA never clips
- [x] Dark mode deliberate (dark-first system)
- [x] Motion subtle + reduced-motion respected
- [x] TS strict-clean, no lint errors

**Two items intentionally deferred** (findings 2 and 6) are product/refactor decisions, not defects. Everything else is fixed and verified.
