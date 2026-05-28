import { getCollectionsItems } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CollectionsBrowser } from "../collections/CollectionsBrowser";

export default async function CardsPage() {
  const items = await getCollectionsItems();

  return (
    <section className="px-6 py-10 max-w-6xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "CARDS" },
        ]}
        className="mb-3"
      />
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
        Cards
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-10">
        표지·이미지 카드 인덱스 — 시각적으로 한눈에
      </p>

      <CollectionsBrowser items={items} defaultView="cards" />
    </section>
  );
}
