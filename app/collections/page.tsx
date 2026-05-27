import { getCollectionsItems } from "@/lib/data/repository";
import { CollectionsBrowser } from "./CollectionsBrowser";

export default async function CollectionsPage() {
  const items = await getCollectionsItems();

  return (
    <section className="px-6 py-10 max-w-6xl mx-auto">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-3">
        AFTERLINE / COLLECTIONS
      </div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
        Collections
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-10">
        수집노트 인덱스 — 모든 출처를 한 곳에서
      </p>

      <CollectionsBrowser items={items} />
    </section>
  );
}
