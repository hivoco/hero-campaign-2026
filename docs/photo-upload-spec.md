# Photo / Image Capture & Upload — Technical Spec

> **Audience:** another engineer or AI agent who needs to fully understand how this
> project collects a user's photo and uploads it, on both mobile and desktop, without
> reading the whole codebase first.
>
> **Project:** `closeup` — a Next.js 16 (App Router, React 19) marketing campaign
> frontend ("Closeup Love Tunes") that generates a personalized AI Valentine's music
> video from a selfie.
>
> **Scope of this doc:** the file/image acquisition + upload pipeline only. Everything
> lives in **one client component**: [`app/input/page.tsx`](../app/input/page.tsx)
> (~1283 lines). The landing page `app/page.tsx` only routes into it.

---

## 0. TL;DR — the one thing you must understand

**There is NO file upload.** Despite the UI saying *"Upload your photo"*, the app
**never opens an OS file picker**. There is no `<input type="file">`, no `accept=`,
and no `capture=` attribute **anywhere** in the repository.

The **only** way a user can supply an image is to **take a live selfie** with the
front camera via `navigator.mediaDevices.getUserMedia`. That live frame is:

1. drawn to an in-memory `<canvas>` (horizontally mirrored),
2. exported as a JPEG data-URL,
3. converted to a `File` object in JS (`dataURLtoFile`),
4. attached to a `multipart/form-data` request and POSTed directly to a remote API.

So when the requirement says "file/image upload," the actual implementation is a
**camera-capture → canvas → in-memory `File` → multipart POST** pipeline.

**Mobile vs desktop:** the capture logic is **100% identical** on both. There is **no
device detection** in the upload flow (no `userAgent`, `matchMedia`, `maxTouchPoints`,
etc.). The camera is hardcoded to the **front camera** (`facingMode: 'user'`) for every
device. The *only* mobile/desktop difference is **cosmetic CSS**: the camera viewfinder
is an **oval** on narrow viewports and a **rounded square** on wide ones, via a Tailwind
`md:` breakpoint (~768px viewport width — not a device check).

> ⚠️ **Consequence:** a desktop with **no webcam** (or a user who denies camera
> permission) is **completely blocked** — there is no fallback file-upload path. They
> only get a JavaScript `alert()` and cannot submit.

---

## 1. Architecture at a glance

```
┌────────────────────┐        router.push(`/input?${utm}`)      ┌──────────────────────────┐
│  app/page.tsx      │ ───────────────────────────────────────▶ │  app/input/page.tsx       │
│  Landing ("Start") │                                          │  (the entire flow)        │
└────────────────────┘                                          └────────────┬─────────────┘
                                                                              │  direct browser fetch()
                                                                              │  (NO Next.js API route,
                                                                              │   NO server action, NO proxy)
                                                                              ▼
                                                        https://api.closeuplovetunes.in/api/v1/*
                                                        ├─ GET  /settings/photo-validation-status
                                                        ├─ POST /photo-validation/check_photo   (multipart: photo)
                                                        ├─ POST /video/submit                   (multipart: photo + metadata)
                                                        ├─ POST /auth/verify-otp                (JSON)
                                                        └─ POST /auth/resend-otp                (JSON)
```

Key architectural facts:

- **Client-only.** `app/input/page.tsx` starts with `'use client'`. All network calls
  are **direct browser → remote host** `fetch()`s. There is **no** Next.js route handler
  (`app/api/**/route.ts` does not exist), **no** server action, and **no** proxy. The
  browser talks to `api.closeuplovetunes.in` cross-origin.
