import { LanguageSelect } from "@/components/language-select";

export default async function LanguagePage({
  searchParams,
}: {
  searchParams: Promise<{ world?: string; story?: string }>;
}) {
  // Carry the world + story chosen earlier forward to /details with the language.
  const { world, story } = await searchParams;
  return (
    <main>
      <LanguageSelect world={world} story={story} />
    </main>
  );
}
