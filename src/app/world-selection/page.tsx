import { WorldCarousel } from "@/components/world-carousel";
import { worlds } from "@/lib/worlds";

export default function WorldSelectionPage() {
  return (
    <main>
      <WorldCarousel worlds={worlds} />
    </main>
  );
}