- **Hardcoded base URL** ([`app/input/page.tsx:11`](../app/input/page.tsx#L11)):
  ```ts
  const API_BASE_URL = 'https://api.closeuplovetunes.in/api/v1'
  // const API_BASE_URL = 'http://localhost:8000/api/v1'   // local dev, commented out
  ```
- **Face-detection model weights** are served statically from `public/models/`
  (`tiny_face_detector_*` and `face_landmark_68_model-*`) and loaded at runtime from the
  `/models` URL. If these files are missing, the capture button never enables.
- **The backend API is NOT in this repo.** Response schemas below are inferred from how
  the client consumes them.

---

## 2. The end-to-end user flow (state machine)

The whole experience is one component driven by boolean state flags. There are **no
separate routes** for the sub-steps — it's all conditional rendering inside
`app/input/page.tsx`.

```
Landing (app/page.tsx)
   │  click "Start" → router.push(/input?<utm params preserved>)
   ▼
┌── /input : STEP 1 — Vibe form ──────────────────────────────┐
│  4 dropdowns: loveAbout, relationship, vibe, voice          │
│  gate: allFieldsFilled  →  click "Next →"  → showMobileInput │
└─────────────────────────────────────────────────────────────┘
   ▼
┌── STEP 2 — Photo + phone ───────────────────────────────────┐
│  "Upload your photo" box  →  openPreCamera()                │
│  WhatsApp number input (tel, 10 digits)                     │
│  terms checkbox (required) + marketing checkbox (optional)  │
│  gate: canGetVerificationCode = photo && 10-digit && terms  │
└─────────────────────────────────────────────────────────────┘
   │  click the upload box
   ▼
┌── PRE-CAMERA modal (showPreCamera) ─────────────────────────┐
│  2×2 example grid (1 good ✓ / 3 bad ✗) + instructions       │
│  4-second progress bar auto-advances → openCamera()         │
└─────────────────────────────────────────────────────────────┘
   ▼
┌── CAMERA modal (showCamera) ────────────────────────────────┐
│  getUserMedia front camera → live mirrored <video>          │
│  face-api.js runs every 200ms → sets faceDetected           │
│  Capture button disabled until faceDetected === true        │
│  click Capture → draw canvas → previewPhoto set             │
└─────────────────────────────────────────────────────────────┘
   ▼
┌── PREVIEW sub-state (previewPhoto set) ─────────────────────┐
│  "Retake"  → clears preview, camera resumes                 │
│  "Confirm" → handleConfirmPhoto():                          │
│     if photoValidationRequired: POST /check_photo           │
│        valid  → commit capturedPhoto, close camera          │
│        invalid→ toast error, drop preview, retake           │
│     else: commit immediately                                │
└─────────────────────────────────────────────────────────────┘
   │  back on STEP 2, now with photo committed
   │  click "Send Verification Code →" → handleGetVerificationCode()
   ▼
┌── SUBMIT — POST /video/submit (multipart) ──────────────────┐
│  status 'otp_sent'     → showOtpScreen                      │
│  status 'video_created'→ router.push('/thank-you')          │
│  status 'pending'      → info toast (video already queued)  │
│  403                   → "max limit of 2 videos"            │
└─────────────────────────────────────────────────────────────┘
   ▼
┌── STEP 3 — OTP (showOtpScreen) ─────────────────────────────┐
│  6-digit code, 5-min (300s) countdown, resend button        │
│  "Submit →" → POST /auth/verify-otp                         │
│  status 'verified' → router.push('/thank-you')             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem detail (with code)

### 3.1 Entry / gating into the camera

Clicking the dashed **"Upload your photo"** box does **not** open a file dialog — it
starts the camera flow via a pre-camera instruction screen
([`app/input/page.tsx:800-817`](../app/input/page.tsx#L800)):

```tsx
<div
  onClick={() => { console.log("Upload box clicked"); openPreCamera(); }}
  className="w-[279px] h-[100px] ... border border-dashed border-white ..."
>
  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
    <Image src="/camera.png" alt="Camera" width={32} height={32} />
  </div>
  <span className="text-white text-sm">Upload your photo</span>
</div>
```

`openPreCamera` ([`:328`](../app/input/page.tsx#L328)) shows an instructions modal and
animates a progress bar for **4 seconds** (`requestAnimationFrame`), then calls
`openCamera()`:

```ts
const openPreCamera = () => {
  setShowPreCamera(true)
  setPreCameraProgress(0)
  const startTime = Date.now()
  const duration = 4000                       // note: comment says "2 seconds" but it's 4000ms
  const animateProgress = () => {
    const elapsed = Date.now() - startTime
    setPreCameraProgress(Math.min((elapsed / duration) * 100, 100))
    if (elapsed < duration) requestAnimationFrame(animateProgress)
    else { setShowPreCamera(false); openCamera() }
  }
  requestAnimationFrame(animateProgress)
}
```

### 3.2 Camera acquisition — `getUserMedia`

[`app/input/page.tsx:355-390`](../app/input/page.tsx#L355):

```ts
const openCamera = async () => {
  // 1) Feature/secure-context guard (getUserMedia requires HTTPS or localhost)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera not supported. Please use HTTPS or localhost.')
    return
  }
  try {
    // 2) Front camera, fixed 640x480, no audio — SAME for mobile & desktop
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false,
    })
    streamRef.current = stream        // stored in a ref, not state
    setShowCamera(true)               // opening the modal triggers an effect that binds the stream
  } catch (err) {
    const error = err as DOMException
    let message = 'Unable to access camera.'
    if (error.name === 'NotAllowedError')  message = 'Camera permission denied. Check browser settings.'
    else if (error.name === 'NotFoundError')    message = 'No camera found on this device.'
    else if (error.name === 'NotReadableError') message = 'Camera in use by another app.'
    else if (error.name === 'SecurityError')    message = 'Camera requires HTTPS or localhost.'
    alert(message)                    // ⚠️ only feedback; no fallback path
  }
}
```

The stream is bound to the `<video>` element in an effect once the modal is shown
([`:479-502`](../app/input/page.tsx#L479)). The live preview is CSS-mirrored with
`-scale-x-100` so it feels like a mirror:

```tsx
<video ref={videoRef} autoPlay playsInline muted
       className="w-full h-full object-cover -scale-x-100" />
