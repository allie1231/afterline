import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Inter,
  IBM_Plex_Mono,
  Gowun_Batang,
  Noto_Sans_KR,
} from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { FloatingNav } from "@/components/FloatingNav";
import { SideNav } from "@/components/SideNav";

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

const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gowun",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
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
  themeColor: "#f7f7f5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${cormorant.variable} ${inter.variable} ${plexMono.variable} ${gowunBatang.variable} ${notoSansKR.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink">
        <AppHeader />
        <main>{children}</main>
        <SideNav />
        <FloatingNav />
      </body>
    </html>
  );
}
