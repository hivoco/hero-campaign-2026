# Hero Destini — Fantasy World Campaign

A mobile-first campaign web app for **Hero MotoCorp**. A parent picks a world, a story, and a
language, uploads a selfie with their child, verifies their number via WhatsApp OTP, and the app
generates a personalised "dragon story" film for their child. Tone: cinematic, magical, adventure.

> Working on this with an AI coding agent? The design system, conventions, and guardrails are documented
> in **[CLAUDE.md](./CLAUDE.md)** (agent-facing). This README covers what the project is and how to run it.

## Tech stack

| | |
|---|---|
| Framework | **Next.js 16** (App Router, React Server Components, Turbopack) |
| UI | **React 19** + **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** — CSS-first `@theme` tokens in `src/app/globals.css` |
| Fonts | `next/font/google` — **Bebas Neue** (condensed display) + Helvetica Neue (body) |
| Components | **shadcn/ui** (`carousel`, `card`, `button`) — styled with the Hero glass system, **not** shadcn's default color palette |
| Forms | **react-hook-form** + **zod** (via `@hookform/resolvers`) — schema-validated inputs |
| Camera / face | `getUserMedia` selfie capture + **`@vladmandic/face-api`** (lazy-loaded) for the two-face quality gate |
| Aliases | `@/*` → `src/*` |

> ⚠️ This is **Next.js 16**, which has breaking changes from older versions (see `AGENTS.md`). Read the
> relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code.

## Getting started

```bash
npm run dev      # start the dev server → http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Project structure

```
src/
  app/
    layout.tsx           # fonts (Bebas Neue), metadata, viewport
    globals.css          # Tailwind + design tokens (colors, glass, radii, shadows, motion)
    page.tsx             # "/" — Landing screen
    world-selection/
      page.tsx           # "/world-selection" — World carousel
    pick-story/
      page.tsx           # "/pick-story"      — Story grid
    language/
      page.tsx           # "/language"        — Language selection list (tap a row → /details)
    details/
      page.tsx           # "/details"         — Details + selfie ("Every Adventure Needs Heroes") + OTP sheet
    thank-you/
      page.tsx           # "/thank-you"       — Thank-you / end screen
  components/
    world-carousel.tsx     # client carousel (embla) for world selection
    language-select.tsx    # server-rendered tap-to-navigate language list (links, no client JS)
    details-form.tsx       # client details form (react-hook-form + zod) + selfie choice
    selfie-source-sheet.tsx# "Take a selfie" vs "Upload a photo" bottom sheet
    capture-overlay.tsx    # full-screen selfie camera flow (c0→c1→c2→c3)
    verify-modal.tsx       # client OTP + consent bottom-sheet (opened from details-form)
    ui/                    # shadcn components (carousel, card, button)
  hooks/
    use-camera.ts          # getUserMedia acquisition + deterministic teardown
  lib/
    worlds.ts              # world carousel data
    stories.ts             # story grid data
    languages.ts           # language selection data
    details-schema.ts      # zod schema for the details form
    consents.ts            # consent copy for the OTP sheet
    verify-schema.ts       # zod schema for the OTP + consents
    selfie-check.ts        # localCheck → uploadSelfie validation pipeline
    face-gate.ts           # lazy @vladmandic/face-api two-face detector
    utils.ts               # cn() class helper