```

`playsInline` matters on iOS Safari — without it, video would go fullscreen.

### 3.3 Face-detection gate — `face-api.js`

The Capture button stays **disabled** until a well-framed, full face is detected. Two
lightweight models are loaded from `public/models/` on first camera open
([`:393-405`](../app/input/page.tsx#L393)):

```ts
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
])
```

Detection runs on a `setInterval` **every 200ms** ([`:408-462`](../app/input/page.tsx#L408)).
A face counts as "good" only if it is centered, appropriately sized, AND all key
landmarks (both eyes, nose, mouth) are inside the frame:

```ts
const isCenteredX = faceCenterX > videoWidth * 0.25 && faceCenterX < videoWidth * 0.75
const isCenteredY = faceCenterY > videoHeight * 0.15 && faceCenterY < videoHeight * 0.85
const isGoodSize  = faceWidthRatio > 0.2 && faceWidthRatio < 0.8
const isFullFaceVisible = hasLeftEye && hasRightEye && hasNose && hasMouth
setFaceDetected(isCenteredX && isCenteredY && isGoodSize && isFullFaceVisible)
```

The button reflects this ([`:1253-1256`](../app/input/page.tsx#L1253)):

```tsx
<button id="btn-capture-photo" onClick={capturePhoto} disabled={!faceDetected} ... />
```

> This is **client-side UX gating only** (helps the user frame the shot). The
> authoritative image check is the server-side `/photo-validation/check_photo` call in
> §3.5.

### 3.4 Capture → canvas → `File` conversion

Capture draws the current video frame onto an off-screen canvas, **re-applying the
horizontal mirror** so the saved JPEG matches what the user saw
([`:565-590`](../app/input/page.tsx#L565)):

```ts
const capturePhoto = () => {
  if (!videoRef.current) return
  const canvas = document.createElement('canvas')
  canvas.width  = videoRef.current.videoWidth
  canvas.height = videoRef.current.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.translate(canvas.width, 0)          // mirror to match the mirrored live preview
  ctx.scale(-1, 1)
  ctx.drawImage(videoRef.current, 0, 0)
  const photoData = canvas.toDataURL('image/jpeg')          // JPEG, default quality (~0.92)
  const file = dataURLtoFile(photoData, 'captured-photo.jpg')
  setPreviewPhoto(photoData)              // dataURL for <img> preview
  setPreviewPhotoFile(file)               // File for upload
}
```

The data-URL → `File` conversion is hand-rolled with `atob`
([`:505-515`](../app/input/page.tsx#L505)) — this is the moment an in-memory image
becomes a bona-fide `File` object (the same type a file picker would have produced):

```ts
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr  = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], filename, { type: mime })
}
```

### 3.5 Preview → validate → commit

After capture the modal shows a **Retake / Confirm** preview
([`:1154-1204`](../app/input/page.tsx#L1154)). `handleConfirmPhoto`
([`:598-635`](../app/input/page.tsx#L598)) decides whether to run server validation:

```ts
const handleConfirmPhoto = async () => {
  if (!previewPhoto || !previewPhotoFile) return

  // Admin kill-switch: skip server validation entirely
  if (!photoValidationRequired) {
    setCapturedPhoto(previewPhoto); setCapturedPhotoFile(previewPhotoFile)
    setPreviewPhoto(null); setPreviewPhotoFile(null)
    closeCamera(); toast.success('Photo captured successfully!'); return
  }

  setIsVerifyingPhoto(true)
  try {
    const result = await verifyPhoto(previewPhotoFile)   // POST /photo-validation/check_photo
    if (result.valid) {
      setCapturedPhoto(previewPhoto); setCapturedPhotoFile(previewPhotoFile)
      setPreviewPhoto(null); setPreviewPhotoFile(null)
      closeCamera(); toast.success('Photo verified successfully!')
    } else {
      setPreviewPhoto(null); setPreviewPhotoFile(null)     // force retake
      toast.error(`${result.message}${result.reason ? ` - ${result.reason}` : ''}`)
    }
  } catch {
    setPreviewPhoto(null); setPreviewPhotoFile(null)
    toast.error('Photo verification failed. Please try again.')
  } finally { setIsVerifyingPhoto(false) }
}
```

`verifyPhoto` ([`:518-563`](../app/input/page.tsx#L518)) uploads just the photo as
multipart and stashes a `validation_token` on success (later forwarded to `/video/submit`
as proof the photo passed):

```ts
const verifyPhoto = async (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  const response = await fetch(`${API_BASE_URL}/photo-validation/check_photo`,
    { method: 'POST', body: formData })

  if (response.status === 503) {              // backend (Groq) overloaded → auto-disable & accept
    setPhotoValidationRequired(false)
    return { valid: true, message: 'Photo accepted (validation temporarily unavailable)' }
  }
  const data = await response.json()
  if (response.ok && data.valid) {
    if (data.validation_token) setValidationToken(data.validation_token)
    return { valid: true, message: data.message || 'Photo validated successfully' }
  }
  return { valid: false, message: data.message || 'Photo validation failed',
           reason: data.reason || 'Please retake the photo' }
}
```

**Admin toggle:** on mount, a `GET /settings/photo-validation-status` decides whether
validation is enforced; on failure it **defaults to required** ([`:63-77`](../app/input/page.tsx#L63)):

```ts
const res = await fetch(`${API_BASE_URL}/settings/photo-validation-status`)
if (res.ok) { const data = await res.json(); setPhotoValidationRequired(data.enabled) }
// catch → setPhotoValidationRequired(true)
```

### 3.6 Final submission — `POST /video/submit` (the real "upload")

The committed photo `File` is sent as multipart alongside all campaign metadata
([`:150-217`](../app/input/page.tsx#L150)):

```ts
const formData = new FormData()
formData.append('mobile_number', mobileNumber)
formData.append('gender', voice === 'Male voice' ? 'male' : 'female')
formData.append('attribute_love', loveAbout)
formData.append('relationship_status', relationship)
formData.append('vibe', vibe === 'Rock' ? 'rock' : vibe === 'Rap' ? 'rap' : 'romantic')
formData.append('photo', capturedPhotoFile)                    // ← the image
formData.append('terms_accepted', agreedToTerms ? '1' : '0')
formData.append('marketing_opt_in', marketingOptIn ? '1' : '0')
formData.append('validation_token', validationToken || '')     // from check_photo (empty allowed)
formData.append('utm_source', utmSource)
formData.append('utm_medium', utmMedium)
formData.append('utm_campaign', utmCampaign)

