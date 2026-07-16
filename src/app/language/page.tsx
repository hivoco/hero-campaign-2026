import { Suspense } from "react";

import { LanguageSelect } from "@/components/language-select";

export default function LanguagePage() {
  return (
    <main>
      {/* LanguageSelect reads the `?lang=` deep-link via useSearchParams, so it
          must sit under a Suspense boundary (Next 16 requirement). */}
      <Suspense fallback={null}>
        <LanguageSelect />
      </Suspense>
    </main>
  );
}
