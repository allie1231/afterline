// Bare layout for /q/* — no AppHeader / nav so the public quote page
// stands alone for sharing.
export default function PublicQuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