const response = await fetch(`${API_BASE_URL}/video/submit`, { method: 'POST', body: formData })
const data = await response.json()

if (!response.ok) {
  if (response.status === 403) toast.error('You have reached the maximum limit of 2 videos')
  else toast.error(data.detail || 'Failed to submit. Please try again.')
  return
}
if (data.job_id) setJobId(data.job_id)
if      (data.status === 'otp_sent')      { toast.success('OTP sent...'); setShowOtpScreen(true) }
else if (data.status === 'video_created') { toast.success('Your video is being processed!'); router.push('/thank-you') }
else if (data.status === 'pending')       { toast.info(data.message || 'Your previous video is still being processed.') }
```

> **Do not set `Content-Type` manually for multipart.** The code correctly passes only
> `{ method, body: formData }` and lets the browser set
> `multipart/form-data; boundary=…`. No `credentials`, no `Authorization` header, no
> cookies — the request is anonymous cross-origin.

### 3.7 OTP verify / resend (JSON, not multipart)

Once `video/submit` returns `otp_sent`, the OTP screen collects a 6-digit code and
POSTs **JSON** ([`:220-303`](../app/input/page.tsx#L220)):

```ts
// verify
await fetch(`${API_BASE_URL}/auth/verify-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile_number: mobileNumber, otp: otpCode }),
})   // status 'verified' → router.push('/thank-you')

// resend (gated by a 300s countdown)
await fetch(`${API_BASE_URL}/auth/resend-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile_number: mobileNumber }),
})
```

---

## 4. Mobile vs Desktop — the definitive answer

| Aspect | Mobile | Desktop | Where |
| --- | --- | --- | --- |
| Image source | Front-camera selfie via `getUserMedia` | **Identical** | `:366` |
| Device detection in upload flow | **None** | **None** | (no `userAgent`/`matchMedia`/`maxTouchPoints` anywhere in `app/`) |
| `facingMode` | `'user'` (front) hardcoded | **Identical** | `:367` |
| Resolution request | `640×480` | **Identical** | `:367` |
| Viewfinder **shape** | Oval (`rounded-full`, `w-64 h-80`) | Rounded square (`md:size-80 md:rounded-[11px]`) | `:1161`, `:1227` |
| Other differences | Cosmetic size/text tweaks via `md:`/`sm:` | same | `:705`, `:720`, `:1051`, `:1090` |
| No-camera behavior | `alert()` only | `alert()` only — **hard block** | `:359-388` |

The mobile/desktop split is **purely a Tailwind `md:` breakpoint** (viewport width
~768px), not a device class. See the intent comment at
[`:1224`](../app/input/page.tsx#L1224): `{/* Camera viewfinder ... oval on mobile, square on desktop */}`.

> **Note:** `app/page.tsx` and `app/thank-you/page.tsx` *do* read `window.innerWidth`
> to pick a mobile/tablet/desktop **Lottie animation** — but that is unrelated to the
> camera/upload UI and `app/input/page.tsx` imports none of it. The only viewport read
> in the input page is `window.innerHeight` (for logo sizing: `isShortScreen<700`,
> `isMiniScreen<630` — [`:80-90`](../app/input/page.tsx#L80)).

---

## 5. Complete API contract (as consumed by the client)

Base: `https://api.closeuplovetunes.in/api/v1`

