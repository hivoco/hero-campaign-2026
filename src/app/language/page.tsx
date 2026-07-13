import { LanguageSelect } from "@/components/language-select";
import { getWorldBySlug } from "@/lib/worlds";

export default async function LanguagePage({
  searchParams,
}: {
  searchParams: Promise<{ world?: string }>;
}) {
  const { world: worldSlug } = await searchParams;
  const world = getWorldBySlug(worldSlug);

  return (
    <main>
      <LanguageSelect world={world} />
    </main>
  );
}
