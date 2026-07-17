export type Language = {
  /** ISO-ish code used as the single-select value and the query param passed onward. */
  code: string;
  /** English name shown on the row. */
  label: string;
};

/** The seven languages offered on the Language Selection screen. */
export const languages: Language[] = [
  { code: "hindi", label: "Hindi" },
  { code: "english", label: "English" },
  { code: "tamil", label: "Tamil" },
  { code: "telugu", label: "Telugu" },
  { code: "kannada", label: "Kannada" },
  { code: "malayalam", label: "Malayalam" },
  { code: "bengali", label: "Bengali" },
  { code: "marathi", label: "Marathi" },
  { code: "gujarati", label: "Gujarati" },
];
  