| Method & path | Body | Purpose | Client handling of response |
| --- | --- | --- | --- |
| `GET /settings/photo-validation-status` | — | Admin toggle for photo validation | `data.enabled` → `photoValidationRequired`; on error defaults to `true` |
| `POST /photo-validation/check_photo` | multipart: `photo` | Server-side photo check | `data.valid`, `data.validation_token`, `data.message`, `data.reason`; **HTTP 503 → auto-disable validation & accept** |
| `POST /video/submit` | multipart: `photo` + 11 metadata fields (see §3.6) | Create video job, trigger OTP | `data.status` ∈ `otp_sent` \| `video_created` \| `pending`; `data.job_id`; **403 → "max 2 videos"** |
| `POST /auth/verify-otp` | JSON: `{ mobile_number, otp }` | Verify OTP | `data.status === 'verified'` → `/thank-you`; `data.job_id` |
| `POST /auth/resend-otp` | JSON: `{ mobile_number }` | Resend OTP | `data.expires_in_minutes` sets the countdown; error may include `"still valid"` |

**Transport summary:** all calls are **direct, unproxied, cross-origin** browser
`fetch()`s. Image uploads use `FormData` (browser-set `Content-Type` boundary). No
cookies, no auth header, no retries, **no client-side size/MIME limits** (only presence
checks). Any size/type enforcement is server-side (not visible in this repo).

---

## 6. State reference (key flags in `app/input/page.tsx`)

| State | Meaning |
| --- | --- |
| `showMobileInput` | Step 1 (dropdowns) done → show photo + phone step |
| `showPreCamera` / `preCameraProgress` | Pre-camera instructions modal + its 4s progress bar |
| `showCamera` | Camera modal open |
| `previewPhoto` / `previewPhotoFile` | Captured-but-not-yet-confirmed image (dataURL + File) |
| `capturedPhoto` / `capturedPhotoFile` | **Committed** image ready to submit (dataURL + File) |
| `modelsLoaded` / `faceDetected` | face-api.js status; `faceDetected` gates the Capture button |
| `photoValidationRequired` | Admin toggle; when false, `/check_photo` is skipped |
| `validationToken` | Returned by `/check_photo`, forwarded to `/video/submit` |
| `showOtpScreen` / `otpCode` / `otpTimer` | OTP step; timer starts at 300s |
| `isSubmitting` / `isVerifyingOtp` / `isResendingOtp` / `isVerifyingPhoto` | Per-action loading flags |
| `utmSource` / `utmMedium` / `utmCampaign` | Read from URL query on mount, forwarded to `/video/submit` |

