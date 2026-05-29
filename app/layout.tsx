import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { FloatingNav } from "@/components/FloatingNav";
import { SideNav } from "@/components/SideNav";
import { createClient } from "@/lib/supabase/server";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Afterline",
  description: "Lines that stayed after reading. 읽고 난 뒤에도 남은 문장들.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Afterline",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f1e8",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="ko"
      className={`${cormorant.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink">
        {user && <AppHeader />}
        <main>{children}</main>
        {user && <SideNav />}
        {user && <FloatingNav />}
      </body>
    </html>
  );
}
