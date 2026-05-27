import Link from "next/link";

export default function EntrancePage() {
  return (
    <section className="min-h-[calc(100vh-77px)] flex flex-col justify-between px-8 py-16">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted">
        VOL. 01 / PERSONAL EDITORIAL ARCHIVE
      </div>

      <div className="flex flex-col gap-8 max-w-3xl">
        <h1 className="font-serif text-[clamp(80px,14vw,200px)] leading-[0.9] tracking-tight">
          After<span className="italic">line</span>
        </h1>
        <div className="font-serif text-2xl leading-snug max-w-lg">
          Lines that stayed after reading.
          <br />
          <span className="text-muted">읽고 난 뒤에도 남은 문장들.</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <Link
          href="/rooms"
          className="font-mono text-xs tracking-[0.3em] border border-ink px-6 py-4 hover:bg-ink hover:text-paper transition-colors"
        >
          [ ENTER ARCHIVE ]
        </Link>
        <div className="font-mono text-[10px] tracking-[0.2em] text-muted text-right leading-relaxed">
          A PRIVATE ARCHIVE
          <br />
          OF LINES THAT STAYED
          <br />
          AFTER READING, LISTENING,
          <br />
          AND LIVING.
        </div>
      </div>
    </section>
  );
}
