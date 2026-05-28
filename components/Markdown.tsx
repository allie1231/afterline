import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Editorial-style markdown renderer. Tailwind classes keep the typography
// consistent with the rest of the app (serif body, mono code, paper bg).
export function Markdown({ source }: { source: string }) {
  return (
    <div className="markdown font-serif text-lg leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => (
            <h1 className="font-serif text-3xl tracking-tight mt-6 mb-3" {...p} />
          ),
          h2: (p) => (
            <h2 className="font-serif text-2xl tracking-tight mt-5 mb-2" {...p} />
          ),
          h3: (p) => (
            <h3 className="font-serif text-xl tracking-tight mt-4 mb-2" {...p} />
          ),
          p: (p) => <p className="mb-3 whitespace-pre-line" {...p} />,
          ul: (p) => (
            <ul className="list-disc pl-6 mb-3 flex flex-col gap-1" {...p} />
          ),
          ol: (p) => (
            <ol className="list-decimal pl-6 mb-3 flex flex-col gap-1" {...p} />
          ),
          blockquote: (p) => (
            <blockquote
              className="border-l-2 border-ink pl-4 italic text-muted my-3"
              {...p}
            />
          ),
          a: (p) => (
            <a
              {...p}
              className="underline decoration-1 underline-offset-2 hover:text-red"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          code: (props) => {
            const { className, children, ...rest } = props as {
              className?: string;
              children?: React.ReactNode;
            };
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return (
                <pre className="font-mono text-sm bg-line/40 border border-line p-3 overflow-x-auto my-3">
                  <code {...rest}>{children}</code>
                </pre>
              );
            }
            return (
              <code
                className="font-mono text-[0.92em] bg-line/40 px-1 py-0.5"
                {...rest}
              >
                {children}
              </code>
            );
          },
          hr: () => <hr className="border-line my-6" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