Refs: `videoRef` (`<video>`), `streamRef` (`MediaStream`), `detectionIntervalRef`
(face-detection interval — cleared on capture and on `closeCamera`).

---

## 7. Gotchas, edge cases & limitations

1. **No file-upload fallback.** A webcam-less desktop or a permission denial is a dead
   end — only an `alert()`, and `capturedPhoto` (required by
   `canGetVerificationCode`, [`:127`](../app/input/page.tsx#L127)) can never be set.
2. **Secure-context requirement.** `getUserMedia` needs HTTPS or `localhost`. Over plain
   HTTP the support guard fires and blocks capture.
3. **`public/models/` must ship.** If the face-api weight files are absent, `modelsLoaded`
   stays false and Capture is never enabled.
4. **Fixed 640×480, default JPEG quality.** `toDataURL('image/jpeg')` passes no quality
   arg (~0.92). Uploads are always this re-encoded webcam still, never an original file.
5. **Double mirroring.** The live `<video>` is mirrored via CSS **and** the capture canvas
   is mirrored via `ctx.scale(-1, 1)`, so the saved JPEG matches the on-screen preview.
6. **503 opens a validation bypass.** If `/check_photo` returns 503, the client sets
   `photoValidationRequired = false` and accepts the photo (and future photos) unvalidated.
7. **Comment/behavior mismatch.** `openPreCamera` uses `duration = 4000` (4s) though a
   comment says "2 seconds."
8. **`Date.now()` in render-adjacent code.** Used for the progress animation timing — fine
   at runtime, but note the app relies on wall-clock for the pre-camera bar.
9. **Cross-origin without credentials** — relies on the remote API's CORS allowing
   anonymous multipart POSTs from the deployed origin (not verifiable from this repo).

---

## 8. If you need to add a real file-upload path (extension guide)

The cleanest way to add "choose from gallery/disk" alongside the camera, without
disturbing the pipeline (everything downstream already consumes a `File`):

1. Add a hidden native input near the upload box in
   [`app/input/page.tsx`](../app/input/page.tsx#L800):
   ```tsx
   <input
     type="file"
     accept="image/*"
     capture="user"        // hints the front camera on mobile; harmless on desktop
     ref={fileInputRef}
     className="hidden"
     onChange={handleFileSelected}
   />
   ```
2. In `handleFileSelected`, read `e.target.files?.[0]` (already a `File`), generate a
   preview dataURL with `URL.createObjectURL(file)` or a `FileReader`, and reuse the
   existing `previewPhoto` / `previewPhotoFile` → `handleConfirmPhoto` flow. Everything
   after that (server validation, `/video/submit`) works unchanged because it only needs
   a `File`.
3. Offer it as a **fallback** when `getUserMedia` throws `NotFoundError`/`NotAllowedError`
   (see [`:378-388`](../app/input/page.tsx#L378)) so webcam-less desktops aren't blocked.

Because the submit path (`formData.append('photo', capturedPhotoFile)`) is source-agnostic,
adding a file picker is purely additive — no backend contract change required.

---

## 9. Source map (quick reference)

| What | File · lines |
| --- | --- |
| Everything (upload flow) | `app/input/page.tsx` |
| Base URL | `app/input/page.tsx:11` |
| Admin validation toggle | `app/input/page.tsx:63-77` |
| Submit + FormData contract | `app/input/page.tsx:150-217` |
| OTP verify / resend | `app/input/page.tsx:220-303` |
| Pre-camera modal logic | `app/input/page.tsx:328-352` |
| `getUserMedia` + errors | `app/input/page.tsx:355-390` |
| face-api models + detection | `app/input/page.tsx:393-462` |
| dataURL → File | `app/input/page.tsx:505-515` |
| Server photo validation | `app/input/page.tsx:518-563` |
| Capture (canvas draw) | `app/input/page.tsx:565-590` |
| Retake / Confirm | `app/input/page.tsx:592-635` |
| "Upload your photo" box (opens camera) | `app/input/page.tsx:800-817` |
| Viewfinder (oval vs square) | `app/input/page.tsx:1161, 1224-1250` |
| Landing → /input | `app/page.tsx:46-49, 241-244` |
| Face model weights (static) | `public/models/` |

---

*Verified against source on 2026-07-07 via a multi-agent read + adversarial cross-check;
zero corrections were required. The single load-bearing takeaway: this is a **camera-only
selfie capture pipeline**, not a file uploader, and it behaves identically on mobile and
desktop apart from CSS viewfinder shape.*
