export type Language = {
  /** ISO-ish code used as the single-select value and the query param passed onward. */
  code: string;
  /** English name shown on the row. */
  label: string;
};

/** The seven languages offered on the Language Selection screen. */
export const languages: Language[] = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "bn", label: "Bengali" },
];
