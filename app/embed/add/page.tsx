// Embeddable quick-add widget — paste/type a line, submit, done.
// Usage:
//   <iframe src="https://afterline-pi.vercel.app/embed/add?token=<TOKEN>">
// Optional `?title=...` sets the inbox source title (defaults to "Quick Notes").
//
// Token in the URL is the user's Personal Token from /settings. The API
// validates it server-side via the service-role key; the iframe just relays.

import { EmbedAddForm } from "@/components/EmbedAddForm";

export const dynamic = "force-dynamic";

export default async function EmbedAddPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; title?: string }>;
}) {
  const { token, title } = await searchParams;

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-paper text-ink">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted text-center">
          AFTERLINE / NO TOKEN
          <div className="mt-3 normal-case tracking-normal font-serif text-base">
            ?token=… 쿼리에 Personal Token이 필요해요.
          </div>
        </div>
      </main>
    );
  }

  return <EmbedAddForm token={token} defaultTitle={title?.trim() || "Quick Notes"} />;
}
