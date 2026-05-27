export function Placeholder({
  en,
  ko,
  note,
}: {
  en: string;
  ko: string;
  note?: string;
}) {
  return (
    <section className="px-6 py-20 max-w-3xl">
      <div className="font-mono text-[10px] tracking-[0.25em] text-muted mb-6">
        AFTERLINE / {en.toUpperCase()}
      </div>
      <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-none">{en}</h2>
      <div className="font-mono text-xs tracking-[0.2em] text-muted mt-3">
        {ko}
      </div>
      <p className="font-serif text-2xl text-muted mt-12 max-w-xl">
        This room is being prepared.
      </p>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted mt-2">
        이 화면은 다음 Phase 에서 채워집니다.
      </p>
      {note && (
        <p className="font-sans text-sm mt-8 max-w-lg leading-relaxed">
          {note}
        </p>
      )}
    </section>
  );
}
