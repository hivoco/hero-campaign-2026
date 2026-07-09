import { z } from "zod";

/**
 * Validation for the OTP verification sheet (screen 7).
 *
 * The final "Submit & Generate" is gated on a complete 6-digit code AND both
 * required consents (`z.literal(true)`); the two marketing/likeness consents
 * are optional booleans that don't block submission.
 */
export const verifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  consentFilm: z.literal(true),
  consentContact: z.literal(true),
  marketingOptIn: z.boolean(),
  likenessOptIn: z.boolean(),
});

export type VerifyValues = z.infer<typeof verifySchema>;
