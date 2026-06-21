import type { Metadata, Viewport } from "next";
import { Cause, Inter } from "next/font/google";
import "./globals.css";

const cause = Cause({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Before the Title | A Living Archive",
  description:
    "Your reflection becomes art. Your voice becomes story. An ongoing participatory art project about who we are beyond our titles.",
  openGraph: {
    title: "Before the Title | A Living Archive",
    description:
      "An ongoing participatory art project about who we are beyond our titles.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAFAF8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cause.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <div className="fixed inset-0 bg-white/70 pointer-events-none" style={{ zIndex: 0 }} />
        <div className="relative flex flex-col h-screen overflow-hidden" style={{ zIndex: 1 }}>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </body>
    </html>
  );
}
