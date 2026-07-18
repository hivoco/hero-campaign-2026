/**
 * Backend API client for the Hero campaign flow.
 *
 * Three calls make up the journey:
 *   checkPhoto(file)              → POST /api/v1/photo-validation/check_photo
 *   submitVideo(payload)          → POST /api/v1/video/submit  (sends the OTP)
 *   verifyOtp / resendOtp(mobile) → POST /api/v1/auth/(verify|resend)-otp
 *
 * The base URL comes from NEXT_PUBLIC_API_BASE_URL (defaults to the local dev
 * backend). Errors surface the backend's `detail` string via ApiError so the UI
 * can toast something human.
 */
import { langToLanguage } from "@/lib/campaign-map";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

/** A backend error with the parsed `detail` message and HTTP status. */
export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** Pull FastAPI's `{ detail }` (string or validation array) into one line. */
async function toApiError(res: Response): Promise<ApiError> {
  const retryAfter = Number(res.headers.get("retry-after")) || undefined;
  let detail = `Request failed (${res.status}). Please try again.`;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail) && body.detail[0]?.msg) detail = body.detail[0].msg;
  } catch {
    // non-JSON error body — keep the generic message
  }
  return new ApiError(detail, res.status, retryAfter);
}

// ── Photo validation ──────────────────────────────────────────────────────
export type PhotoCheck = {
  valid: boolean;
  reason?: string;
  message?: string;
  validationToken?: string;
};

/**
 * Validate a combined parent+child selfie. On a valid photo the backend returns
 * a short-lived `validation_token` that /video/submit requires (it does NOT
 * derive roles — the user picks those). A rejected photo returns `valid: false`
 * with a human `reason`.
 */
export async function checkPhoto(file: File): Promise<PhotoCheck> {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch(`${API_BASE}/api/v1/photo-validation/check_photo`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  return {
    valid: !!data.valid,
    reason: data.reason ?? undefined,
    message: data.message ?? undefined,
    validationToken: data.validation_token ?? undefined,
  };
}

/** Whether the admin has photo validation enabled (slider on the config page). */
export async function getPhotoValidationEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/settings/photo-validation-status`, {
      cache: "no-store",
    });
    if (!res.ok) return true; // fail safe: assume on
    const data = await res.json();
    return data?.enabled !== false;
  } catch {
    return true;
  }
}

/** Has this number already accepted the campaign T&C? Used to pre-tick the
 *  consent box for a returning user. Fails closed (false = ask again). */
export async function getTcAccepted(mobileNumber: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/video/tc-status?mobile_number=${encodeURIComponent(mobileNumber)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data?.tc_accepted === true;
  } catch {
    return false;
  }
}

// ── Video submit (creates the job + sends the OTP) ──────────────────────────
export type SubmitInput = {
  mobileNumber: string;
  parentName: string;
  parentRole?: "father" | "mother";
  childRole?: "son" | "daughter";
  langCode: string;
  city?: string;
  consentAccepted: boolean;
  photo: File;
  validationToken?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
};

export type SubmitResult = {
  status: "otp_sent" | "pending" | "video_created" | "verified" | string;
  job_id?: number;
  message?: string;
};

export async function submitVideo(input: SubmitInput): Promise<SubmitResult> {
  const form = new FormData();
  form.append("mobile_number", input.mobileNumber);
  form.append("parent_name", input.parentName);
  if (input.parentRole) form.append("parent_role", input.parentRole);
  if (input.childRole) form.append("child_role", input.childRole);
  // Story is assigned at random by the backend — not sent from here.
  form.append("language", langToLanguage(input.langCode));
  form.append("city", input.city ?? "");
  form.append("consent_accepted", input.consentAccepted ? "true" : "false");
  form.append("utm_source", input.utm?.source ?? "");
  form.append("utm_medium", input.utm?.medium ?? "");
  form.append("utm_campaign", input.utm?.campaign ?? "");
  form.append("validation_token", input.validationToken ?? "");
  form.append("photo", input.photo);

  const res = await fetch(`${API_BASE}/api/v1/video/submit`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

// ── OTP ─────────────────────────────────────────────────────────────────────
export type VerifyResult = { status: string; job_id?: number; message?: string };

export async function verifyOtp(mobileNumber: string, otp: string): Promise<VerifyResult> {
  const res = await fetch(`${API_BASE}/api/v1/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_number: mobileNumber, otp }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function resendOtp(mobileNumber: string): Promise<{ message?: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_number: mobileNumber }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}