public/                    # images (kebab-case): worlds/, stories/, models/ (face weights)
components.json          # shadcn config
AGENTS.md                # Next.js 16 agent rules
CLAUDE.md                # design-engineering guidelines + design system
```

## Assets (`public/`)

All image assets use **kebab-case** names:

| File | What it is |
|---|---|
| `hero-logo.png` | Hero brand logo (red + black), 536×197 |
| `hero-bg.png` | Landing background — parent & child on the Destini, dragon soaring behind |
| `destini-wordmark.png` | "Destini" wordmark (includes the "Available in 110cc & 125cc" caption) |
| `whatsapp.png` | WhatsApp glyph (20×20) for the "code sent on WhatsApp" helper on `/details` |
| `dos-donts.png` | 2×2 do/don't selfie examples for the capture instruction screen (PNG8-compressed ~180 KB) |
| `worlds/*.png` | World carousel scenes — `mountain-peaks`, `jungle-valley`, `coastal-kingdom` |
| `stories/*.png` | Story thumbnails — `the-lost-kitten`, `the-tired-dragon`, `great-mountain-chase`, `big-mountain-rescue` |
| `models/*` | `@vladmandic/face-api` tiny weights for the selfie face-detection gate |

Screen data (titles, descriptions, image paths) lives in `src/lib/worlds.ts`, `stories.ts`, and
`languages.ts`.

## Design

The look is a dark, cinematic, glassmorphic system: full-bleed fantasy backgrounds, frosted glass
panels/cards, condensed uppercase headings, and Hero red as the accent. Design tokens are defined in
`src/app/globals.css`; the full system and conventions are documented in [CLAUDE.md](./CLAUDE.md).

## Screen flow & routes

| # | Screen | Route | Status |
|---|--------|-------|--------|
| 1 | Landing / CTA | `/` | ✅ Built |
| 2 | World selection (swipe carousel) | `/world-selection` | ✅ Built |
| 3 | Pick your story (2×2 grid) | `/pick-story` | ✅ Built |
| 4 | Language selection | `/language` | ✅ Built |
| 5 | Details + selfie ("Every Adventure Needs Heroes") | `/details` | ✅ Built |
| 6 | OTP verification + consent (bottom-sheet **modal** on `/details`) | — | ✅ Built |
| 7 | Thank-you / end screen | `/thank-you` | ✅ Built |

The flow is fully built end-to-end. Two steps on `/details` are **overlays, not separate routes**: the
**selfie capture flow** (instructions → live camera → wrong/correct) and the **OTP + consent** bottom-sheet.
Tapping the selfie offers *Take a selfie* (guided camera + quality checks) or *Upload a photo*; both run the
same validation before committing. The `/generating` loader was folded away (straight to `/thank-you`).

---

## Campaign spec (product requirements)

Design language (apply on every screen):
- Full-screen cinematic fantasy backgrounds (mountains, dragons, forests) with soft blur.
- **Glassmorphism** for panels/cards/inputs.
- **Pill buttons**: `rounded-full`, bold, often UPPERCASE.
- **Glass cards**: large radius.
- **Headings**: bold, condensed, uppercase.
- **Accent color**: Hero red for the selected state and primary CTA.
- Everything responsive and touch-friendly (mobile viewport first).

### Screens

**1. Landing / CTA** — full-screen adventure background, welcome message, glass pill CTA "Start Your Adventure".

**2. World selection** — swipeable carousel of glass cards with neighbouring cards peeking left/right.
Each card: image, title, description, and a circular next-arrow button. The active world's scene is the
blurred full-screen background. Worlds: Mountain Peaks, Jungle Valley, Coastal Kingdom. **The world you
choose then follows you through the flow — it becomes the blurred background of the next three screens**
(pick-story, language, details).

**3. Pick your story** — 2-column grid of glass cards, each a circular thumbnail + uppercase title, over
your chosen world's blurred scene. Stories: The Lost Kitten, The Tired Dragon, Great Mountain Chase, Big
Mountain Rescue.

**4. Language selection** — a full-height list of glass card rows (over the chosen world's scene) that fill
the screen (no separate button): **tapping a language takes you straight to the details screen**. The row
you point at / press lights up in a Hero-red gradient. Options: Hindi, English, Tamil, Telugu, Kannada,
Malayalam, Bengali.

**5. Details + selfie — "Every Adventure Needs Heroes"** — over your chosen world's blurred scene, a
full-width dashed "Upload or click selfie" dropzone above required inputs (parent name,
child's name, phone), helper text "verification code sent on WhatsApp", submit "Send OTP". Tapping the
selfie opens a choice: **Take a selfie** or **Upload a photo**. Both start with the same instruction
screen (do/don't examples + tips + a button to open the camera or picker — no timer), then the camera opens a
live oval viewfinder whose border turns **red until it sees you both well-framed, then green**; upload just
opens the file picker. Both run a two-step check before the photo is accepted: a client-side face gate
(needs a grown-up **and** a child, in good light) then a server check, ending on a wrong/correct result.
The live preview is mirrored so framing feels natural, and the saved photo is mirrored to match. The three
text fields use **native browser validation** (required fields + a 10-digit phone pattern — no form
library, no custom error text); the "Send OTP" pill stays glass and fills Hero red once a selfie is added,
and pressing it lets the browser validate the fields before opening the OTP sheet in place.

> The selfie face check uses `@vladmandic/face-api` in the browser (weights in `public/models/`). The
> server-side check is currently a stub — wire it to the real endpoint in `src/lib/selfie-check.ts`
> (`uploadSelfie`) when it's available.

**6. OTP verification + consent** — a light bottom-sheet modal that rises over the blurred `/details`
screen. 6-digit OTP (auto-advance / backspace / paste / arrows), eligibility declaration (18+ / lawful
guardian), and four consent checkboxes (two required, two optional). "Submit & Generate" is **disabled**
until the OTP is complete AND both required consents are checked, then routes to `/thank-you`.

**7. Thank-you / end screen** (`/thank-you`) — the full-bleed campaign hero (`hero-bg.png`), "Back to
Home", Hero logo, the "Hero Ka Scooter / Scooter Ka Hero" tagline plate, confirmation copy ("Your Hero
Destini adventure is being created… arrives on WhatsApp soon"), and the Destini wordmark.

### Validation rules
- Details form (**native HTML**): parent name & child's name `required` (min 2 chars); phone `required` +
  `pattern="[0-9]{10}"` (exactly 10 digits). Browser-native messages, no JS form library.
- OTP (**zod**): exactly 6 digits.
- Required consents: `z.literal(true)`; optional consents: `z.boolean().optional()`.
- Final submit gated on valid OTP + both required consents.

### Consent copy (keep meaning verbatim)
- **Eligibility**: "I confirm I am 18+ and the parent or lawful guardian of the child/ward whose name and
  photo I'm providing, with full authority to consent on their behalf."
- **Required 1**: consent to use details, selfie, and child's photo + first name only to make/deliver the
  personalised film; photos aren't used to train any AI and are erased after delivery.
- **Required 2**: consent to HERO MOTOCORP LIMITED using the WhatsApp number to verify via OTP and deliver
  campaign-essential messages.
- **Optional 3**: marketing communications + data for research/analytics; child's data not used for
  marketing/profiling/targeted ads; withdrawable anytime.
- **Optional 4**: company may use the adult's own likeness (not the child's) in ads/publicity/social media;
  withdrawable anytime.
# hero-campaign-2026
# hero-campaign-2026
