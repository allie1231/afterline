import { getData } from "@/lib/notion";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DataPanel } from "./DataPanel";

export default async function DataPage() {
  const { sources, quotes } = await getData();

  const keyBySourceId = new Map<string, string>();
  for (const s of sources) {
    keyBySourceId.set(s.id, `${s.type}|${s.title}`);
  }
  const dupeKeys: string[] = [];
  for (const q of quotes) {
    if (q.source_id) {
      const k = keyBySourceId.get(q.source_id);
      if (k) dupeKeys.push(`${k}||${q.text}`);
    }
  }

  return (
    <section className="px-6 py-10 max-w-4xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "DATA" },
        ]}
        className="mb-3"
      />
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">
        Data
      </h1>
      <p className="font-mono text-xs tracking-[0.2em] text-muted mt-3 mb-12">
        백업 · 가져오기 · 내보내기
      </p>

      <DataPanel existingDupeKeys={dupeKeys} />
    </section>
  );
}
