/**
 * Maps a UI selection to the value the backend accepts.
 *   - lang → backend language label (free string; defaults to "English")
 *
 * (World was removed, and the story slug is now sent to the backend verbatim as
 * `challenge`, so no world/story translation is needed here anymore.)
 */
import { languages } from "@/lib/languages";

const LANG_LABEL: Record<string, string> = Object.fromEntries(
  languages.map((l) => [l.code, l.label]),
);

export function langToLanguage(code: string | null | undefined): string {
  return (code && LANG_LABEL[code]) || "English";
}
