import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string; // last/current crumb is rendered as plain text
};

// Standard editorial breadcrumb used at the top of section pages.
// Each crumb is clickable except the trailing one (current page).
export function Breadcrumb({
  crumbs,
  backHref,
  className = "",
}: {
  crumbs: Crumb[];
  /** Optional dedicated "← back" arrow shown before the trail. */
  backHref?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="breadcrumb"
      className={`font-mono text-[10px] tracking-[0.25em] text-muted flex flex-wrap items-baseline gap-x-2 ${className}`}
    >
      {backHref && (
        <Link
          href={backHref}
          className="hover:text-ink transition-colors"
          aria-label="뒤로"
        >
          ←
        </Link>
      )}
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-baseline gap-x-2">
            {i > 0 && <span aria-hidden>/</span>}
            {c.href && !isLast ? (
              <Link
                href={c.href}
                className="hover:text-ink transition-colors"
              >
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? "text-ink" : ""}>{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
