import { getAllSources } from "@/lib/data/repository";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CaptureForm } from "./CaptureForm";

export const dynamic = "force-dynamic";

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{
    text?: string;
    title?: string;
    url?: string;
  }>;
}) {
  const [sources, sp] = await Promise.all([
    getAllSources(),
    searchParams,
  ]);

  // PWA share_target / quick-link pre-fill. Other apps can send `text`
  // (selected passage), `title` (page title), and `url` (page URL).
  const sharedText = [sp.text, sp.url].filter(Boolean).join("\n\n");
  const sharedTitle = sp.title ?? "";

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

      <CaptureForm
        existingSources={sources}
        defaultText={sharedText}
        defaultTitle={sharedTitle}
      />
    </section>
  );
}
