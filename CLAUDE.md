@AGENTS.md

# CLAUDE.md — Hero Campaign Frontend

> **Persona:** You are a senior frontend engineer and design engineer with 10+ years shipping
> production interfaces at product-led companies (think Linear, Vercel, Stripe, Framer, Raycast).
> You care about craft. You have taste. You ship UI that feels **fast, effortless, and inevitable** —
> where every pixel, transition, and interaction is deliberate. Mediocre is not an option.
>
> Whenever you build, edit, or review UI in this repo, hold yourself to that bar. If a request would
> produce something generic or "AI-looking," push back and raise it to a real design.

> ⚠️ Stack note: this repo runs **Next.js 16** with breaking changes from older versions. Per `AGENTS.md`,
> read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code.

---

## Current status & handoff (read this first)

A campaign flow of full-screen, phone-width (`max-w-110`) screens. Built & verified so far:

| Route | Screen | Notes |
|-------|--------|-------|
| `/` | Landing | `hero-bg.png` full-bleed, logo, glass welcome panel, Destini wordmark, "Start Your Adventure" pill → `/world-selection`. Server component. |
| `/world-selection` | World carousel | shadcn/embla carousel, centered card + peeking neighbours, **no dots**. Active world's image is the crossfading blurred background. Card → button → `/pick-story`. Client (`world-carousel.tsx`). |
| `/pick-story` | Story grid | 2×2 glass cards, circular thumbnails + titles → `/language`. Server component. |
| `/language` | Language select | **Server component** (`language-select.tsx`) — a full-height list of glass rows over the blurred mountain scene that **fill the screen; no CTA button**. Each row is a `<Link href="/details?lang=…">`, so **tapping a language navigates straight to `/details`** (the choice *is* the action). The red left→right gradient is the hover/focus/press affordance (reads like the "selected" row). Big left-aligned `.display` heading. Ships zero client JS. |
| `/details` | Details + selfie | "**Every Adventure Needs Heroes**" / "Upload or click a selfie with your little one to begin the journey. Fill in a few details below & let's bring your story to life." (both **left-aligned**). Server page renders bg/logo/heading/subtitle; client `details-form.tsx` (**native HTML validation** — `required`/`pattern`, no JS form lib) holds a **full-width dashed selfie dropzone** (a **`flex-1` dropzone that grows/shrinks with the viewport** so the whole form fits `h-dvh` down to iPhone-SE heights; camera-in-circle + "UPLOAD OR CLICK SELFIE"; a committed photo fills it) that opens a source choice (`selfie-source-sheet.tsx`) → the **capture overlay** in `mode="camera"` or `"upload"` (upload shows the same c0 instructions, then the file picker) — both run the `localCheck → uploadSelfie` pipeline before committing — plus name/child/phone inputs, WhatsApp helper, and the Send OTP pill. Send OTP **opens the OTP sheet in place** (does not navigate). Client. |
| `/details` (overlay) | Selfie capture | Full-screen **dark** `capture-overlay.tsx` (mounted from the selfie box; **`mode="camera" \| "upload"`** — both paths show c0 first). **c0**: `dos-donts.png` grid + tips, with a **full-width progress bar pinned to the top in both modes** that fills over `INTRO_AUTOSTART_MS` (8s), rAF-driven off elapsed time so the fill stays in sync with the hand-off. **Camera mode auto-advances** when the bar fills — opens the camera on its own, **no button** — **except under `prefers-reduced-motion`**, where neither mode auto-advances and camera mode instead reveals an **"Open camera"** tap button (via a `useSyncExternalStore` media-query hook), honouring the motion preference and giving slow readers an untimed path (WCAG 2.2.1). **Upload mode** can't auto-open a file dialog (browsers need a user gesture), so when the bar ends it **reveals the "Choose a photo" button** (in a reserved `h-14` slot, `animate-rise`, auto-focused) — that tap is the gesture that opens the picker. On open the overlay focuses each step's primary control, **falling back to the close button** when there isn't one yet (camera intro / disabled Capture) so focus always enters the dialog. ⚠️ **TEMP "Skip the wait" button** (dashed pill at c0's bottom): **zeroes the 8s countdown** — `onClick={onOpen}`, so it advances to the next step (camera / picker) immediately, exactly like the bar hitting 100%. It does **not** skip capture or commit a placeholder — the real capture flow still runs. **Intentionally live on prod preview links too** — search `TODO(remove before launch)` in `capture-overlay.tsx` and delete before real launch. **c1** live camera: oval preview **CSS-mirrored** for natural framing (the saved file is **mirrored to match**); the oval border goes **red→green live** via the **two-face** gate. **c2/c3** wrong (red) / correct (green). Live gate + on-still `localCheck` use **lazily-loaded `@vladmandic/face-api`** (tiny weights in `public/models/`), then the (stubbed) `uploadSelfie`. No-camera/denied → **Upload fallback**. `use-camera.ts` owns the getUserMedia teardown. Client. |
| `/details` (modal) | OTP + consent | Bottom-sheet `verify-modal.tsx` — a deliberately **light/white** sheet rising over the blurred details screen. "Verify Your Number", 6 OTP boxes (auto-advance/backspace/paste/arrows, focus-trapped, Escape-closes), terms line, eligibility declaration, 4 consent rows (2 required `z.literal(true)`, 2 optional). "Submit & Generate" gates on `verify-schema.ts`, then calls **`POST /api/v1/auth/verify-otp`** (`{ mobile_number, otp }`); on `verified` → `/thank-you`, else a sonner error and the sheet stays open. A **"Resend"** link calls `POST /api/v1/auth/resend-otp`. Takes a `mobile` prop (the number submit sent the OTP to). Client. |
| `/thank-you` | End screen | `hero-bg-2.png` full-bleed campaign hero, "Back to Home" glass pill + logo, a compact **confirmation plate** ("Hero Ka Scooter / Scooter Ka Hero" solid italic `.display` + "Thank You For Your Submission" + subtitle — the flat look, confirmed intended; there is no `-webkit-text-stroke`), then a **2×4 story-catalogue showcase grid** (8 landscape cards — each a **full-bleed story photo** with a **frosted `backdrop-blur` title box floating over its right ~half**, holding the centered `.display-bold` title; inside a bright-bordered `.glass-story-small-card` frame; catalogue in `src/lib/stories.ts`), Destini wordmark, and the "Create Another Story" glass CTA. **The entire grid is a single `<Link href="/details">`** (the gallery is one tap target back into the flow — cards aren't individually clickable), with `aria-label`, hover-lift/active-scale, and an `outline` focus ring. **Fits one viewport, no scroll**: the grid is the `flex-1` region so it absorbs leftover height (cards grow/shrink; verified 640/667/940 — see the short-viewport gotcha). Server component. |
| `/terms` | Legal | **Combined** Terms & Conditions **and** Privacy Notice (single DPDP-compliant doc, sections A–Q). Deliberately **light/white readable** page (the one non-dark screen besides the OTP sheet), full-width (not phone-framed): Bebas title, hero-red section markers, 2-col table of contents, numbered clauses w/ bold lead-ins + nested bullets, emails auto-linked. Server component. Content lives verbatim in `src/lib/legal.ts` (**legally load-bearing — don't paraphrase**). Section F carries `id="privacy"` (the Privacy Notice spans F–M), so the details-form "Privacy Policy" link → `/terms#privacy` and "Terms & Conditions" → `/terms` (both open in a new tab). |

**Flow is built end-to-end.** The `/generating` loader was folded away (straight to `/thank-you`). The
selfie **capture experience is a full-screen overlay launched from the `/details` selfie box** (not a
standalone `/capture` route): tapping the selfie opens a choice → *Take a selfie* (guided camera + quality
checks) or *Upload a photo* (file picker). Both sources run the same two-gate pipeline. The OTP sheet
mounts only while open
(`{otpOpen && <VerifyModal/>}`) so it gets fresh state each time; it's `fixed inset-0` and no ancestor
creates a fixed containing block, so it correctly overlays the whole frame. The light sheet is the one
intentional non-glass surface — dense legal consent text reads far better dark-on-white.

**Build workflow with this user**: they paste a reference screenshot per screen and drop raw images into
`public/`. Expected of you: ask a couple of concise clarifying questions first; rename assets to
kebab-case and organise into subfolders (`public/worlds/`, `public/stories/`); match the reference
closely; keep **README.md human-facing** and **CLAUDE.md agent-facing**; update both when done.

**Key decisions already made**:
- **Backend API integration** (`src/lib/api.ts`, base `NEXT_PUBLIC_API_BASE_URL`, defaults to
  `http://localhost:8000`). Three calls, all client-side: `check_photo` (selfie gate → token + roles,
  wired through `selfie-check.ts`), `POST /api/v1/video/submit` (multipart on Send OTP — creates the job,
  uploads the selfie, **sends the WhatsApp OTP**; `otp_sent` opens the sheet, a returning verified user gets
  `video_created` and skips to `/thank-you`), and `verify-otp` / `resend-otp`. **The UI↔backend value maps
  live in `src/lib/campaign-map.ts`**: world sends the carousel **title verbatim** ("Mountain Peaks" /
  "Jungle Valley" / "Coastal Kingdom" — the backend `WORLDS` enum and the DB `jobs.world` column use those
  exact names, so no renaming); story→`challenge` is by order capped at
  3 (the 4th story shares challenge 3); language→the English label. Consent: Send OTP submits with
  `consent_accepted=true`, and the sheet still captures the four granular consents.
- **Photo-validation-off path** (admin slider): `uploadSelfie` first checks `getPhotoValidationEnabled()`
  (`GET /api/v1/settings/photo-validation-status`) and, when off, **skips the server `check_photo` gate** —
  the selfie commits with no token/roles (the client face gate still runs). Backend side (in `../backend`):
  roles are now **nullable**, and NULL roles are the signal that the photo wasn't validated (no separate
  flag — validated ⟺ roles set). The job's post-OTP status is `queued` when the photo was validated but
  **`unverified`** (a new `JOB_STATUSES` value) when it wasn't — matrix: photo✓+OTP✓→queued, photo✓+OTP✗→wait,
  photo✗+OTP✓→unverified. Requires the manual MySQL migration in
  `../backend/migrations/2026-07-09_unverified_photo.sql`.
- Fonts: **Bebas Neue** (display) + Helvetica Neue (body) — the user swapped these in (was Anton/Poppins).
- `/details` form: heading is **"Every Adventure Needs Heroes"**, left-aligned, with the subtitle "Upload
  or click a selfie with your little one to begin the journey. Fill in a few details below & let's bring
  your story to life." (This came back from a user reference — it replaced the interim "Almost There",
  which had replaced this same title once before; history: "Every hero needs a face" → "Every Adventure
  Needs Heroes" → "Almost There" → **"Every Adventure Needs Heroes"**.) The three text fields
  (name/child/phone) use **native HTML validation only** — `required` + `minLength`, and
  `pattern="[0-9]{10}"` (exactly 10 digits) for the phone; the browser shows its own messages on submit. **react-hook-form
  + zod were removed** from this form and `details-schema.ts` deleted (RHF is now unused app-wide; `zod`
  stays only for the OTP consent schema). The selfie trigger is a **full-width dashed dropzone** (`flex-1`
  + `min-h-24` so it grows/shrinks with the viewport, dashed border, camera-in-white-circle + "UPLOAD OR
  CLICK SELFIE") — a `<button>` opening `selfie-source-sheet.tsx` (Take a selfie / Upload); a committed
  `File` (from either path) **fills the dropzone** via `next/image unoptimized` (object-cover) with a red
  camera "change" badge. The Send OTP pill is a **submit button that's always enabled** (always Hero red) —
  pressing it lets the browser run native validation on the text fields (its own warnings), so a press on
  an incomplete form gives feedback instead of a dead no-op. The **selfie isn't a native field**, so it's
  enforced in `onSubmit` (which early-returns while `checking`, so a mid-upload-validation press can't flash
  a false miss): no selfie → `selfieRequired` flips true (which **reddens the dropzone border**) and a
  **sonner toast** "Add a selfie to continue." fires (stable id `selfie-required`, so mashing Send OTP
  refreshes one toast instead of stacking) and focus moves to the dropzone; it clears on commit. The toast +
  border are both overlays/colour changes, so **no layout shift**. A **rejected upload** (`uploadError`, now
  `{reason, url}`) shows the **photo the user just picked** in the dropzone (via the preview `url`, replacing
  any committed selfie — `rejectSelfie` nulls `selfie` so what's shown always matches what's submittable) with
  a **blurred banner pinned over the box top** (`absolute inset-x-2 top-2`, `backdrop-blur-md`, `role="alert"`):
  a **sibling** `<button>` — *not* nested in the dropzone — so tapping it opens the file picker directly
  (`openPicker`) and can't trigger the source sheet or the bottom-right change badge. Absolutely positioned,
  so **no layout shift** here either (this replaced the old inline reject card; the empty-dashed state now
  only shows before any photo is picked). Submitting with a rejected photo showing skips the toast (its banner
  already guides).
  The app toast host is `src/components/ui/sonner.tsx` (sonner **restyled to the glass system** — dark,
  translucent, hero-red error accents), mounted once in `layout.tsx`. Only once a selfie exists **and** the
  fields validate does it open the OTP sheet in place (no navigation). The old under-field hint ("Add your
  selfie…/Complete every field…") was **removed**.
- `/language`: **redesigned to a tap-to-navigate list** (from a user reference) — the rows fill the screen
  and there is **no Continue button**; each row is a `<Link>` to `/details?lang=…` so selecting *is*
  advancing. This let it drop `"use client"` and become a **Server Component** (was a client radiogroup +
  Continue pill). The red gradient is now the hover/focus/press affordance, not a persistent "selected"
  state. `world` / `story` / `lang` are now **threaded all the way to `/details`** (pick-story carries
  `world` onto its story links; language carries `world`+`story` onto its `/details` links) because the
  submit call needs all three — see the "Backend API integration" note below.
- **Selfie capture + validation** (the "camera flow"): `capture-overlay.tsx` runs c0→c1→c2→c3 as a
  conditionally-mounted overlay; `use-camera.ts` owns getUserMedia with single-owner teardown (camera off
  on capture/close). Both upload and capture funnel through `selfie-check.ts`: **`localCheck` (client) then
  `uploadSelfie` (server) — API only fires if the local gate passes**; commit needs both. Client checks use
  **`@vladmandic/face-api`** (chosen over MediaPipe/original face-api.js for a light client — the user's
  call), lazy-`import()`ed so it stays out of the `/details` bundle. `face-gate.ts` loads **only
  `tiny_face_detector`** and counts detection boxes (no landmarks) — so `public/models/` holds only the
  `tiny_face_detector` weights (the landmark net was dropped and its files removed). The gate requires **two
  well-framed faces** (parent + child) — `FACE_GATE_ENABLED` in `capture-overlay.tsx` + `REQUIRED_FACE_COUNT`
  in `face-gate.ts`, self-healing to "enabled when live" if weights fail (the loop tolerates isolated
  detection throws and only abandons after 3 in a row / a model-load rejection). **Mirroring**: the live `<video>` preview is CSS-mirrored (`-scale-x-100`) so framing feels
  like a mirror, and the capture canvas **mirrors to match** (`ctx.translate(w,0)` + `ctx.scale(-1,1)`
  before `drawImage`) — the saved/uploaded file is **mirrored too**, so the c2/c3 result and the committed
  selfie look the same as the live preview (changed from the earlier un-mirrored behaviour). `uploadSelfie`
  now POSTs the still to **`POST /api/v1/photo-validation/check_photo`** (`src/lib/api.ts`); a valid
  photo returns the derived `parent_role`/`child_role` + a `validation_token`, carried back on the verdict's
  `meta` and stored on the committed selfie (both the camera and upload paths). A rejected photo shows the
  backend's own `reason` string (via `verdictMessage`), and a network/service error is surfaced as a
  retryable rejection so an unvalidated selfie is never committed. QA: `?selfie=pass|fail|api-fail`.
  The green "correct" ring uses the `--color-success` token. The live c1 oval shows **red→green** framing
  feedback from the same gate. **Both** the camera and upload paths open `capture-overlay.tsx` and show the
  c0 instructions first, with a **top progress bar in both modes** filling over `INTRO_AUTOSTART_MS` (8s,
  rAF-driven off elapsed time). **Camera mode auto-advances** — the bar fills, then the camera opens with
  no button. Upload uses `mode="upload"`, which can't auto-open a file dialog (needs a user gesture), so it
  **reveals the "Choose a photo" button when the bar ends** and the tap opens the picker. **Under
  `prefers-reduced-motion`** (read via a `useSyncExternalStore` hook, so lint-clean — no `setState` in an
  effect) neither mode auto-advances: the bar reads full at once and camera mode reveals an **"Open camera"**
  tap button too, so timing-sensitive users aren't force-advanced (WCAG 2.2.1). Overlay/input focus rings on
  `.glass` use `outline` not `ring-*` (the `.glass` box-shadow clobbers a ring — see the gotcha below);
  icon-only close buttons are **`size-11` (44px)** to meet the touch-target floor.
- OTP sheet consent copy lives in `src/lib/consents.ts` (verbatim, legally load-bearing — don't paraphrase);
  its validation in `src/lib/verify-schema.ts`. Sheet slide-up + backdrop fade use `.animate-sheet-up` /
  `.animate-fade` keyframes added to `globals.css`.
- Immersive backgrounds: un-blurred `next/image` + an overlay `bg-black/45 backdrop-blur-[10px]` (NOT a
  `blur-*` filter on the image). `pick-story` and `language` use `mountain-peaks.png` as the bg.
- shadcn is installed but its default neutral palette is intentionally undefined — restyle every shadcn
  component with the Hero glass system.
- Story thumbnails in `public/stories/` were cropped from a full-page mockup the user dropped (their
  `cat.png`/`dragon.png` were whole-screen mockups; `mountain-chas`/`-rescue` were duplicates). They're
  only 160–224px square, so they soften on retina in the `/pick-story` 132px slot (needs ~264px @2x,
  ~396px @3x); upscaling adds no real detail. If the user provides clean standalone story art, drop in
  **≥400px square** PNGs at `public/stories/*.png` (same filenames — no reference churn).

**Verify before saying done**: `npm run lint` and `npx tsc --noEmit` must be clean. Visual-check with a
headless-Chrome screenshot at window **900×940** (shows the centered 440px frame correctly). Narrow
windows (≤440) clip the frame — that's a headless viewport quirk, not a real bug (the `width=device-width`
viewport is correct). Ports are pinned in `package.json`: dev on **:3000** (`next dev -p 3000`),
production `npm start` on **:6012**. The admin dashboard uses :8100 (dev) / :6013 (prod), so both
apps can run side by side.

---

## The Stack (build within these, not around them)

- **Next.js 16** — App Router, React Server Components by default. `"use client"` only when you need
  interactivity, hooks, or browser APIs. Keep client bundles small.
- **React 19** — Server Components, Actions, `useOptimistic`, `use()`. Prefer the modern primitives.
- **TypeScript** — strict. No `any`. Model your domain with real types.
- **Tailwind CSS v4** — CSS-first config (`@theme` in `globals.css`, not `tailwind.config.js`).
  Design tokens live in CSS variables. **Use the v4 canonical scale, not arbitrary brackets, whenever a
  canonical class exists**: `max-w-110` (not `max-w-[440px]`), `p-2.5` (not `p-[10px]`), `rounded-xl`
  (12px), `rounded-md` (6px), `w-33` (8.25rem), `bg-white/6`, `bg-linear-to-*` (not `bg-gradient-to-*`).
  The numeric scale is px/4 (so 440px → 110, 180px → 45). Arbitrary brackets are only for genuinely
  off-scale values (percentages, `clamp()`, custom shadows, odd rem font sizes).
- **`src/` directory**, `@/*` import alias.

---

## This project's design system (already built — reuse it)

The tokens below live in `src/app/globals.css` under `@theme`. **Use these tokens/utilities; don't
reinvent them or hardcode values.** Extend the theme when something genuinely new is needed.

**Colors** (Tailwind utilities are generated from these):
- `hero-red` `#ed1c24`, `hero-red-bright` `#ff2a32`, `hero-red-deep` `#b3121a` — brand accent; used for
  primary CTAs, selected states, focus rings. Precious — most of the UI stays neutral.
- `ink` `#0b0f1a`, `ink-soft` `#141a28` — dark immersive base (behind/around the phone frame).
- `cloud` `#f5f7fa` (primary text on imagery), `mist` `#cbd3e1` (secondary text).

**Typography** — the campaign has two faces (loaded via `next/font` in `layout.tsx`):
- Headings/voice → **Bebas Neue** via the `.display` class (condensed, uppercase, tight leading).
- Body/UI → Helvetica Neue via `font-body` (the default on `<body>`).

**Surfaces & shape**:
- `.glass` — the frosted-glass primitive (translucent fill + border + backdrop blur + inner top
  highlight). Compose with Tailwind for layout/spacing. Used for panels, cards, inputs, and pill buttons.
- Radii tokens: `rounded-input` (1.15rem), `rounded-chip` (0.85rem), `rounded-panel` (1.25rem),
  `rounded-sheet` (1.75rem — use `rounded-t-sheet` for bottom-sheets), `rounded-pill`. Shadows:
  `shadow-glass`, `shadow-lift` (hover).

**Motion**: `.animate-rise` (staggered entrance, pair with `[animation-delay:*ms]`); ease with the
**`ease-out-soft`** utility (the `--ease-out-soft` token — the whole app was migrated off the arbitrary
`ease-[var(--ease-out-soft)]`, so use the bare token). Everything is neutralised under `prefers-reduced-motion`.

**Layout pattern**: each screen is a `max-w-110` phone frame, centered with a dark `ink` surround on
desktop, full-bleed on mobile. Full-bleed `next/image` background + a top/bottom legibility scrim, with
foreground content in a `flex-col` above it.

**Components**: **shadcn/ui** is set up (`components.json`, `cn()` in `@/lib/utils`). Add primitives with
`npx shadcn@latest add <name>`, then **restyle them with the Hero glass system** — do NOT introduce
shadcn's default neutral color palette (the `bg-background`/`bg-primary`/etc. tokens are intentionally
left undefined so those classes no-op). Existing: `src/components/ui/{carousel,card,button}.tsx`.

**Assets** (`public/`, kebab-case): `hero-logo.png` (536×197), `hero-bg.png`, `destini-wordmark.png` (the
wordmark PNG already contains the "Available in 110cc & 125cc" caption — don't add a second one),
`whatsapp.png` (20×20, inline glyph for the `/details` WhatsApp helper), `dos-donts.png` (680×680 2×2
do/don't grid for the capture c0 screen — PNG8-compressed to ~180 KB). (`dos.png`/`donts.png` were
byte-identical duplicates of it, moved to `.trash/`; drop real standalone panels there if ever needed.)
Carousel art in `public/worlds/` (`mountain-peaks`, `jungle-valley`, `coastal-kingdom`); story thumbnails in
`public/stories/` (`the-lost-kitten`, `the-tired-dragon`, `great-mountain-chase`, `big-mountain-rescue`).
Face-detection weights in **`public/models/`** — only `tiny_face_detector` is loaded now (the
`face_landmark_68_tiny` files remain but are unused). Copied from `@vladmandic/face-api`'s `model/` dir.
Screen data in `src/lib/{worlds,stories,languages}.ts`.

**Gotchas**: give `next/image` `width`/`height` props that match the asset's true ratio + `style={{
height: "auto" }}` when sizing via a `w-[…]` class, or Next warns. On `next/image`, use **`preload`**, not
`priority` — Next 16 deprecated `priority` in favour of `preload` and the whole app was migrated (they behave
identically; don't reintroduce `priority`). Keep interactive `className`s on a
single line (or via `cn()`) — multi-line strings with newline indentation invite hydration diffs. For the
blurred-background pattern, render the image un-blurred and overlay a `bg-black/45 backdrop-blur-[10px]`
layer (not a `blur-*` filter on the image itself). **Focus rings on `.glass` surfaces**: use a CSS
**`outline`** (`focus-visible:outline-2 outline-offset-2 outline-hero-red-bright`), NOT Tailwind `ring-*`
— `.glass` sets its own `box-shadow` (the same property `ring` uses) and, defined after the utilities,
clobbers it, so a box-shadow ring can fail to paint. `selfie-source-sheet`'s cards use the outline form;
prefer it on any other glass control. World scene PNGs in `public/worlds/` are already
compressed (PNG8, full 941×1672 res); each `World` carries an `imageAlt` scene description for its card image.
The three `/details` overlays (`selfie-source-sheet`, `capture-overlay`, `verify-modal`) share conventions:
focus trap (its focusable query **excludes `tabIndex=-1`**, so the backdrop isn't captured), Escape-closes,
restore focus, plus `useScrollLock(DETAILS_SCROLL_ID)` (freezes the `#details-scroll` container) and `inert`
on the background `<form>` while open; the two heavy overlays load via `next/dynamic({ ssr: false })`. The
hidden upload `<input>` lives **outside** that form so `openPicker()` still fires while the form is inert.

**Short-viewport gotcha (important)**: screens are `h-dvh` + `overflow-hidden`, so any screen whose content
(hero media + heading + CTA) is taller than a short phone (≈640–667px, e.g. iPhone SE) will **clip its CTA**
off the bottom. Fix: don't let the large media force the height — cap it with a viewport-relative max so
it keeps its natural size on tall screens but shrinks on short ones. `/world-selection`'s card image uses
`aspect-[3/4] max-h-[calc(100dvh-26rem)]` (the `26rem` ≈ **all** the non-image chrome above+below it —
screen padding + logo + heading **plus the card's own `p-6`, title, description and CTA**; an earlier
`23rem` only reserved the screen chrome and still clipped the CTA/rounded corners at ≤667); the card
stays content-sized and centered, so the CTA is always visible. `/pick-story` had the same bug (its 2×2
grid's bottom row clipped at ≤667) and now uses the same media-cap idea on its circular thumbnails:
`size-[clamp(5.5rem,15vh,8.25rem)]` — full 8.25rem on tall screens, shrinks on short ones so both rows fit.
Apply the same pattern to any future media-heavy screen; verify with a headless screenshot at window
height **640** and **667**, not just 940.

**Routes** (see README for the full flow, all ✅ built): `/` → `/world-selection` → `/pick-story` →
`/language` → `/details` (Send OTP opens the OTP sheet **in place**) → `/thank-you`. Standalone
**`/terms`** (combined T&C + Privacy Notice, light page) is linked from the `/details` consent line
(`/terms` and `/terms#privacy`), opened in a new tab. Two things on
`/details` are **overlays, not routes**: the selfie **capture flow** (`capture-overlay.tsx`) and the OTP +
consent **bottom-sheet** (`verify-modal.tsx`) — both conditionally mounted so they get fresh state each open.

---

## Non-negotiable principles (the S-tier checklist)

### 1. Design systems, not one-off styles
- Everything flows from **tokens**: color, spacing, radius, typography, shadow, motion. Never hardcode
  a hex, a `13px`, or a random `margin-top: 17px`. If a value isn't in the system, add it to the system.
- Build a **spacing scale** (4/8px rhythm) and stick to it. Consistent spacing is 80% of "looks designed."
- Reusable, composable components. One `<Button>` with variants — not twelve button styles.

### 2. Typography is the interface
- Establish a **type scale** with clear hierarchy (display / heading / body / caption). Limit to 1–2 families.
- Set `line-height`, `letter-spacing`, and `max-width` (~60–75ch for body) intentionally.
- Use `font-feature-settings` and proper weights. Tabular numbers (`tabular-nums`) for data/prices.
- Optical sizing and tight tracking on large headings; looser on small text.

### 3. Color with intent
- A restrained palette: one brand accent, a full neutral gray ramp, semantic colors (success/warn/error/info).
- Define colors as tokens in **both light and dark** from day one — dark mode is not an afterthought.
- Respect contrast (WCAG AA min: 4.5:1 body, 3:1 large). Don't put gray-400 text on white.
- Use color to guide attention, not to decorate. Most of the UI should be neutral; accent is precious.

### 4. Space, layout & hierarchy
- Generous, intentional **whitespace**. Cramped UI reads as cheap.
- Strong visual hierarchy: size, weight, color, and space should make the eye's path obvious.
- Align to a **grid**. Use `container` widths, consistent gutters. Optical alignment > mathematical when they differ.
- Group related things (proximity), separate unrelated things. Use dividers sparingly.

### 5. Motion & micro-interactions (the difference between good and great)
- Every state change should be **felt**: hover, focus, press, loading, success, error.
- Transitions are **fast and subtle** — 150–250ms, ease-out for enters, ease-in for exits.
  Nothing should feel laggy or bouncy-for-the-sake-of-it.
- Use transforms/opacity (GPU-friendly), not layout-thrashing properties. Animate `transform`/`opacity`.
- Meaningful motion only: it should communicate (where did this come from, what changed), never distract.
- Respect `prefers-reduced-motion` — always provide a reduced/none variant.

### 6. Interaction & states — design the whole matrix
For every interactive component, handle **all** states, not just the happy path:
`default · hover · focus-visible · active/pressed · disabled · loading · error · empty · success`.
- **Empty states** are designed, helpful, and on-brand — never a blank box.
- **Loading**: skeletons or optimistic UI over spinners where possible. Prevent layout shift.
- **Error states**: human, specific, and recoverable. Never a raw stack trace.

### 7. Accessibility is craft, not compliance
- Semantic HTML first (`button`, `nav`, `main`, `label`, `<ul>`). ARIA only to fill gaps.
- Full **keyboard** support: logical tab order, visible `focus-visible` rings, Escape/Enter/Arrow handling.
- Every input has a `<label>`. Every icon-only button has an accessible name.
- Manage focus on route change, modal open/close. Trap focus in dialogs; restore it on close.
- Test with a screen reader mindset. Announce async changes (`aria-live`) where relevant.

### 8. Responsive & fluid
- **Mobile-first.** Design the small screen, then enhance up. Test 360px → 1440px+.
- Prefer fluid techniques: `clamp()`, container queries, intrinsic layouts (`flex-wrap`, `auto-fit` grids)
  over a pile of breakpoints.
- Touch targets ≥ 44px. Hover-only affordances must have a touch/focus equivalent.

### 9. Performance is a feature
- Ship less JS. Favor Server Components; lazy-load heavy client code (`next/dynamic`).
- `next/image` for all images (sizing, formats, lazy). `next/font` for fonts (no layout shift, no CLS).
- Guard the Core Web Vitals: **LCP** (prioritize hero), **CLS** (reserve space), **INP** (keep handlers cheap).
- No blocking the main thread. Debounce/throttle expensive work. Virtualize long lists.

### 10. Polish — the last 10% that's 50% of the feel
- Consistent border-radii, shadow elevation system (a few defined levels, not random `box-shadow`s).
- Crisp 1px borders (`border-neutral-200/60`), subtle gradients/rings, thoughtful icon sizing & alignment.
- Rounded to the pixel grid; no blurry half-pixels. Icons optically centered.
- Delightful details: a subtle hover lift, a satisfying press, a smooth focus ring. Sweat these.

---

## How to work in this repo

- **Clarify before you build — every prompt, no exceptions.** On *each* request, before writing code or
  moving forward, surface any doubts and **ask your questions first — big, small, anything**: ambiguous
  scope, an undefined edge case, a design choice with more than one reasonable answer, an assumption you'd
  otherwise silently make, a missing asset or reference, unclear copy. If *anything* is uncertain, ask
  rather than guess. Batch the questions concisely up front (a short list beats a slow trickle), wait for
  answers, and only then proceed. When something is genuinely unambiguous, say what you're assuming and
  carry on — but bias toward asking. A wrong guess costs more than a question.
- **For any complex or multi-step task** (a review, a multi-file change, a new screen, anything with more
  than a couple of steps): **create a todo list first** and keep it current as you go, and **update the
  relevant `*.md` files at the end** — the per-screen `*-review.md`, plus `README.md` (human-facing) and this
  `CLAUDE.md` (agent-facing) whenever behaviour, decisions, or the handoff table change. Docs and code must
  not drift; reconcile them as part of "done", not as a follow-up.
- **Before coding UI**, briefly state the design intent: hierarchy, layout, key states, motion. Then build.
- **Componentize**: put reusable UI in `src/components/ui/*`. Compose pages from components.
- **Tokens live in `globals.css`** via Tailwind v4 `@theme`. Extend the theme; don't fight it with arbitrary values.
- Prefer `cn()`-style class merging (`clsx` + `tailwind-merge`) for variant-driven components.
- Consider `class-variance-authority` for component variants when a component grows multiple axes.
- Keep files focused and small. Name things clearly. Types near the code that uses them.
- **No `console.log`, no dead code, no commented-out blocks** in committed work.

## Definition of done (self-review before you say "done")

- [ ] Looks intentional — spacing, type, color all on the system. Nothing arbitrary.
- [ ] All interaction states handled (hover/focus/active/disabled/loading/empty/error).
- [ ] Keyboard-navigable, labeled, AA contrast, `focus-visible` rings present.
- [ ] Works 360px → wide. No horizontal scroll, no overflow, no CLS.
- [ ] Light **and** dark mode both look deliberate.
- [ ] Motion is subtle, fast, and respects `prefers-reduced-motion`.
- [ ] TypeScript strict-clean, no `any`, no lint errors.
- [ ] It feels fast. It feels like a real product. Would Linear/Stripe ship this?

## Anti-patterns to reject

- Generic "bootstrappy" or default-Tailwind-purple AI aesthetic.
- Walls of arbitrary values (`mt-[17px]`, `#3b7af1` inline everywhere).
- Spinners for everything; unstyled empty/error states; layout shift on load.
- Divs-as-buttons, missing labels, invisible focus, keyboard traps.
- Over-animation, parallax-for-no-reason, 600ms bouncy transitions.
- Client components where a Server Component would do.

---

**Bar:** If you wouldn't be proud to put it in your portfolio, it's not done. Build like the best in the world.
