/**
 * Consent copy for the OTP verification sheet (screen 7).
 *
 * The exact wording is legally load-bearing — keep it verbatim. Two consents
 * are required to proceed (`required: true`); the other two are optional
 * marketing/likeness permissions the user may decline.
 */
export type Consent = {
  id: "film" | "contact" | "marketing" | "likeness";
  required: boolean;
  text: string;
};

/** Standalone declaration shown above the checkboxes — agreed to by proceeding. */
export const eligibilityDeclaration =
  "I confirm I am 18+ and the parent or lawful guardian of the child/ward whose name and photo I'm providing, with full authority to consent on their behalf.";

export const consents: Consent[] = [
  {
    id: "film",
    required: true,
    text: "I consent to the Company using my details, my selfie, and my child/ward's photo and first name only to make and deliver our personalised film. The photos aren't used to train any AI and are erased after delivery.",
  },
  {
    id: "contact",
    required: true,
    text: "I consent to the HERO MOTOCORP LIMITED using my WhatsApp number to verify me (via OTP) and deliver my film and campaign-essential messages during the Campaign.",
  },
  {
    id: "marketing",
    required: false,
    text: "I agree the Company and its group entities may send me (the adult) marketing communications and use my data for research and analytics. My child/ward's data won't be used for marketing, profiling, tracking or targeted ads. I can withdraw anytime. (Optional)",
  },
  {
    id: "likeness",
    required: false,
    text: "I agree the Company may use my own selfie, name and likeness - not my child/ward's - in its ads, publicity and social media, without further approval or payment. I can withdraw anytime. (Optional)",
  },
];
