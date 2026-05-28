import { getAllSources } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CaptureForm } from "./CaptureForm";

export default async function CapturePage() {
  const sources = await getAllSources();

  return (
    <section className="px-4 py-6 max-w-xl mx-auto">
      <Breadcrumb
        crumbs={[
          { label: "AFTERLINE", href: "/" },
          { label: "CAPTURE" },
        ]}
        className="mb-2"
      />
      <h1 className="font-serif text-3xl tracking-tight leading-tight">
        Quick Capture
      </h1>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted mt-2 mb-6">
        모바일에서 빠르게 — 붙여넣고, 검색하고, 저장.
      </p>

      <CaptureForm existingSources={sources} />
    </section>
  );
}
